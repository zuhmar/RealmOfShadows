# Performance pass — November 2, 2026

Measured a mobile-sized 390×844 development client in headless Chromium using software rendering. These are JavaScript update costs, not device FPS or GPU benchmarks. Each region runs 150 updates while idle at its portal arrival. Concurrent build/test load makes wall-clock startup and timing tails noisy; startup did not improve in this run (7.5s before, 18.0s after). Image transfer totals exclude inline assets and must not be used as total download size. Heap values are not controlled for garbage collection.

| Measurement | Before | After |
| --- | ---: | ---: |
| Elderwood map props eligible for rendering | 4,394 | 447 |
| Woods map props eligible for rendering | 380 | 29 |
| Elderwood DOM mutations / 150 updates | 8,646 | 2,676 |
| Woods DOM mutations / 150 updates | 8,650 | 2,725 |
| Elderwood median update | 1.2ms | 0.1ms |
| Woods median update | 0.7ms | 0.6ms |
| Elderwood estimated decoded texture surfaces | 245MiB | 227MiB |
| Woods estimated decoded texture surfaces | 237MiB | 219MiB |
| Idle economy full snapshots / 4.2s | 20 | 1 |
| Idle economy full-snapshot JSON bytes / 4.2s | 71,510 | 3,563 |

Baseline eligible prop counts use visibility: baseline camera filters were unset. After counts additionally exclude the main camera's filtered objects. Terrain drawing has its own culling. Texture numbers estimate RGBA source surfaces, not measured GPU allocation. Network bytes count JSON economy-state payloads only; lightweight clock messages and other multiplayer traffic are additional.

## Changes

- Cache static prop bounds when building a map; exclude distant objects from the main camera every 100ms, with a 256px margin. Preserve roof/window visibility and other camera filters.
- Recompute roof and window cutaways on player position/map changes. Cache town door and window object lists.
- Refresh economy HUD at most ten times per second. Avoid unchanged chat status/control updates.
- Release three duplicate generated source atlases after extracting all runtime frames. Original assets remain intact.
- Send unchanged economy snapshots as small clock heartbeats at the existing five updates per second. Deliver changed inventory, housing, account and progression snapshots immediately through the existing send paths. Movement, monster AI and combat rates are unchanged.

## Reproduce

Start the Vite client on port 5370, then run `PROFILE_OUTPUT=/tmp/client.json node tests/profile-client.cjs`. Set `TEST_CLIENT_URL` for another port. The harness intentionally forces guest local preview.

Start the game server, then run `EXPECT_DEDUP=1 TEST_SERVER_URL=ws://localhost:32991 npx tsx tests/profile-network.ts`. It verifies monotonic clock updates and immediate delivery after equipping a weapon.

Unit tests cover camera changes, visibility preservation, snapshot isolation and state changes. Further work should measure actual phones, production startup/download costs, and concurrent player load before introducing asset loading changes or AI throttling.

## Validation

- `npm test`: 257 passed.
- `npm run build`: passed; Vite still reports large production chunks, so initial download remains future work.
- `tests/browser-elderwood-renewal.cjs`: ground house doors, mentor dialogue, upper housing and mobile passed.
- `tests/browser-minimap.cjs`: all ten regions/floors, full-screen map, chat collapse and dock positioning passed on desktop and mobile.
- The legacy `browser-generated-art.cjs` stops at `elderwood-tavern` (480px current sprite versus 400px expected); its broad dimensions assertion includes replaced map art. `browser-texture-release.cjs` checks source atlas disposal and retained extracted frames directly.
