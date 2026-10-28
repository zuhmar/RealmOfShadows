# Crystal Caverns connected terrain

Crystal Caverns and Depth 2 share the connected terrain renderer with Elderwood
and Whispering Woods. The game, editor and terrain previews use the same painter;
collision, fishing and pathfinding continue to use the shared grid.

The preserved six-material source is `assets/world/terrain/caverns/master.png`.
`npm run art:island-terrain` extracts native 32px tiles with padded atlas gutters.
Quiet slate floors and dark rock replace the repeated bright crystal texture;
cyan/violet crystals remain separate props. Broad chamber floors contrast with
paved corridors. Uneven room shoulders and trimmed corners soften rectangular
chambers without narrowing combat routes.

Both floors gain a small fishing alcove off the existing routes. Mining carts,
crates, geodes and ruins provide landmarks using existing artwork. The surface
stays 64×48 and Depth 2 stays 48×36. All 28 surface and 17 lower-floor encounter
IDs/positions, portal, bridge, stairs, equipment progression, quests and
profession rules are retained. Resource positions are generated on legal,
reachable land around the revised geometry.

Validation: unit tests, production build, all-five-map preview/runtime pixel
agreement and cleanup checks, desktop/mobile fishing in the new surface alcove,
real walking and stair clicks in guest/multiplayer, and cavern multiplayer combat.
Deploy client and server together for the revised collision map.
