# Four characters per account

After signing in, or continuing a restored sign-in, players choose one of four
character slots. Existing saves occupy slot 1 as Adventurer. Empty slots offer a
name field and Create character; creation starts a level-1 Citizen using the
existing starter loadout. Class choice still unlocks at level 5. There is no
character deletion or automatic reset. Guest play stays temporary and does not
use persistent slots.

Each character has independent gold, EXP, class, skills, attributes, equipment,
inventory, Depot, spells, cosmetics, professions, quests and monster tasks.
Housing ownership remains account-wide to preserve existing owned homes;
house purchases/decorating debit the active character and commit its save
atomically with the house update. Save-session leases are per character. A
second connection cannot load the same character while its lease is active.
Different slots cannot overwrite each other, including delayed autosaves.

Profile → Switch character saves/leaves the current character and opens the
four-slot screen without signing out. A page reload always returns to explicit
login/character choices rather than automatically entering the world. Names and
class/level portraits help identify slots. Names are limited to 24 characters;
existing names are not changed by submitting a different creation name.

## Required deployment order

1. In Supabase SQL Editor, run the complete contents of
   `supabase/migrations/202610310001_character_slots.sql` after the four existing
   migrations. It is transactional and safe to rerun. It adds `slot` (1–4) and
   `name`, changes the key to `(user_id,slot)`, and updates the save/housing RPCs.
   Existing progress JSON is retained verbatim in slot 1.
2. Deploy Render from the new commit so it exposes the authenticated roster and
   uses slot-specific claim/save/housing RPCs.
3. Deploy Vercel from the same commit. Existing environment variables still
   apply; no new secrets or environment variables are needed.

The migration keeps legacy RPC signatures as slot-1-only wrappers, so an old
server cannot accidentally update all four characters during deployment. Do
not rerun older migrations after this one. No production SQL has been executed
by this implementation; the migration has been tested against a local database.

## Access and validation

GET `/characters` on the game server verifies the Supabase bearer token and
returns only that account's four slot summaries (name, level, class and skin).
It does not return save JSON, inventories or tokens. Empty slots are represented
explicitly. Roster and save RPCs are service-role-only; clients cannot choose a
user ID to access another account. Responses are not cached.

The game join includes `characterSlot` and optional `characterName`. The server
validates the slot/name, verifies the token, and claims the selected row. SQL
also enforces slot bounds, uniqueness and lease ownership. Repeated creation
requests do not replace existing progress. Legacy joins omitting a slot remain
restricted to slot 1. Database or roster failures keep the player out of the
world with a retry option, without falling back to an unsaved account session.

Validation: `npm test`, `npm run build`, `npm run test:character-slots:browser`
(desktop/mobile login, all four creations/selections, isolated saves, switching,
reload and server restart), `npm run test:story:integration`, and
`npm run test:accounts:browser`. Database tests cover migration preservation and
reruns, slot limits, isolated leases/saves, account privacy, RPC permissions and
housing transactions charged to the selected slot.
