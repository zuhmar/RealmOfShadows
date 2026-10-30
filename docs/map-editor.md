# Map Studio

Open `/map-editor.html` on the client site. The editor uses a Remere-style
palette, grid viewport, navigator and tile inspector with the game's own art.
It is a browser editor for Realm of Shadows maps.

## Editing

Choose a map or use Floor − / Floor + to move between existing floors.
Terrain brushes snap to the 32px grid; matching terrain joins and water/wall
borders update automatically. Brush sizes are 1, 2, 3, 5 and 7 tiles. Rectangle
and flood fill apply to terrain. Right-click or Pick samples terrain; the prop
palette can also pick an existing prop. B/R/F/E/I/H select the tools.

Search Props to place approved standalone artwork. Width/height use whole grid
cells; selecting an existing prop uses its authored size. A solid base reserves
the bottom row across the object's width, allowing tree canopies to overhang
walkable cells. Erase removes the top added prop or an editable authored prop.
Town service fixtures, building shells, stairs, portals and raised cliff
structures remain authored landmarks. Existing upper platforms can be painted,
but the editor does not create stair connections or resize those platforms.

The Monsters palette uses the actual approved monster art. Placement on hunting
maps creates a unique spawn at a tile center. Erase removes added or authored
spawns. Water, wall terrain and solid props reject new monster placements.

Hold Space or use Pan to drag the view; middle-drag works too. Ctrl/Cmd+wheel
zooms around the cursor. Fit and the minimap navigate large maps. Layer toggles
control roofs, props, spawns, landmarks, grid and collision. On mobile, Layers
opens the navigator/inspector drawer. Use the Pan tool for touch navigation.

## Saving and deployment

Each stroke is one undo step. Undo/redo span map switches; up to 60 snapshots
are kept during the session. Local storage saves the draft after edits and
recovers it after reload. Import validates the whole document before replacing
the draft; a failed import preserves current work. Reset clears overrides for
the selected map and is undoable. It does not modify authored landmarks.

Export downloads `grid-overrides.json`; it does not publish the live map.
Replace `packages/game-data/src/grid-overrides.json` with that file, run
`npm run build` and `npm test`, commit, and deploy **both client and server**.
The map check flags blocked monster spawns and upper return stairs before
export. It is not a complete path-connectivity proof; run the repository's map
and movement tests when changing routes.

The existing version-2 format remains compatible. Each region optionally stores:

- `cells`: full native terrain grid (materials 0–5).
- `props`: added approved props in grid coordinates with authored size and solid
  base width/height.
- `removedProps`: stable identities (`key@x,y` in authored sprite units).
- `spawns`: new unique `editor-...` monster IDs, kinds and centered positions.
- `removedSpawns`: authored spawn IDs to omit.

Shared validation bounds arrays, dimensions, positions, sizes and monster kinds.
`gridMap(region, true)` and `authoredGridSpawns(region)` provide unedited data to
the editor so exported overrides are not applied twice after deployment.
Normal gameplay applies terrain, prop footprints and spawn edits on both sides.
The editor never changes character art, monster animations, quests or inventory.

`npm run test:map-editor:browser` covers desktop/mobile painting, props, spawns,
erase, history, export, recovery and floors, plus rectangle/fill/picker/pan/zoom
and preservation of a draft after invalid import. Shared tests cover real prop
collision, fixed landmark protection and malformed edit rejection.
