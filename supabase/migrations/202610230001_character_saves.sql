-- Run in the Supabase SQL Editor for the Realm of Shadows project.
-- Auth accounts are managed by Supabase. Only the game server writes progress.
begin;

create table if not exists public.character_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version = 1),
  progress jsonb not null check (jsonb_typeof(progress) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.character_saves enable row level security;
revoke all on public.character_saves from anon, authenticated;
grant select on public.character_saves to authenticated;
grant select, insert, update, delete on public.character_saves to service_role;

drop policy if exists "Players read their own character" on public.character_saves;
create policy "Players read their own character"
  on public.character_saves for select to authenticated
  using ((select auth.uid()) = user_id);

-- Keep timestamps and revision numbers server-controlled for future save checks.
create or replace function public.stamp_character_save()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := pg_catalog.now();
  new.revision := old.revision + 1;
  return new;
end;
$$;
revoke all on function public.stamp_character_save() from public;
drop trigger if exists stamp_character_save on public.character_saves;
create trigger stamp_character_save before update on public.character_saves
  for each row execute function public.stamp_character_save();

commit;
