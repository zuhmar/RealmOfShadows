-- Apply after the four earlier migrations. Existing progress remains in slot 1.
-- Safe to rerun. No save JSON is rewritten or deleted.
begin;
alter table public.character_saves add column if not exists slot integer not null default 1 check(slot between 1 and 4);
alter table public.character_saves add column if not exists name text not null default 'Adventurer' check(length(name) between 1 and 24);
alter table public.character_saves drop constraint if exists character_saves_pkey;
alter table public.character_saves add primary key(user_id,slot);
create or replace function public.claim_character_slot(p_user_id uuid,p_session_id uuid,p_initial_progress jsonb,p_slot integer,p_name text)
returns jsonb language plpgsql set search_path = '' as $$
declare result jsonb;
begin
 if p_slot is null or p_slot not between 1 and 4 then raise exception 'INVALID_CHARACTER_SLOT'; end if;
 if p_name='' and not exists(select 1 from public.character_saves where user_id=p_user_id and slot=p_slot) then raise exception 'CHARACTER_EMPTY'; end if;
 if length(coalesce(nullif(p_name,''),'Adventurer')) not between 1 and 24 then raise exception 'INVALID_CHARACTER_NAME'; end if;
 if p_session_id is null then raise exception 'Missing session'; end if;
 insert into public.character_saves(user_id,progress,active_session,lease_expires,slot,name)
 values(p_user_id,p_initial_progress,p_session_id,pg_catalog.now()+interval '60 seconds',p_slot,coalesce(nullif(p_name,''),'Adventurer'))
 on conflict(user_id,slot) do update set active_session=excluded.active_session,lease_expires=excluded.lease_expires
 where public.character_saves.active_session is null
    or public.character_saves.lease_expires<=pg_catalog.now()
    or public.character_saves.active_session=p_session_id
 returning progress into result;
 if result is null then raise exception 'CHARACTER_IN_USE'; end if;
 return result;
end;
$$;

create or replace function public.save_character_slot(p_user_id uuid,p_session_id uuid,p_progress jsonb,p_release boolean,p_slot integer)
returns timestamptz language plpgsql set search_path = '' as $$
declare saved timestamptz;
begin
 update public.character_saves set progress=p_progress,
 active_session=case when p_release then null else p_session_id end,
 lease_expires=case when p_release then null else pg_catalog.now()+interval '60 seconds' end
 where user_id=p_user_id and slot=p_slot and active_session=p_session_id and lease_expires>pg_catalog.now()
 returning updated_at into saved;
 if saved is null then raise exception 'SAVE_SESSION_EXPIRED'; end if;
 return saved;
end;
$$;

create or replace function public.commit_player_house_slot(p_user_id uuid,p_session_id uuid,p_house_id text,p_revision integer,p_record jsonb,p_progress jsonb,p_slot integer)
returns jsonb language plpgsql set search_path='' as $$
declare h public.player_houses; s public.character_saves; saved timestamptz;
begin
 select * into h from public.player_houses where id=p_house_id for update;
 if not found or h.revision<>p_revision then raise exception 'HOUSE_CHANGED'; end if;
 if h.layout_version<>2 or (p_record->>'layoutVersion') is distinct from '2' then raise exception 'HOUSE_LAYOUT_CHANGED'; end if;
 select * into s from public.character_saves where user_id=p_user_id and slot=p_slot for update;
 if not found or s.active_session is distinct from p_session_id or s.lease_expires<=pg_catalog.now() then raise exception 'SAVE_SESSION_EXPIRED'; end if;
 if h.owner_id is not null and h.owner_id<>p_user_id then raise exception 'HOUSE_NOT_OWNER'; end if;
 if (p_record->>'ownerId')::uuid is distinct from p_user_id or p_record->>'id'<>p_house_id or length(p_record->>'ownerName') not between 1 and 40 then raise exception 'INVALID_HOUSE'; end if;
 if jsonb_typeof(p_record->'displays')<>'array' or jsonb_array_length(p_record->'displays')>18 or (p_progress#>>'{profile,gold}')::bigint<0 then raise exception 'INVALID_HOUSE'; end if;
 update public.character_saves set progress=p_progress,lease_expires=pg_catalog.now()+interval '60 seconds' where user_id=p_user_id and slot=p_slot returning updated_at into saved;
 update public.player_houses set owner_id=p_user_id,owner_name=p_record->>'ownerName',revision=revision+1,displays=p_record->'displays' where id=p_house_id;
 return jsonb_build_object('savedAt',saved);
end;
$$;

create or replace function public.list_character_slots(p_user_id uuid) returns jsonb language sql set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'name',name,'progress',progress) order by slot),'[]'::jsonb) from public.character_saves where user_id=p_user_id;
$$;
-- Legacy callers remain restricted to slot 1, including housing transactions.
create or replace function public.claim_character(p_user_id uuid,p_session_id uuid,p_initial_progress jsonb) returns jsonb language sql set search_path='' as $$ select public.claim_character_slot(p_user_id,p_session_id,p_initial_progress,1,'Adventurer'); $$;
create or replace function public.save_character(p_user_id uuid,p_session_id uuid,p_progress jsonb,p_release boolean default false) returns timestamptz language sql set search_path='' as $$ select public.save_character_slot(p_user_id,p_session_id,p_progress,p_release,1); $$;
create or replace function public.commit_player_house(p_user_id uuid,p_session_id uuid,p_house_id text,p_revision integer,p_record jsonb,p_progress jsonb) returns jsonb language sql set search_path='' as $$ select public.commit_player_house_slot(p_user_id,p_session_id,p_house_id,p_revision,p_record,p_progress,1); $$;
revoke all on function public.claim_character_slot(uuid,uuid,jsonb,integer,text),public.save_character_slot(uuid,uuid,jsonb,boolean,integer),public.commit_player_house_slot(uuid,uuid,text,integer,jsonb,jsonb,integer),public.list_character_slots(uuid) from public,anon,authenticated;
grant execute on function public.claim_character_slot(uuid,uuid,jsonb,integer,text),public.save_character_slot(uuid,uuid,jsonb,boolean,integer),public.commit_player_house_slot(uuid,uuid,text,integer,jsonb,jsonb,integer),public.list_character_slots(uuid) to service_role;
commit;
