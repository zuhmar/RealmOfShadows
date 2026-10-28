# Whispering Woods map refinement

Whispering Woods and Root Hollow now use the same connected 32px terrain painter
as Elderwood, in both gameplay and the map editor. They keep their own muted
forest palette, mossy paving, teal water, aged timber and rooted rock banks.
The six-material source is preserved in `assets/world/terrain/woods/master.png`;
`npm run art:island-terrain` rebuilds the padded atlas from it. Other biome
masters remain unchanged.

The surface retains its 68×48 grid, all 28 encounter IDs and positions, the
central portal, stair access and enclosed bear grove. Main trails now bend
through the forest; approach encounters remain on trails. Two off-trail fishing
pools have land approaches. Existing crossing bridges remain walkable. Tree
placement uses deterministic one-cell offsets instead of straight planted rows;
clearings and road margins remain open. Existing props distinguish the wolf,
spider, boar and boss habitats without changing creature artwork.

Root Hollow retains its layout, bridge and 19 encounters while receiving the
new terrain artwork and connected boundaries. Collision and fishing still use
shared grid cells. Resource positions are regenerated from reachable legal land;
all types and their level requirements and respawn times are preserved.

Validation includes unit tests for encounter reachability, separation, resource
coverage and collision; browser checks for preview/runtime agreement, texture
cleanup, map editing, real combat approach, and stair travel in guest/multiplayer
on desktop/mobile. Deploy both services together after map changes.
