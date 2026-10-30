-- Run after character saves and save sessions. Global ownership, atomic with character items/gold.
begin;
create table if not exists public.player_houses(
 id text primary key, price integer not null check(price>0),
 owner_id uuid references auth.users(id), owner_name text not null default '',
 revision integer not null default 0, displays jsonb not null default '[]'::jsonb,
 check(jsonb_typeof(displays)='array' and jsonb_array_length(displays)<=18)
);
alter table public.player_houses enable row level security;
revoke all on public.player_houses from public,anon,authenticated;
grant select,update,insert on public.player_houses to service_role;
insert into public.player_houses(id,price) values ('briar',500),('pinewatch',1000),('stonebend',1500),('eastridge',2500),('sunset',750) on conflict(id) do nothing;
create or replace function public.list_player_houses() returns jsonb language sql set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'ownerId',owner_id,'ownerName',owner_name,'revision',revision,'displays',displays)),'[]'::jsonb) from public.player_houses;
$$;
create or replace function public.commit_player_house(p_user_id uuid,p_session_id uuid,p_house_id text,p_revision integer,p_record jsonb,p_progress jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare h public.player_houses; s public.character_saves; saved timestamptz;
begin
 select * into h from public.player_houses where id=p_house_id for update;
 if not found or h.revision<>p_revision then raise exception 'HOUSE_CHANGED'; end if;
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
revoke all on function public.list_player_houses() from public,anon,authenticated;
revoke all on function public.commit_player_house(uuid,uuid,text,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.list_player_houses() to service_role;
grant execute on function public.commit_player_house(uuid,uuid,text,integer,jsonb,jsonb) to service_role;
commit;
