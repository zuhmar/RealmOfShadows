# Character sprites

Current character animation scope: **idle and walk only**. Sprinting reuses walk. Planned attacks use projectiles and area spells; no character attack, cast, or run sheet is required. Combat behavior itself remains a later development phase.

## Default artwork

The supplied originals are preserved at:

- `assets/characters/Citizen_idle_animations.png`
- `assets/characters/Citizen_walk_animations.png`

Both are 1536×1024 PNGs with alpha channels. Both contain two frames per direction in rows ordered down, left, right, up. The sprites sit inside wide presentation margins rather than uniform full-image cells.

`apps/client/src/character-assets.ts` imports both files as Vite asset URLs, so they are included in production builds and loaded automatically. It defines the walk regions and references `idleCharacterSheet` from `packages/game-data/src/character-sheet.ts`. No source pixels are changed. Rectangles, frame rates, scale and feet origins are configurable. Idle loops at 3 fps and walk at 6 fps. The same default artwork renders the local character and remote players.

## Updating artwork

Upload the idle and walk PNGs to `assets/characters/` using the existing filenames to replace the default artwork. Changes are bundled on the next build and deployment. If dimensions or frame layout change, update `apps/client/src/character-assets.ts` and the referenced idle layout. New filenames also need their imports updated there. There are no in-game file pickers or session-only sprite overrides. Original images and alpha are preserved.

For future supplied uniform sheets, `SpriteManifest` in `packages/game-data/src/index.ts` supports configurable idle/walk frame arrays, frame dimensions, rates and anchors. No final artwork is generated automatically.

## Verification

`npm run build` emits both PNGs into the client production assets. `npm run test:browser` checks automatic loading, two-frame idle/walk animations, world movement, camera follow and collision in preview and connected modes, using the committed artwork. It requires a running Vite client and game server; see README for browser installation and URL options.
