# Hosted accounts and character saves

The client uses Supabase email/password Auth. The multiplayer server verifies
access tokens with Supabase before claiming a character. Guest play remains
available and session-only; signing in loads the account's character and does
not transfer the current guest's progress.

## Setup

1. Supabase Authentication → URL Configuration: set the production site URL and
   allowed redirect to `https://realm-of-shadows-client-ah6e.vercel.app/`.
2. Run BOTH files in the Supabase SQL Editor, in order:
   - `migrations/202610230001_character_saves.sql`
   - `migrations/202610230002_save_sessions.sql`
   Both can be rerun without deleting character progress. The second migration
   is required even if the character table was created earlier.
3. On the Render multiplayer service, configure `SUPABASE_URL` and
   `SUPABASE_SECRET_KEY`. These are server variables; never prefix the secret
   with `VITE_`, publish it to GitHub, or place it in client settings. The new
   secret key and legacy service-role JWT are both supported by the server.
4. On Vercel, configure public `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`, and
   `VITE_SERVER_URL=wss://realmofshadows.onrender.com`. Redeploy after changing
   client variables: Vite embeds them at build time. The client trims pasted
   whitespace and accepts a copied `/rest/v1/` path. Invalid account settings
   disable sign-in with a visible warning while allowing the game to start;
   they must not prevent Phaser from loading.
5. Deploy the client and server. Use the starting screen to create an account. If email
   confirmation is enabled, confirm the email before signing in. Use your own
   email; the account UI does not ask for database or server credentials.

No live production migration was run from this workspace. It has no Supabase
administration connection. The public Render health endpoint reports whether
account environment variables are configured, not whether their credentials
or the database migration have been verified.

## Saved behavior

One character per Supabase account. Saves include class, equipped and owned
weapons, character EXP, gold, skill EXP, inventory, and learned spells. Levels
and skill levels are recomputed from EXP when loading. Timed potion and spell
cooldowns save their remaining durations and resume on login; being offline
cannot bypass them. Uncollected loot, attack targets, and running attacks are
session-only. Rejoining starts alive, with full vitals at the safe Elderwood
spawn; exact position is not persisted.

Transactions request a save immediately. A save already in flight is allowed to
finish; the next autosave captures later mutations. Accounts autosave every five
seconds and save/release on disconnect or sign-out. A crash may lose changes
since the last completed save. Wait for the profile's saved timestamp before
closing the game after important actions.

The database issues exclusive 60-second character leases; each autosave renews
its lease. Two tabs, rooms or server instances cannot control the same character
at once. Old servers cannot write after a lease expires or changes ownership.
After an unclean shutdown, reconnecting may require waiting up to a minute.
Per-character writes are serialized so a delayed save cannot overwrite a later
purchase or sign-out. A failed cloud save disconnects the account; the game never
silently switches a signed-in character into unsaved local preview. Reload to
reconnect. Invalid saved data is rejected rather than reset or overwritten.

Every launch begins at the login screen, including when a saved Supabase login
exists. Choose Sign in/Create account, Continue adventure for a remembered
account, or Play as guest. No simulation or multiplayer join begins before that
choice. Signed-out and unconfigured builds can still explicitly choose guest/local
preview mode, which is unsaved. Account loading failures stay on the login screen
with Retry; they never select guest mode automatically. Guests may use Return to
login in their profile; leaving discards that guest character. Signing out saves, leaves the account's room, and returns to the login screen; it does not automatically start a guest character. Sessions persist in browser storage and refresh through
Supabase Auth. Passwords go only to Supabase. Password reset UI and multiple
character slots are not implemented yet.

## Database access

Row-level security lets authenticated players read only their own save. Anonymous
users cannot read saves. Browser users cannot insert, update or delete progress,
or call claim/save RPCs, even with a valid login. Only the game server's private
service credential writes progress. The server validates the stored shape and
all gameplay changes. Account IDs come from verified tokens, never client claims.
Email and save status are private room messages, not replicated to other players.

## Validation

- `npm test`: save validation, remaining cooldowns, queue ordering, and the real
  PostgreSQL migrations/RLS/lease functions under PGlite.
- `npm run test:accounts`: isolated mock Supabase Auth + real PostgreSQL RPCs +
  real Colyseus server; restart persistence, verified tokens, duplicate sessions,
  private saves, equipment and merchant transactions, corrupt saves and outages.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:accounts:browser`:
  real Supabase client SDK against a local auth fixture, login/reload/sign-out,
  email-confirmation messaging and signed-in server failure behavior.

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:startup`:
  actual production builds with valid, malformed, API-path and missing account
  settings; checks the game canvas, rendered portrait and working profile dialog.

These fixtures use fake users/keys and do not access your production Supabase
project. Normal gameplay suites remain available and should run sequentially
against a dedicated game server.
