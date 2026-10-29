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
