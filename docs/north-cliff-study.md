# Elderwood cliff stairs

Elderwood shows tall rock faces only on drops projecting south, with rim caps and corner joints on rear and side edges. Stairs share the fractured cliff's olive-grey stone palette.

## Directional native tiles

`apps/client/src/cliff-stair-art.ts` paints north, south, east and west views with fixed screen lighting, broad treads, dark risers and fractured stone cheeks. Each sprite is exactly 32×32. Bottom, middle and top sections join into a continuous lower flight. Whispering Woods ridge and ledge flights also assemble native stair sections across their entire approach-to-landing distance. Their down openings use the authored upper transition coordinates.

`apps/client/src/cliff-stair-layout.ts` repeats native cells along the authored approach-to-plateau distance. Current Elderwood flights have three sections. Taller authored climbs gain middle sections; sprites are never stretched to cover extra height. Every section is clickable and approaches the existing lower transition.

The upper down-stair sprite stays on `elderwoodStairTile(s)`, one cell beyond the lower approach. It is a distinct recessed opening with treads darkening into the stairwell. Upper arrivals and descent rules remain unchanged. For the north entrance: lower approach (52.5, 31.5), upper down opening/arrival (52.5, 30.5), upper plateau (52.5, 28.5).

## Ocean and collision

Water tiles follow the complete island silhouette on both outdoor floors, remain blocked in shared map data and continue past the terrain canvas as a repeating backdrop. Stair artwork does not change collision, floor connections, housing or saved positions.

The ocean material change requires both Render and Vercel deployments. Subsequent stair artwork changes require only Vercel. No database migration is needed.

## Validation

- `tests/cliff-stair-layout.test.ts`: four cardinal flights, contiguous native cells, existing down opening and longer climbs.
- `tests/browser-single-cell-stairs.cjs`: native sprite footprints, every lower section and fixed upper openings, Woods stair positions.
- `tests/browser-stair-landing-visuals.cjs`: distinct upper/lower sprites, matching surrounding paving and no earth borders over stone.
- `tests/browser-cliff-study.cjs`: actual click approach, ascent and descent on desktop/mobile; exports native and gameplay screenshots under `/tmp/cliff-study-*`.

Flight lengths are checked for one through six cells in all four directions. Woods ridge render textures include the lower approach tile, so taller flights are not clipped at the image boundary. Existing floor connections and collision stay unchanged.


## Reference-based rock openings

The shared cliff material uses overlapping irregular boulders, shaded side facets and chipped highlights instead of broad triangular panels. Faces are sampled from one joined stone field across native tiles; Elderwood uses the same field column in its upper and lower face sections. Rim and corner colours match the rock. Stair treads have slanted top planes and dark risers inside a recessed opening with boulder cheeks, using the same stone palette and fixed light. This follows the supplied Reme’s editor reference concept without copying its assets. Existing island layouts, collision, water, staircase lengths, floor arrivals and down-stair positions are unchanged.


## East/west recess depth

Side-facing stair tiles now draw a fixed-camera rock channel: visible north inner wall, contact shadow, tread side faces and a low near-edge rock lip that occludes the tread edges. The shadowed inner wall remains north-facing in both east/west views rather than rotating with the stair direction. Upper down openings darken toward the descending end. Every part remains inside its native 32×32 cell, and repeated parts still join across the complete flight. North/south flights, collision, destinations and the positions of all upper openings are preserved.

`tests/browser-elderwood-stair-recesses.cjs` measures contact-shadow contrast and verifies actual mouse/touch ascent and descent at all four entrances, including the unchanged upper arrivals. The existing native-footprint and landing tests also cover the rebuilt pieces.
