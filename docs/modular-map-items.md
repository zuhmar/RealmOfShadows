# Map item construction

Map art keeps the square grid with an elevated view. A floor cell is 32px in the map editor and 64px in the game. Building walls and roofs already follow this construction. Furniture now uses the same modular approach instead of enlarging a complete bench across several cells.

`map-furniture.ts` expands logical counters, tables, benches and shelves into reusable one-cell sections. Start/end caps occur only at the ends; middle sections join without vertical seams. Corner variants are available for authored L/U arrangements through `furniturePiece`. Native pieces are 64×80: a 64px cell and a 16px elevated gutter, rendered at equal X/Y scale. Their bottom edge and depth match the occupied row. A three-cell counter is three pieces, not a scaled image.

Crafting Hall counters use explicit L-shaped three-cell footprints enclosing each true corner NPC. Their connected variants use a four-bit neighbor mask (north=1, east=2, south=4, west=8), suppressing shared rims and internal front faces. A separate generated tool sprite sits on the inward elbow. All three sections open the same service and become noninteractive outside the room. NPCs stay at their corners. Bank counters, meeting tables, upper-floor tables/bookshelves and village benches use the same expansion. Game, map editor and preview export share `buildingVisuals`.

Keep discrete objects (trees, rocks, chests, barrels, lamps, stairs and similar props) as independent sprites with their existing grid footprints; these are not counter sections. Preserve their artwork and proportions. Large indivisible objects may span several cells. Reserve only their physical base in collision, so an elevated canopy does not become an invisible wall. Terrain remains tiles, with island-specific artwork.

Sources: `assets/world/architecture/modular-furniture/*.svg`. Regenerate committed transparent runtime PNGs using `npm run art:map-furniture` (Playwright and Chromium required). Wood comes from the existing architectural material swatch. Previous painted furniture and crafting masters are preserved. The old bench extraction command does not replace the modular runtime pieces.

Placement and collision data are unchanged by visual expansion. No save migration, recipe, price or profession changes are involved.

Every new item sprite set must include front (`down`), left, right and back
(`up`) views, with matching scale, palette and baseline. Profession tool sets
provide all four; hall props select the view matching their NPC's facing.

## Elderwood placement checks

Physical props carry an explicit `footprint` rectangle in grid-cell coordinates,
separate from their image canvas. Collision reserves each cell in this rectangle;
Elderwood depth sorting uses its base row. Tree canopies retain uniform scale
with a single centered trunk cell. The outdoor bench, planter and lamp bases
snap to cells; the upper-room bed and table reserve their full physical width.
Side/back furniture views keep their purpose-drawn directional images instead of
being replaced with front-facing modules. Crafting counter L shapes remain
explicit cell lists and do not use a rectangular collision shortcut.

The map editor's **Collision preview (doors open)** overlays red blocked cells
and gold wall edges. It combines the currently edited terrain with `propBlocked`,
so painting grass over water clears terrain collision but cannot erase a solid
prop. Doorways are shown open; runtime room door state still applies in game.
This is a preview only and is never included in exported terrain files.

Room checks verify every legal floor cell connects to its entrance, solid bases
reject movement, and the crafting NPC enclosures remain unchanged. Deploy the
client and server together when physical placements change. Existing saved
positions use the server's normal free-landing recovery.

Placed props also use `map-prop-sizes.json`, a catalog of native PNG dimensions
shared by game, editor and preview export. `npm run art:prop-catalog` regenerates
it after adding or replacing a placed texture. The renderer fits each image
uniformly inside its authored canvas, anchors its bottom, and centers solid
props over their physical footprint. It does not stretch tall lamps or narrow
trees into square images. Floors, wall panels, roof parts and mounted signs
retain their dedicated architectural placement rules.

## Square runtime prop canvases

All placed prop sprites now use square PNG canvases and equal world width/height.
`npm run art:square-props` packs non-square originals into
`assets/world/square-props/` and gathering trees into
`assets/professions/square-runtime/`. This is padding only: original pixels,
artwork proportions, facing, and masters are preserved. Existing square images
are used directly. Game and editor prefer padded versions under the same keys.

The renderer uses the original size catalog to keep artwork at its established
scale and baseline within the square frame. Counter modules use 80×80 frames:
64px core width plus 8px transparent gutters on each side. Their 60×60 world
canvases start 6 units left of the core, so adjacent counter tops still meet
exactly on the grid. Gathering trees, stumps and the outdoor workbench also
render square. Collision footprints are unchanged.

Building wall panels, door frames, floors, roofs and mounted building signs
remain architectural tiles with fitted geometry. They are not padded prop
canvases. Repack props after regenerating source artwork; furniture and catalog
commands do this automatically.
