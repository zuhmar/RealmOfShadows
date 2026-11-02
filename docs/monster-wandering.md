# Monster wandering

Idle monsters now take slow, one-cell steps near their original spawn, with a 3–7 second initial delay and 2–5 second pauses between steps. Ordinary monsters roam within two cells; bosses stay within one cell. They use the existing grid collision, occupancy reservations, and facing rules, avoid stair landings and portal sanctuaries, and never cross floors.

The shared combat simulation owns wandering, so multiplayer clients receive the same positions and mode from the server. Local previews use the same logic. The client selects the existing walk animation for `wander` and idle animation while resting. Aggro and retaliation rules are unchanged; combat interrupts wandering, leashed monsters return home, and defeated monsters respawn at their original spawn.

Validation:
- `npm test` — 235 tests passed, including roaming bounds, terrain, pauses, occupancy, passive behavior, retaliation, respawn and deterministic movement.
- `npm run build` — TypeScript and Vite production build passed.
- `node tests/browser-monster-wandering.cjs` — desktop and mobile position/animation checks passed.
- `TEST_SERVER_URL=ws://localhost:2568 npx tsx tests/monster-wandering.integration.ts` — two clients receive server wandering movement.

Deploy both the client (Vercel) and server (Render). No database migration is required.
