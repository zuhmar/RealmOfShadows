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
