# Elderwood connected terrain

Elderwood is the first island using connected terrain rendering. It retains the
32×32 material tiles, 64-world-unit movement grid and separate depth-sorted
building/prop sprites. The approved character/outfit and monster assets are
unchanged.

`apps/client/src/connected-terrain.ts` paints adjacent materials as connected
surfaces, rounds exposed outer corners and adds shoreline/rock outlines only
along exposed edges. Bridges paint above water. This is rendering only:
`gridMap()` remains the source for collision, fishing and pathfinding. The map
editor and terrain preview use the same painter. Whispering Woods and Root Hollow also use this renderer; other islands retain
their existing renderer until individually revised.

The generated six-material Elderwood master is preserved at
`assets/world/terrain/elderwood/master.png`. `npm run art:island-terrain` extracts
it into the existing padded 32px atlas format without changing the other seven
biome sets. Materials stay in the order ground, path, stone, water, bridge, wall.

The village includes a stepped southern pond, a three-cell timber crossing,
service approach paths and additional trees, flowers, a bench and planter.
Depot storage boxes, Mara, crafting and portal coordinates retain their existing
interaction behavior. Water and cliff cells remain blocked; bridges stay walkable.

Checks: `npm test`, `npm run build`, plus browser-connected-terrain.cjs,
browser-map-editor.cjs, browser-depot.cjs and browser-resource-varieties.cjs.
Set TEST_CLIENT_URL to a running client. Depot online checks also require the
client's VITE_SERVER_URL to point to a running server built from the same code.
