# Crafting Hall artwork

`benches-master.png` preserves the generated four-counter atlas. Its 2×2 layout
is Blacksmithing, Woodworking, Cooking, Alchemy. The supplied established forge
and workbench cutouts guided the smooth painted cartoon materials and elevated
square-grid perspective. No character art was generated or replaced.

`scripts/extract-crafting-benches.py` crops the separated alpha silhouettes using
measured source rectangles (`layout.json`), applies one shared scale, and packs
each counter into a 128×128 RGBA frame with its base at pixel 124. Transparent
padding and complete silhouettes are preserved. Runtime images are the four
`assets/world/objects/craft-bench-*.png` files.

Each bench renders across three cells at uniform scale, using the preserved
128px artwork, with a three-cell-wide, one-row-deep collision footprint directly
in front of its NPC. The north-corner NPCs face down; the south-corner NPCs face
up. NPCs stand on reserved cells behind that footprint and
customers use the aisle in front. Work points and image positions come from
`packages/game-data/src/town-services.ts`.

`sign.svg` is a code-native sign using the established wall timber material;
`scripts/build-crafting-hall-sign.cjs` exports its runtime PNG. Regenerate both
parts with `npm run art:crafting-hall` (Pillow plus Playwright/Chromium required).
Original generation output is also retained in `/workspace/generated_images` in
the development environment; the committed master is the portable source.
