# Crafting Hall artwork

`benches-master.png` preserves the generated four-counter atlas. Its 2×2 layout
is Blacksmithing, Woodworking, Cooking, Alchemy. The supplied established forge
and workbench cutouts guided the smooth painted cartoon materials and elevated
square-grid perspective. No character art was generated or replaced.

`scripts/extract-crafting-benches.py` crops the separated alpha silhouettes using
measured source rectangles (`layout.json`), applies one shared scale, and packs
each counter into a 128×128 RGBA frame with its base at pixel 124. Transparent
padding and complete silhouettes are preserved. Legacy extracted images are the four
`assets/world/objects/craft-bench-*.png` files.

Runtime counters now use three connected tiles around each NPC's corner cell,
not the legacy whole-bench sprites. `town-services.ts` defines the explicit three
solid cells. `build-connected-counters.cjs` exports 16 neighbor-mask variants,
with shared top edges and hidden internal front faces for vertical connections.

`tools-master.png` preserves the generated transparent 2×2 tools-only atlas:
blacksmithing, woodworking, cooking, alchemy. `extract-counter-tools.py` crops
alpha silhouettes within their quadrants and packs them into 64×64 transparent
sprites with padding. `npm run art:map-furniture` rebuilds the counter kit and
these tool sprites. Characters remain approved reference-based skins.

`sign.svg` is a code-native sign using the established wall timber material;
`scripts/build-crafting-hall-sign.cjs` exports its runtime PNG. Regenerate both
parts with `npm run art:crafting-hall` (Pillow plus Playwright/Chromium required).
Original generation output is also retained in `/workspace/generated_images` in
the development environment; the committed master is the portable source.
