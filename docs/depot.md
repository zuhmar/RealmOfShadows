# Elderwood Depot

The old tavern is now the **Depot**. It is built from native 32px floor and wall
sprites on the village grid, with no roof or separate indoor instance. Players
outside can see inside. Enter through the three-cell south doorway. Solid walls
and storage boxes block movement; the interior floor remains walkable. The
front wall fades to 35% opacity while a player is inside.

Three boxes sit along the north wall. Click or tap any box to walk over and
open personal storage. Space also opens a nearby box. Every box accesses the
same character-owned contents; two players using a box never share contents.
Mara stands beside the Depot entrance on the main village path.

Storage has **100 shared slots**, separate from the 32-slot bag. Each supply
stack or equipment item uses one slot. Transfer buttons move whole supply
stacks, individual dropped gear, or ordinary unequipped equipment/weapons.
Supplies merge up to their normal stack limits. Depositing equipped items is
rejected; unequip them in the bag first. Withdrawals that exceed bag capacity
and deposits that exceed storage capacity leave both inventories unchanged.
Existing stacks can still be filled without consuming another slot.

Dropped gear keeps its UUID, rarity and derived bonuses. Identification and
equipment actions apply to gear in the bag, not stored items. Catalogue items
have unique ownership within each destination: withdrawing an already-owned
base item is rejected. Transfers grant no gold or training XP.

The server validates location beside a real box, ownership, equipped state,
capacity and life state for every transfer. Item IDs from another player and
extra request fields do not grant access. Repeated requests cannot duplicate
items. Depot data is included only in the owner's private economy snapshot.

Signed-in storage is saved atomically with the rest of the character in the
existing Supabase progress JSON. Supply IDs are included when restoring the
server's ID counter. Old saves receive empty storage; malformed, oversized,
duplicate or forged saved items are rejected. No SQL migration is required.
Guest storage lasts only for the active session, as indicated in the dialog.

Artwork: original master in `assets/world/depot/master.png`, with measured
extraction in `scripts/extract-depot-sprites.py` (`npm run art:depot`). Walls,
floor and box are native 32×32 sprites; the sign is 96×40. Runtime props are
individual transparent PNGs in `assets/world/objects/`. The original tavern art
is retained in assets but is no longer placed on the live village map.

Checks: `npm test`, `npm run build`, `npm run test:depot:browser`,
`npm run test:depot:integration`, and `npm run test:accounts`.
Browser default: localhost:5220; multiplayer default: ws://localhost:2620.
Override with TEST_CLIENT_URL / TEST_SERVER_URL. Deploy both Vercel and Render
from the same commit so storage rules and UI agree.
