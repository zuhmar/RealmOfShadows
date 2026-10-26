# Crystal Caverns

Playable level 11–20 island built from the shared 32×32 terrain tileset and
generated cave props. World bounds: 64×48; map layout: 3072×2176 source pixels.

The Wayfarer Landing portal opens onto a mine bridge and a branching cave loop.
Echoing Roost has nine level-12 Cave Bats, Shard Nest has nine level-14 Shard
Crawlers, and Golem Gallery has nine level-16 Crystal Golems. The level-20 Crystal
Wyrm occupies the enclosed northeast sanctum, reached through its southern gate.
Forgotten Survey, Miner’s Rest and Deep Geode are connected exploration alcoves.

Layout, spawns, props, portal and collision geometry live in
`packages/game-data/src/caverns.ts`. Floor/wall cells, lake and bridge are shared
by server navigation and client terrain. Source pixels convert to world units
as `x/48, y/48 + 4/3`. Change geometry and spawns there, then validate routes.

Artwork: `assets/generated/caverns-props.png` and
`assets/monsters/generated/{bat,crawler,golem,wyrm}-animations.png`. Inspected
frame metadata lives in `apps/client/src/caverns-{prop,monster}-frames.ts`.
Props are packed into multi-tile prefabs; compressed WebP monster derivatives
are loaded in-game. PNG masters remain intact. Each monster has four directions,
two idle poses, four walk poses, an attack pose and a defeated pose.

`npm run art:caverns` rebuilds the prefab pages and WebP derivatives. With a Vite
client running, `npm run art:map-previews` refreshes the full-map PNG in
`assets/generated/previews/crystal-caverns-full-map.png`.

Run `npm run test:caverns:browser` and `npm run test:caverns:integration` with
`TEST_CLIENT_URL` / `TEST_SERVER_URL` pointing to the local client/server.
The browser placement editor currently supports Woods; Caverns terrain and
placement edits happen in the shared data file. Deploy both client and server
from the same commit when changing this island.

Depth 2 is now accessible through the stairs at Prismatic Crossing. It has five
connected chambers, 17 monsters and a reservoir bridge. Floor connections and
area isolation are documented in `docs/map-floors.md`; the lower map is in
`packages/game-data/src/caverns-depths.ts`.
