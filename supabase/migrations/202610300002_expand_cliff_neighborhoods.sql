-- Run after 202610300001_player_housing.sql. Idempotent; preserves all owners and items.
begin;
alter table public.player_houses add column if not exists layout_version integer not null default 1;
with offsets(id,dx,dy) as (values ('briar',-1,6),('pinewatch',-4,6),('stonebend',6,14),('eastridge',45,15),('sunset',-9,45))
update public.player_houses h set
 displays=coalesce((select jsonb_agg(jsonb_set(jsonb_set(d,'{x}',to_jsonb((d->>'x')::numeric+o.dx)),'{y}',to_jsonb((d->>'y')::numeric+o.dy))) from jsonb_array_elements(h.displays) d),'[]'::jsonb),
 revision=revision+case when jsonb_array_length(displays)>0 then 1 else 0 end,layout_version=2
from offsets o where h.id=o.id and h.layout_version<2;
insert into public.player_houses(id,price,layout_version) values ('briar',500,2),('pinewatch',1000,2),('north3',1500,2),('north4',2500,2),('north5',750,2),('stonebend',1500,2),('west2',500,2),('west3',1000,2),('west4',2500,2),('west5',750,2),('eastridge',2500,2),('east2',500,2),('east3',1000,2),('east4',1500,2),('east5',750,2),('sunset',750,2),('south2',500,2),('south3',1000,2),('south4',1500,2),('south5',2500,2) on conflict(id) do nothing;

-- Reject mutations from the previous map layout during a rolling deployment.
create or replace function public.commit_player_house(p_user_id uuid,p_session_id uuid,p_house_id text,p_revision integer,p_record jsonb,p_progress jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare h public.player_houses; s public.character_saves; saved timestamptz;
begin
 select * into h from public.player_houses where id=p_house_id for update;
 if not found or h.revision<>p_revision then raise exception 'HOUSE_CHANGED'; end if;
 if h.layout_version<>2 or (p_record->>'layoutVersion') is distinct from '2' then raise exception 'HOUSE_LAYOUT_CHANGED'; end if;
 select * into s from public.character_saves where user_id=p_user_id for update;
 if not found or s.active_session is distinct from p_session_id or s.lease_expires<=pg_catalog.now() then raise exception 'SAVE_SESSION_EXPIRED'; end if;
 if h.owner_id is not null and h.owner_id<>p_user_id then raise exception 'HOUSE_NOT_OWNER'; end if;
 if (p_record->>'ownerId')::uuid is distinct from p_user_id or p_record->>'id'<>p_house_id or length(p_record->>'ownerName') not between 1 and 40 then raise exception 'INVALID_HOUSE'; end if;
 if jsonb_typeof(p_record->'displays')<>'array' or jsonb_array_length(p_record->'displays')>18 or (p_progress#>>'{profile,gold}')::bigint<0 then raise exception 'INVALID_HOUSE'; end if;
 update public.character_saves set progress=p_progress,lease_expires=pg_catalog.now()+interval '60 seconds' where user_id=p_user_id returning updated_at into saved;
 update public.player_houses set owner_id=p_user_id,owner_name=p_record->>'ownerName',revision=revision+1,displays=p_record->'displays' where id=p_house_id;
 return jsonb_build_object('savedAt',saved);
end;
$$;
commit;
