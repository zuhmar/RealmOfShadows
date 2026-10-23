# Realm of Shadows

Phase 1: Elderwood movement foundation. Original flat glossy cartoon art is intended; all current world and character graphics are temporary geometric placeholders. No final artwork is generated or replaced.

## Local development

Requires Node.js 22.12+ (validated on 24) and npm 11.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Open the Vite address printed in the terminal in your local browser. Server defaults to port 2567; Vite defaults to 5173. For a remote deployment, set `VITE_SERVER_URL` to the public secure WebSocket backend address before building. The frontend and backend must both be running. No database or credentials are needed for Phase 1.

```sh
npm test
npm run build
# With the server running:
npm run test:integration
```

WASD/arrows move; Shift sprints; right-click or tap a destination for A* navigation; Space or Interact examines a nearby landmark. Touch devices have a joystick and sprint button. The +/− buttons adjust camera zoom. Two tabs join a shared capacity-limited town. Reload after disconnecting.

## Architecture

- `apps/client`: Phaser 3 rendering, DOM HUD, touch input, camera and predicted movement.
- `apps/server`: Colyseus authoritative 20 Hz simulation, schema state replication and bounded 32-player rooms.
- `packages/shared`: collision-safe movement and A* pathfinding used by client/server/tests.
- `packages/game-data`: map dimensions, speeds, spawn, landmarks and sprite manifest.
- `tests`: deterministic movement checks and actual two-client networking checks.
- `assets`: reserved for original supplied artwork; see `docs/SPRITES.md`.

Positions are logical tile coordinates, with 64 px tiles. Velocity is normalized, diagonal corner cutting is blocked, and characters have a 0.2 tile collision radius. Safe-zone players do not obstruct one another. Sprint uses stamina. The server consumes at most one latest valid input per tick; it ignores client coordinates and rejects invalid or stale sequences. Client input prediction replays unacknowledged inputs after snapshots and smooths display corrections; remote players interpolate toward snapshots.

## Phase boundary and known limitations

No accounts, database persistence, chat, combat, inventory, region travel, or implemented banking/crafting. Landmarks are interactive previews of future systems. Fresh joins start at the square. Phase 2 will implement authentication, persistence and reconnection. Current networking is a foundation with approximate snapshot reconciliation rather than timestamped rollback; latency/loss can cause visible corrections. It needs network-condition and load testing before production. Movement input has no economy authority. No production deployment is claimed.

Maps use configuration-defined building rectangles; client world graphics are geometric placeholders. Four-direction sprite animation manifests are supported; eight-direction input currently maps to the nearest primary facing. Only idle/walk/run animations are needed in Phase 1; combat/equipment animation layers remain later work. Real device touch testing and final sprite-sheet validation require supplied assets/devices. Backend TLS, origin policy and account authorization belong to later deployment/hardening work.

## Next phase

Phase 2: authenticated accounts, character creation, PostgreSQL/Prisma persistence, durable progress, chat, and reconnect handling. Do not expand into combat until this foundation is validated.

## Frontend-only preview and multiplayer configuration

A deployed frontend with no `VITE_SERVER_URL` runs **Local preview · No multiplayer**. Keyboard, click/tap navigation, collision, stamina, sprite animation and camera movement work locally. If an initial server connection fails, the same labeled preview is enabled. Preview movement is not sent to a server and is not saved. A lost established multiplayer connection stops movement and asks you to reload; it does not silently convert a shared session to local play.

For multiplayer on Vercel, deploy `apps/server` to a WebSocket-capable Node host, then set `VITE_SERVER_URL=wss://your-backend-host` in the Vercel project and redeploy. Vercel serves the client; it does not run the long-lived Colyseus process on port 2567. Local development still attempts the server at the browser hostname on port 2567. Walk animations now depend on simulated displacement, so disconnected or collision-blocked characters stay idle.

Movement browser regression: with Vite and the game server running, run `npm run test:browser`. It uses a synthetic sprite-sheet fixture and checks world displacement, camera follow, walk/idle state and collision in local-preview and server-connected modes. Install a Playwright Chromium browser first (`npx playwright install chromium`) or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an existing Chromium binary. `TEST_CLIENT_URL` overrides the Vite URL (default port 5173). This check imports the Vite entry module to inspect actual world positions; run it against the development server.
