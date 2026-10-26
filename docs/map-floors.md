# Map floors

Crystal Caverns has two depths. Enter the Caverns through the village portal,
follow the central path north across the mine bridge, and find the **Down to
Depth 2** stairs at Prismatic Crossing. Click/tap the stairs to approach and
descend. Click the ascending stairs at Lower Landing to return to Depth 1.
Space also uses nearby stairs. Transitions require an explicit interaction, so
arriving beside a staircase cannot immediately bounce the player back.

Depth 2 is a 2304×1728 source map (48×36 world units), built with native 32px
terrain and multi-tile prefabs. Five chambers connect through a looping path:
Lower Landing, Sunken Roost, Violet Hollow, Deep Crystal Gallery and Forgotten
Vault. There are six bats, six crawlers, and five golems. The reservoir blocks
movement except across its bridge. The existing upper map and Crystal Wyrm
encounter remain intact.

Each depth uses its own area key in the existing authoritative region channel:
`caverns` and `caverns-depths`. This separates geometry, navigation, players,
monsters, projectiles, effects and private drops without adding another island
to the portal menu. The lower area belongs to Crystal Caverns for equipment
drops, so both depths drop Copper. Its landing is a protected arrival area.
Server-controlled stairs validate floor, proximity, life and connection state,
clear pending movement/attacks, and place players at collision-tested landings.
Cross-floor attacks and ordinary portal travel into/out of Depth 2 are rejected.

Definitions:

- `packages/game-data/src/floors.ts`: directed stair connections and parent island.
- `packages/game-data/src/caverns-depths.ts`: terrain, geometry, props and spawns.
- `packages/game-data/src/terrain-plan.ts`: floor-specific tiled rendering.
- `assets/generated/caverns-stairs.png`: preserved generated stair master.
- `apps/client/src/stair-frames.ts`: measured transparent-frame bounds.

`npm run art:map-tiles` rebuilds the multi-tile stairs. With Vite running,
`npm run art:map-previews` exports both Caverns depths. The ordinary floor menu
still lists islands only. Add future stairs/floors through these shared data
definitions and their navigation/render dispatch; clients cannot supply landing
coordinates. This first version demonstrates discrete floors, rather than
continuous sloped elevation or drawing both floors at once.

Checks: `npm test`, `npm run test:floors:browser` and
`npm run test:floors:integration` (with local client/server URL environment vars).
No save/database migration is required; character login keeps the existing
Elderwood arrival behavior. Deploy Vercel and Render from the same commit.

## Whispering Woods: Root Hollow

The **Down to Root Hollow** stairs sit at Old Crossroads, on the central path
north of the Woods portal (world 34,18). Click or tap to approach and descend;
use the ascending stairs at Rootway Landing to return to the surface.

Root Hollow (`woods-depths`) is a 48×36 world-unit map built from the shared
native 32px tiles and existing forest props. Five connected chambers include
Wolf Burrow, Silken Hollow, Briar Thicket, Ancient Root Shrine and a safe arrival
landing. Six wolves, seven spiders and six boars live below; the Forest Bear
stays on the surface. Water blocks movement except on the wooden bridge.
Wolves and spiders remain passive until attacked; boars retain their existing
aggression rules. Both Woods floors drop Beginner equipment.

`packages/game-data/src/woods-depths.ts` defines terrain, collision, decorations
and encounters. The shared stair validation also protects these transitions;
Root Hollow is hidden from island portals and combat/loot cannot cross floors.
Existing stair art is reused so entrances match. The legacy SVG export contains
forest vector props only; live tiled previews include the generated stairs.
`npm run art:map-previews` exports the updated surface and Root Hollow previews.

Checks: `npm run test:woods-floors:browser` and
`npm run test:woods-floors:integration`, alongside `npm test` and `npm run build`.
Deploy both Vercel and Render with the same commit; no database migration.
