# Hosted accounts and saves: setup in progress

The client environment variables alone do not enable sign-in or saved progress.
Supabase Auth will manage accounts; the authoritative multiplayer server will
validate access tokens and write character progress. Existing guest play is
unchanged until that integration is implemented.

1. In Supabase Authentication → URL Configuration, configure the production site
   URL and allowed redirects.
2. In Vercel, configure `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` for the client. These are public configuration.
3. Run `migrations/202610230001_character_saves.sql` in the project's SQL Editor.
   It creates one save per Supabase account, enables row-level security and lets
   authenticated players read only their own row. Browser users cannot insert,
   update or delete progress, even with a valid login. The game server will
   validate all progress and use a private server-side credential for writes.
4. Set up a long-lived WebSocket-capable multiplayer host. Vercel hosts the
   client, not the Colyseus process. Configure its Supabase credentials privately
   on that host; never use a `VITE_` prefix for secret/server credentials.
5. Implement and test account UI, token validation, save/load, duplicate-session
   protection and reconnect behavior before enabling persistent play.

The migration can be rerun without deleting character rows. It must be applied
in Supabase before save/load is enabled. No production migration has been run
from this workspace; it currently has no Supabase administration connection.

A database `progress` object is a versioned snapshot; detailed gameplay validation
belongs on the trusted game server. The revision increases on every update so
future writes can reject stale saves. Uncollected ground drops, combat targets,
and running attacks are not intended to be persisted. Existing documentation
about session-only gameplay remains accurate until save/load is implemented.
