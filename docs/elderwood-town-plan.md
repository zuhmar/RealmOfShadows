# Central Depot village

Elderwood now uses a 48×40 grid on both its ground and upper floors. The previous
32×24 village plan has been replaced; other islands retain their existing bounds.
The shared plan is in `elderwood-layout.ts` and `village-buildings.ts`.

| Building | Corner / position | Footprint |
| --- | --- | --- |
| Depot | center, (17,15) | 14×9 |
| Smithy | northwest, (5,7) | 6×5 |
| Crafting Hall | northeast, (32,7) | 11×6 |
| Bank | southwest, (5,29) | 6×4 |
| Hall | southeast, (36,29) | 6×4 |

The Depot occupies 126 cells, exactly twice the previous 9×7 footprint. It uses
the same fitted modular walls, corners, windows, doors and roof tiles. Its
storage boxes remain private, save-backed and capacity 100; existing box IDs are
retained at (20.5,16.5), (24.5,16.5) and (28.5,16.5). Three cells across the main
south door stay open. Mara stands outside at (27.5,24.5).

The portal is one 64-world-unit tile, centered at (24.5,26.5) south of the Depot.
Its artwork stays within that tile and at a fixed position. Purple electrical
static animates at roughly 11 frames/second using a small canvas texture; region
changes remove its timer. The old portal masters and the portals on other
islands are preserved. The default arrival/spawn is (24.5,28.5).

The four crafting NPCs and their enclosing three-cell counters move with the
Crafting Hall. Service ranges, recipe restrictions and blocked NPC/counter
footprints use the same shared coordinates on client and server. A garden,
Smithy yard, two fishing ponds and an eastern footbridge keep the streets varied.
Elderwood remains fishing-only for gathering.

A rocky perimeter surrounds the lower town. North, south, west and east stairs
connect the ground to a continuous two-cell-wide upper cliff walk, on the
existing `elderwood-upper` floor. Steps face toward the village and have paired,
server-validated transitions. Their ground approach points are:

- North: (24.5,5.5), upper landing (24.5,2.5).
- South: (24.5,34.5), upper landing (24.5,37.5).
- West: (5.5,20.5), upper landing (2.5,20.5).
- East: (42.5,20.5), upper landing (45.5,20.5).

The Depot loft stairs move to (28.5,21.5), arriving at (28.5,22.5). Hall library
stairs move to (40.5,31.5). These rooms remain separate from the connected rim;
players return via their paired stairs. Upper floors cannot use portal travel.
Existing saved positions are checked by the server's normal free-landing logic.

Map Studio and exported previews use the current cliff plan and one-cell portal
art. Fixed cliffs and stairs remain protected while plateau/room floor cells
can be painted on the upper floor. Old-size Elderwood grids must be replaced with current-size exports. Map Studio
preserves an older local draft as a downloadable backup and recovers compatible
island edits instead of discarding the whole draft.

Verification includes door/wall geometry, every room's walkable cells, all
cardinal stair approaches and rim connectivity, storage transfers/privacy,
crafting counters, fishing, and a stationary animated portal. Browser coverage
runs on desktop/mobile and guest/multiplayer; integration checks use real server
movement and private storage. Deploy **Render and Vercel together** for the new
bounds, spawn, buildings and collision. No database migration or new environment
variables are required.
