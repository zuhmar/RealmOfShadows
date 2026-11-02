# Shared Elderwood architecture

The approved Depot benchmark is now used by all Elderwood village buildings and player houses. The `house-depot-*` filenames are retained so the approved assets keep stable texture keys.

Generate with `npm run art:depot-view` after rebuilding base walls/furniture/counters. PNGs live in `assets/world/objects`; these SVGs are the editable sources.

An 80px wall rise moves its upper edge 16px left. Successive stories share their projected edge; roofs follow the full rise relative to the current floor. Front walls and doors have a 16px gutter. Eastern walls have a complete side plane, and separate short end/window frames meet the front cap without compressing the art. `packages/game-data/src/architecture-view.ts` shares the placement rules between village buildings and irregular player-house shells.

Modular counters, tables, benches and shelves have slanted tops and exposed side faces. Connected crafting counters project their 16px height separately from the square top footprint, so neighboring tiles and L-shaped corners stay joined.

Door hit polygons follow the projected artwork. Ownership art, window peeking, roof cutaways, floor connections, storage, collision and saves retain their existing behavior. Other islands keep their existing building/furniture geometry.

Validation: `tests/elderwood-architecture.test.ts`, `tests/depot-view.test.ts`, the house/wall/roof tests, `tests/browser-house-joins.cjs`, `tests/browser-housing.cjs` and `tests/browser-elderwood-renewal.cjs`. Deploy Vercel; no Render or SQL change is required.
