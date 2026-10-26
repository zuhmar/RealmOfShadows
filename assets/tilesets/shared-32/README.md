# Shared 32×32 map tiles

The live maps use this reusable cartoon tileset. Original uploaded/generated
artwork and prior whole-map paintings remain preserved as references.

## Terrain

`terrain/` contains 24 individual **32×32 PNGs**: grass, dirt, stone, water,
wood and cliff, with four variations each. `terrain.png` packs them into a
216×144 atlas: six columns, four rows, 32px frames, 2px margin and 4px spacing.
The spacing contains extruded edge pixels to avoid neighbouring color bleed.
`terrain.tsj` is the corresponding Tiled tileset definition.

`terrain-master.png` is the generated painting source. Normal atlas preparation
reduces its swatches to 32px and conditions matching repeat borders; it is never
stretched over a whole island. Replace/repaint this source to change materials,
then run `npm run art:map-tiles`.

## Large objects

`objects-*.png` are 1024×1024 pages of 32×32 cells. `object-prefabs.json`
describes 72 complete buildings, trees, cave crystals, mining props and other
objects. Each entry
retains its original width/height and gives a row-major tile list; `-1` is empty.
For tile ID `id`, page = `floor(id/1024)` and cell = `id % 1024`; the cell's
source position is `(cell % 32)*32, floor(cell/32)*32`.

The game reconstructs each prefab once from these pieces. A building still
spans many tiles and keeps its existing depth order, collision footprint and
placement. The source paintings in `assets/generated/` remain unchanged.
All live portals share Elderwood's portal painting and its 200×179 logical
dimensions, including the portals on the placeholder islands. The Woods
prefab is generated from that same master to prevent its appearance drifting.

## Layout and editing

`packages/game-data/src/terrain-plan.ts` defines material layers using the
existing island routes, clearings and collision polygons. Runtime edge tiles
clip material boundaries to those polygons, so shores, bridges and boss walls
agree with the server. Camera dimensions, navigation and monster spawns retain
their existing coordinates. The four current islands all use the tileset;
Elderwood, Woods and Crystal Caverns have detailed placed props. Caverns uses
cached material colors so its dark rock and blue floor match on Canvas/WebGL.

The browser placement editor still edits monsters and the portal; it does not
yet paint terrain. The `.tsj` opens the tile palette in Tiled, but Tiled map
imports are not wired into the game. Terrain layout edits currently happen in
the shared terrain plan/island geometry.

Run `npm run art:map-tiles` to rebuild the terrain and object atlases. With Vite
running, `TEST_CLIENT_URL=http://localhost:5211 npm run art:map-previews` exports
both island previews and the Woods placement-editor background from these tiles.
