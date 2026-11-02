# Fixed world artwork view

The world uses a fixed elevated, oblique artwork view: square grid axes, visible top surfaces, front faces and shaded right-side depth. The Phaser camera stays square and does not rotate or skew the terrain. Lighting comes from the upper left. Zoom changes display size, not the projection of an individual object.

`packages/game-data/src/world-view.json` defines the native tile size, sprite-space depth accents and shared face lighting. `scripts/lib/world-view.cjs` applies these conventions to generated architecture and furniture. Runtime stair risers use the same depth accents.

The current pass regenerates modular walls/windows/corners, roof right fascias, modular furniture and connected crafting counters. Exposed right ends have a side face; connected counter edges omit it. Padded square runtime sprites are regenerated alongside the original code-native SVGs and PNGs. Their dimensions, anchors, collision footprints and modular join positions stay unchanged. The existing cliff boulder and recessed stair views already follow the same upper-left light and retain their geometry.

Existing directional prop images retain their purpose-drawn views. Character and monster references are unchanged. New assets should be authored in this view rather than corrected by camera rotation, stretching or mirroring a lit sprite.

## Regenerate

Run `node scripts/build-town-walls.cjs`, `node scripts/build-town-roofs.cjs`, `node scripts/build-map-furniture.cjs`, `node scripts/build-connected-counters.cjs`, then `python3 scripts/square-map-props.py`.

## Verify

`tests/browser-map-perspective.cjs` measures lighting on actual cliff, roof, wall, counter and furniture textures, including exposed versus connected counter ends. `tests/browser-house-joins.cjs` checks roof/wall/door joins on desktop/mobile. `tests/browser-elderwood-renewal.cjs` checks ground housing, upper floors and mentor interactions. Production deployment only needs Vercel; there are no collision, server or SQL changes.

## Depot geometry benchmark

The central Depot now has actual oblique wall/door geometry and a roof offset that follows each story's rise. Its eastern wall is a full visible side plane, and nearby modular furniture has purpose-drawn parallelogram tops and side faces. This is a scoped visual benchmark; the other building geometries retain the shared lighting pass above. See `assets/world/architecture/depot-view/README.md` and regenerate with `npm run art:depot-view` after changing base wall materials.
