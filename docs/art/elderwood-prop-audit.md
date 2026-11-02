# Elderwood standalone prop audit

The standalone props placed on Elderwood's village, cliff walk and house floors were inspected as a contact sheet and at runtime. The approved architecture remains the reference for scale, grounding and upper-left light. Cardinal object directions follow the square grid: south/front, west/left, east/right, north/rear. Elevated camera depth does not rotate a prop diagonally.

## Corrected

Chest, bed, bench and tool-rack families now have sixteen purpose-drawn cardinal views. Chest backs show hinges without a front lock. Bed side profiles run horizontally with opposite headboard positions; the rear bed shows the blank headboard nearest the camera. Bench and tool-rack sides are true end profiles. Their backs are distinct from their fronts. All frames have true alpha, 96×96 canvases and a shared ground baseline. The separate rear-bed master corrects the atlas's rear orientation.

The generated masters and extraction metadata are under `assets/world/elderwood-props`. Run `npm run art:elderwood-props` to prepare native PNGs in `assets/world/objects`; this crops/normalizes the generated art without rotating or mirroring views. The contact sheet is `docs/art/elderwood-cardinal-props.png`.

Elderwood uses regional texture keys, preserving the original images used elsewhere. `sourceKey`, world boxes, collision and sort anchors remain tied to the authored objects. Complete bench views replace the front-only modular fallback in Elderwood so all four bench directions have the same design. Tool racks now stand on their authored ground box rather than keeping the old mounted-rack lift.

The public crafting station now displays an actual table with woodworking tools instead of a storage chest. Its action, position and hit zone are preserved.

## Retained after inspection

- Oak trees: elevated canopy, visible trunk/front depth and shaded side; centered trunk footprint.
- Boulders and stumps: visible tops and shaded side planes.
- Flower patches and planters: elevated flowers with readable pot/stone fronts.
- Lamps: top cap, lantern volume, visible base and fixed light.
- Wells and barrels: visible openings/lids and shaded cylindrical fronts.
- Forge, armor stand, side-facing chair/table and interior stairs: existing purpose-drawn depth and directional geometry.
- Crafting tools, connected fences and approved modular furnishings: existing top/front/side planes and connected joins.
- Purple portal and fishing effect: floor-plane artwork remains aligned with the grid.

No mining, chopping or herb nodes were added. Elderwood remains fishing-only, so gathering trees/ore/plants are not part of its placed props. Character and monster references are unchanged.

## Verification

Unit checks cover all sixteen unique RGBA frames, region isolation, source identity, native scale, grounding and unchanged collision. Browser checks inspect alpha and profile silhouettes, the rear bed, missing textures across four floors, and actual mouse/touch clicks on the public workbench and a storage chest. Deploy Vercel; no SQL or server change is required.
