# Elderwood Depot

The old tavern is now the **Depot**. It is built from native 32px floor and wall
sprites on the village grid, with no roof or separate indoor instance. Players
outside can see inside. Enter through the three-cell south doorway. Walls block crossing the room’s tile boundaries; storage boxes occupy their own
cells. Every other floor cell, including the cells beside walls, is walkable. The
south wall fades to 35% opacity while a player is inside.

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

## Directional edge-wall kit

Eight wall sprites are extracted from `assets/world/depot/walls-master.png`:
`depot-wall-nw`, `ne`, `sw`, `se` are distinct L-shaped corner tiles; `n`, `e`,
`s`, `w` are straight edge strips. Every canvas is exactly 32×32. North strips
occupy y=0–8, south strips y=23–31, west strips x=0–7 and east strips x=24–31.
The tile center stays transparent. Their connected ends reach tile boundaries,
so they form one continuous rectangular outline rather than posts in tile centers.
`npm run art:depot` rebuilds the original props and this directional kit.

The room's outer boundaries are x=5 and x=14, y=2 and y=9 in world-cell units.
The three south entrance cells (x=8,9,10) have no blocking edge. `GridMap.edges`
stores horizontal and vertical barriers independently from occupied/solid cells.
Shared movement, pathfinding, footprint collision, sight and charge attacks
all respect the same edges. Diagonals check both orthogonal passages at a join.
`tests/depot-walls.test.ts` covers orientations, usable wall-adjacent floor,
bidirectional wall blocking, doorway access and corner/jamb clipping.
