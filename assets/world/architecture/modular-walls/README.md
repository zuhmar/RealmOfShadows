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
