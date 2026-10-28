# Fitted Elderwood walls

These code-native SVG pieces share one geometry rather than independently fitted
painted silhouettes. `scripts/build-town-walls.cjs` writes these SVGs and their
runtime PNGs. Regeneration requires Playwright and `/usr/bin/chromium`; production
builds use committed PNGs.

At 64 native pixels per world cell, caps and side rails are 12 pixels thick.
Horizontal faces/corners are 80 pixels high (1.25 cells); two-cell panels are
128 pixels wide and one-cell pieces are 64. Side rails occupy the outermost
12 pixels of their 64-pixel canvas and repeat without end caps.

The three small texture swatches come from the north panel in the preserved
`../elevated-masters/walls.png`, cropped to wood, plaster and foundation stone.
All orientations reuse these materials. SVG geometry supplies the shared joins,
edge highlights, beams and corner posts; it does not replace any gameplay
footprints or collision data.

Window variants (`n-window`, `s-window` and their `-half-window` counterparts)
bake their glazing, mullions and sills into the wall face. No separate window
objects are drawn over a building. All boundary pixels and native dimensions
match the corresponding plain panel.

Door panels are two or three cells wide, 80 pixels tall, with full-width lintels
and full-height jambs at the canvas edges. Open and closed variants have identical
bounds; open leaves preserve a transparent passage. They use the wall materials
and replace the old alpha-padded door overlays without changing doorway collision.

Roof placement scales to the solid eave at 90% of its native canvas height,
which makes even the shallowest painted eaves overlap the top of the wall.
`tests/browser-house-joins.cjs` measures actual roof alpha over every facade
column and both door panel edges, checks that facades remain visible, and tests
click/touch door toggles on desktop and mobile.
