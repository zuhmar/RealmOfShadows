-- Run AFTER 202610230001_character_saves.sql. Safe to rerun.
-- Only the authoritative server may claim characters or write saves.
begin;
alter table public.character_saves add column if not exists active_session uuid;
alter table public.character_saves add column if not exists lease_expires timestamptz;

create or replace function public.claim_character(p_user_id uuid,p_session_id uuid,p_initial_progress jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare result jsonb;
begin
 if p_session_id is null then raise exception 'Missing session'; end if;
 insert into public.character_saves(user_id,progress,active_session,lease_expires)
 values(p_user_id,p_initial_progress,p_session_id,pg_catalog.now()+interval '60 seconds')
 on conflict(user_id) do update set active_session=excluded.active_session,lease_expires=excluded.lease_expires
 where public.character_saves.active_session is null
    or public.character_saves.lease_expires<=pg_catalog.now()
    or public.character_saves.active_session=p_session_id
 returning progress into result;
 if result is null then raise exception 'CHARACTER_IN_USE'; end if;
 return result;
end;
$$;

create or replace function public.save_character(p_user_id uuid,p_session_id uuid,p_progress jsonb,p_release boolean default false)
returns timestamptz language plpgsql set search_path = '' as $$
declare saved timestamptz;
begin
 update public.character_saves set progress=p_progress,
 active_session=case when p_release then null else p_session_id end,
 lease_expires=case when p_release then null else pg_catalog.now()+interval '60 seconds' end
 where user_id=p_user_id and active_session=p_session_id and lease_expires>pg_catalog.now()
 returning updated_at into saved;
 if saved is null then raise exception 'SAVE_SESSION_EXPIRED'; end if;
 return saved;
end;
$$;

revoke all on function public.claim_character(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.save_character(uuid,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.claim_character(uuid,uuid,jsonb) to service_role;
grant execute on function public.save_character(uuid,uuid,jsonb,boolean) to service_role;
commit;
