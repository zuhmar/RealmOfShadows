# Full reference-driven Elderwood

`Reference.png` in the parent folder is the latest village plan. This recreation
uses a base SVG and reusable SVG prefabs. The original uploaded PNGs are preserved.

The layout includes seven buildings (tavern, blacksmith, apothecary, general store,
workshop, hall, bank), five market stalls, farm, training yard, upright portal,
gates, fences, benches, lamps, banners, barrels, planters, trees and boulders.
Buildings are environment landmarks; new interiors or shop services are not
implied. Mara's existing trading remains available in front of the tavern.

- `base.svg`: ground, paths, plaza, water, cliffs and footbridges.
- The other SVGs: individual reusable prop/building textures.
- `full-map.svg`: standalone assembled vector map, sorted by object feet. This is
  for viewing/export; the game loads the base and shared prefab textures instead.

Run `npm run art:elderwood` after edits. Sources:

- `packages/game-data/src/elderwood.ts`: placements, terrain and normalized solid
  footprints, shared by client and server.
- `packages/game-data/src/island-layout.ts`: reusable placement and collision
  helpers for reference-driven islands, including full player-footprint checks.
- `scripts/build-elderwood-svg.ts`: Elderwood terrain and portal art.
- `scripts/island-svg.ts`: reusable vector prefab kit and full-map compositor.

Direct SVG edits are replaced on regeneration; put permanent art changes in the
source generators. The tests check that generated art stays current. No PNGs are
embedded in these SVGs. Separate props allow players to walk behind canopies and
roofs while colliding only with trunks and solid bases. Other islands can use the
same layout/prefab workflow when their references are supplied.
