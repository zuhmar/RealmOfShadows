# Map artwork perspective

The camera remains an orthographic, square-grid overhead view. Apparent height comes from illustrated top surfaces, vertical front faces and depth ordering, rather than tilting or skewing the world. This follows the mapping concept of Tibia while preserving Realm of Shadows' smooth illustrated artwork.

Use upper-left lighting consistently: top surfaces and west-facing planes receive highlights; east and south-facing planes are darker. Rock detail stays upright even when the cliff runs vertically. Keep ground contact darker than the top edge. Rims have a narrow top cap and a shaded vertical edge; cliff corners are beveled shoulders, not crossing straight outlines.

Cliffs use cached 32×32 face, rim, corner and directional stair parts in `apps/client/src/cliff-tiles.ts`. Larger objects repeat parts. A stair run stays one cell wide. Elderwood's inward-facing perimeter chooses the facing and top/bottom rows from the actual high grass edge; Woods ledges retain south-facing two-row faces. The one-cell Woods boundary remains one cell.

Buildings already use edge-aligned modular walls, consistent wall height and connected tiled roofs. Their generated caps now share upper-left highlights, a shadow below the cap and shaded ground contact. West timber is lighter than east timber. Roof eaves have a light top and darker vertical fascia, continuous across adjacent tiles. Regenerate with `node scripts/build-town-walls.cjs` and `node scripts/build-town-roofs.cjs`; both SVG sources and runtime PNGs are checked in. Door openings, roof dimensions, collision and interior cutaway behavior are preserved.

Props retain their separately drawn cardinal views, original artwork scale, grounded baseline and existing depth order. Characters and monsters are unchanged. This pass aligns the modular environment pieces; it does not claim every legacy or future sprite has been redrawn.

Validation: `npm run build`, `npm test`, `npm run test:map-perspective:browser`, the village cliff footprint/no-scaling browser check, house-join desktop/mobile checks and mobile guest door/loft traversal. The perspective test samples actual rendered pixels to compare rock, wall and roof plane lighting and eave thickness; native part sizes remain unchanged. Updated map previews share the game/editor renderers. This is a client artwork update: redeploy Vercel; no Render or database changes are needed.

Elderwood's outer plateau now uses a shared stepped land contour rather than a rectangular border. Cutouts are blocked on the upper floor; native cap edges and two-row southern rock faces follow that same contour. All twenty homes and the original inset town retain their coordinates. Cliff stairs use flat endpoint landings and recessed, direction-lit risers within their existing one-cell-wide runs. The shared rock tiles also update Whispering Woods. Deploy the client and server together for the contour collision change; no database migration is required.
