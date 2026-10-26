# Realm of Shadows

A multiplayer fantasy RPG with accounts, saved progression, equipment, island travel and layered maps. Current maps use individually authored grid cells, distinct 32×32 island terrain and standalone painted object sprites. Players and monsters use eight-direction grid movement with occupied cells and surrounding combat. See [Grid world](docs/grid-world.md) for current map authoring, artwork, controls and deployment.

The village [Depot](docs/depot.md) is a visible walk-in tiled building with private, saved item storage.

Players use [reference-based outfits with wearable wings and auras](docs/skins-and-cosmetics.md), chosen in the profile’s Wardrobe.

## Local development

Requires Node.js 22.12+ (validated on 24) and npm 11.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Open the Vite address printed in the terminal in your local browser. Choose **Play as guest**, or sign in to a configured Supabase account, on the starting screen. Server defaults to port 2567; Vite defaults to 5173. For a remote deployment, set `VITE_SERVER_URL` to the public secure WebSocket backend address before building. The frontend and backend must both be running. Guest play needs no database or credentials. Supabase accounts and saving are optional; see `supabase/README.md` for configuration and required SQL migrations.

```sh
npm test
npm run build
# With the server running:
npm run test:integration
```

Click or tap the ground for A* walking. WASD/arrows remain available; Shift sprints. Click a trader or portal to approach an open interaction point and use it. The profile Settings tab contains sprint, camera zoom and control hints. Two tabs join a shared capacity-limited town. Reload after disconnecting.

## Architecture

- `apps/client`: Phaser 3 rendering, DOM HUD, touch input, camera and predicted movement.
- `apps/server`: Colyseus authoritative 20 Hz simulation, schema state replication and bounded 32-player rooms.
- `packages/shared`: collision-safe movement and A* pathfinding used by client/server/tests.
- `packages/game-data`: map dimensions, speeds, spawn, landmarks and sprite manifest.
- `tests`: deterministic movement checks and actual two-client networking checks.
- `assets`: reserved for original supplied artwork; see `docs/SPRITES.md`.

Positions are logical tile coordinates, with 64 px tiles. Velocity is normalized, diagonal corner cutting is blocked, and characters have a 0.2 tile collision radius. Safe-zone players do not obstruct one another. Sprint uses stamina. The server consumes at most one latest valid input per tick; it ignores client coordinates and rejects invalid or stale sequences. Client input prediction replays unacknowledged inputs after snapshots and smooths display corrections; remote players interpolate toward snapshots.

## Phase boundary and known limitations

Supabase accounts and character saves are implemented; configure the client/server credentials and run both SQL migrations to enable them. Chat and banking/crafting are not implemented. A session inventory, wolf rewards and a village merchant are available. A first wolf combat slice is available in Whispering Woods. Portal travel is available between the village and three exploration regions. Landmarks are interactive previews of future systems. Fresh joins start at the square. Accounts restore character progress on rejoin; automatic network reconnection remains future work. Current networking is a foundation with approximate snapshot reconciliation rather than timestamped rollback; latency/loss can cause visible corrections. It needs network-condition and load testing before production. Movement input has no economy authority. No production deployment is claimed.

Maps use configuration-defined building rectangles; client world graphics are geometric placeholders. Four-direction idle/walk animation manifests are supported; eight-direction input maps to the nearest primary facing. Sprint reuses walk. Future attacks use projectiles and area spells; character attack and run sheets are not required. Real device touch testing remains outstanding. Backend TLS, origin policy and account authorization belong to later deployment/hardening work.

## Next phase

Supabase email/password accounts and PostgreSQL character saves are available. Next: starter quests, password reset UI, chat, and automatic reconnect. See `supabase/README.md` for the deployed setup and current limits.

## Frontend-only preview and multiplayer configuration

A deployed frontend with no `VITE_SERVER_URL` runs **Local preview · No multiplayer** after you explicitly choose **Play as guest** on the login screen. Keyboard, click/tap navigation, collision, stamina, sprite animation and camera movement work locally. If an explicitly chosen guest connection fails, the same labeled preview is enabled. Account failures remain on the login screen with Retry. Preview movement is not sent to a server and is not saved. A lost established multiplayer connection stops movement and returns to the login screen with Retry; it does not silently convert a shared session to local play.

For multiplayer on Vercel, deploy `apps/server` to a WebSocket-capable Node host, then set `VITE_SERVER_URL=wss://your-backend-host` in the Vercel project and redeploy. Vercel serves the client; it does not run the long-lived Colyseus process on port 2567. Local development still attempts the server at the browser hostname on port 2567. Walk animations now depend on simulated displacement, so disconnected or collision-blocked characters stay idle.

Movement browser regression: with Vite and the game server running, run `npm run test:browser`. It uses the committed Citizen sheets and checks automatic loading, world displacement, camera follow, walk/idle state and collision in local-preview and server-connected modes. Install a Playwright Chromium browser first (`npx playwright install chromium`) or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an existing Chromium binary. `TEST_CLIENT_URL` overrides the Vite URL (default port 5173). This check imports the Vite entry module to inspect actual world positions; run it against the development server.

## Village portal

The Wayfarer Portal is in the middle of Elderwood square. Click/tap it to approach and open destinations. Choose Whispering Woods, Crystal Caverns, or Murkmire Swamp. Each region has a return portal. Close the picker with × or Escape.

Travel works in local preview and multiplayer. Connected travel is validated by the server against the current player position and allowed destination IDs; arrivals and map collisions come from shared configuration. The client only renders players in its own region. Regions currently share the room's total 32-player capacity; this is not independent regional sharding. Region selection is temporary and resets to Elderwood on a fresh session. Both the client and server must be deployed together for the updated region state/message protocol.

The three destinations have distinct palettes and collision layouts. Whispering Woods now has wolf combat; the caverns and swamp remain exploration prototypes. Gathering remains future work; wolves now grant EXP and collectible gold/pelts. Original character artwork, idle/walk animations and movement controls are preserved.

## Wolf combat

Travel to Whispering Woods, leave the portal sanctuary, and click/tap a monster. Selecting a monster moves into a clear position for the equipped weapon and attacks automatically in range. The route follows a moving target; ground clicks, keyboard movement or Escape cancel the attack. New characters know no spells. Learn Spark, Mend or class spells from Mara → Learn spells using gold. Learned spell buttons appear above the bottom icons while a living monster is selected. Click a spell to cast, or press 2 for the selected spell. Class spells unlock at level 5: Knight Cleave, Archer Power Shot, Mage Moon Nova and Rogue Shadow Strike. Click the ground or press Escape to clear the target and stop attacks. Potion and loot remain on the bottom bar. Selected targets show approaching, blocked, sanctuary or in-range status even before learning spells; a green target ring means the equipped weapon has a clear shot. Windups pulse orange, hits show an impact burst and trailing health loss, and death poses linger before fading. Arrows and magic bolts have distinct travel effects. Loot bundles glow (violet for unidentified gear); click a bundle or the Loot button to walk into clear pickup range and collect it once. Movement, Escape and other interactions cancel a queued pickup. Wolves and spiders ignore nearby players until damaged, then retaliate. Level-6 boars and the Forest Bear boss acquire nearby players automatically. Defeated players return to Elderwood; monsters respawn.

See `docs/COMBAT.md` for authority, lifecycle, balance configuration, tests and limits. Run `npm test`, then (with services running) `npm run test:integration` and `npm run test:browser` sequentially. Browser combat checks use the Canvas renderer to avoid software-WebGL stalls in headless CI. Real device and production deployment checks remain separate.

## Loot, EXP and trading

Wolf kills grant character EXP and leave private bundles of gold and wolf pelts. Pick up nearby spoils with **E**, **Loot**, or a click/tap. Open **Bag / I** for your 12-slot inventory. Return to Elderwood and visit **Mara the Trader**, east of the portal: sell pelts and buy healing potions. **3 / Potion** heals a wounded character. Levels and EXP appear on the HUD.

All connected rewards and transactions are server-controlled. **Signed-in characters save progress to Supabase** across reconnects and server restarts. Guest progress resets on disconnect/reload. Uncollected ground drops remain temporary. Configure both migrations and credentials before enabling accounts; see `supabase/README.md`. See `docs/REWARDS.md` for prices, rules, tests and current limits.

## Compact HUD

A compact top-left profile button shows the player sprite, level, health, mana and EXP. Its popup has Character and Settings tabs. Character contains vitals, gold, equipment, skills, class choice and account status. Settings contains appearance, sprint, zoom and control hints. The bottom bar contains a generated bag sprite button, potion and loot. Learned spells appear above it only when a living monster is selected. There is no joystick, Actions drawer or Interact button. World interactions are clickable; keyboard shortcuts remain available. Notices fade after a few seconds.

## Citizen and class progression

New characters are Citizens. At character level 5, open your **profile** and choose **Knight, Archer, Mage or Rogue**. The choice grants and equips its starter weapon. The same panel selects owned weapons and displays **Melee, Distance and Magic** skills. Weapon type determines attacks; its matching skill improves damage. Citizens receive training weapons to try the styles. Stop attacking before swapping. Class and skill progress save for signed-in characters; guest progress is session-only. See `docs/CLASSES.md` for the current design, formulas and limits; it supersedes the original classless specification.

## Elderwood terrain

Elderwood now uses the complete layout from the latest `assets/maps/elderwood/Reference.png`: seven buildings, a five-stall market, farm, training yard, central upright portal, gates, fences, furniture and woodland. SVG prefabs in `assets/maps/elderwood/svg/` render as separate objects with depth based on their feet. Only trunks and solid bases collide, so players can walk behind foliage and roofs. The shared layout in `packages/game-data/src/elderwood.ts` drives rendering, exact footprint collisions and navigation; `island-layout.ts` supplies reusable placement and spatial collision helpers. `npm run art:elderwood` regenerates the SVGs and a standalone `full-map.svg`. Original PNGs and the new reference are preserved. Future island references can go under `assets/maps/whispering-woods/`, `crystal-caverns/` and `murkmire-swamp/`; their current gameplay maps are unchanged.

## Elderwood portal artwork

Elderwood's portal uses the generated village PNG atlas, with a separate pulsing ground glow and interaction zone. Click/tap it to approach and travel. Original portal PNGs and legacy SVG sources are retained.

## Mara artwork

Mara uses `assets/characters/Mara the Trader RPG Sprite Sheet.png`, unchanged. `apps/client/src/mara-assets.ts` defines explicit crop rectangles and separate `mara-` animation names. Idle columns use rows down/left/right/up; in the walking half, both middle-row frames of column 3 face right and both middle-row frames of column 4 face left. Frames use a common logical canvas and foot baseline so animation changes do not move the sprite anchor. She stays at her shop playing idle; walking frames are registered for future movement. Her shop location and interaction are unchanged.

## Whispering Woods terrain

`assets/tilesets/whispering-woods/Whispering Woods Fantasy Tileset.png` supplies forest grass, leafy dirt paths and the mossy stone portal clearing. `apps/client/src/terrain-assets.ts` defines interior crop frames and stable coordinate-based variation. The original PNG and two-pixel tile gaps are preserved. Wolves, spawn locations, obstacles, combat, and portal sanctuary/travel remain unchanged. Water frames are available but not placed; adding forest ponds will require shared collision changes.

## Starting screen

Each launch starts with Sign in, Create account and Play as guest. Remembered
accounts show Continue adventure; they do not join the world automatically.
The game preloads artwork behind the starting screen but does not advance its
simulation or connect to multiplayer until a mode is chosen. Guest mode is
explicitly unsaved, including when it uses local preview. Failed account loads
stay on the starting screen with Retry. Save & sign out returns to login;
Return to login leaves a guest character. The fullscreen screen supports
desktop, mobile and landscape layouts and cannot be dismissed with Escape.

## Login artwork

`assets/ui/login/Realm of Shadows Login Screen.png` is the original portrait
login artwork, bundled through Vite CSS without changing the PNG. Real email
and password inputs and sign-in/create-account/guest buttons align to the painted
frames. The painted Username label is covered by the real Email placeholder.
The decorative Remember Me/Forgot Password row is covered by an unsaved-guest
notice because those controls are not implemented. Account errors and Retry
remain interactive. Remembered accounts receive a readable Continue adventure
panel. The portrait is fitted without cropping; small landscape screens scroll
instead of shrinking the controls below usable sizes.


### Bag equipment and item art

The bag shows eight equipped slots: weapon, off-hand, head, chest, legs, feet,
necklace and ring. Open “Equipment in your bag” to switch owned weapons or equip
starter clothing and a shield. Tap equipped clothing/shield to remove it. These
five starter items each give 1 armor, reducing wolf-hit damage by that amount
(minimum 1 damage). New and existing characters receive them unequipped; necklaces
and rings have slots ready for future items. Equipment swaps are blocked during
auto attack and while defeated. Equipment ownership is separate from the 12
supply-stack slots. Signed-in equipment persists; older saves migrate on load.

Transparent starter SVG item sprites live in `assets/items/`. Replace any icon
by uploading a transparent PNG with the same item ID, such as `sword.png`,
`clothTunic.png` or `potion.png`. PNG overrides WebP/SVG after the next client
build. See `assets/items/README.md` for the naming rules. Original character and
map assets are untouched. Run `npm run test:equipment:browser` with the normal
Playwright/client URL environment variables to check desktop/mobile bag controls.


### Directional Citizen animation sheets

`assets/characters/Citizen_walk_down.png`, `Citizen_walk_left.png`,
`Citizen_walk_right.png` and `Citizen_walk_up.png` each contain six horizontal
256 × 256 cells. The first cell supplies that direction's idle pose; cells 2–6
loop at 8 FPS while moving. `apps/client/src/character-assets.ts` records the
alpha bounds; runtime trim frames align centers and feet on a shared canvas,
including the upward frames with drifting transparent margins. Profile portraits
use the down-facing idle pose. These sheets replace the earlier combined sheets
for players and peers; originals and Mara's independent animations are unchanged.

### SVG paper-doll trial

Players now default to a layered SVG character. Equipped hood, tunic/sleeves,
trousers, boots, shield and every current weapon appear on the model, follow
idle/walk motion in four directions, and update the profile portraits. Other
players see the equipped look through a small public appearance field; inventory
and ownership remain private. Mara and original PNG sheets are preserved. In the
character profile, **Character appearance → Original character** switches back
for comparison (a local browser preference). See
`assets/characters/paper-doll/README.md` for art/rig details. Verify the trial with
`npm run test:paper-doll:browser` against a running client/server.


Full-island verification: `npm run test:island:browser` checks the assembled
village and real click-to-move routes using 100ms frames, including Mara's shop,
the bank and a southern footbridge. Route steering recalculates each fixed tick
so slower frames cannot repeatedly overshoot a waypoint. Collision checks use
polygon/footprint intersections, including thin fence posts; a spatial index
keeps the denser scenery local to each movement query. Reference-derived new
buildings are landmarks; existing trading remains with Mara at the tavern.

Whispering Woods now follows `assets/maps/whispering-woods/Reference(1).png`:
four habitats around a central portal, separate SVG scenery, shared collision,
and eight monsters (three wolves, two Thorn Spiders, two Wild Boars, one Forest
Bear boss). Run `npm run art:woods` and `npm run art:monsters` to regenerate its
vectors. `npm run test:woods:browser` checks guest and multiplayer rendering,
navigation and clickable combat against a running client/server. See the map
and monster asset READMEs for the editing workflow. Deploy both the client and
server together because the layout, monster definitions and replicated state
changed. Existing uploaded reference and sprite PNGs are preserved.


The live art pipeline now uses generated painted PNGs throughout Elderwood,
Whispering Woods, item/equipment icons and the modular character. See
`assets/generated/README.md` for all seven sheets, atlas coordinates and complete
map previews. The previous SVG files/generators remain as source references;
they are no longer loaded by the client. All map geometry, collisions, gear
layering, monster mechanics and saved progress retain their existing behavior.
This art update requires a Vercel client deployment; no server update is needed.


The coordinated blue-cape character/style pass is documented in
`assets/ART_DIRECTION.md`. The live adventurer now uses connected joint overlaps,
a fitted cape, proper side-view clothing and boots, and fitted hooded heads.
All generated world/item/monster sheets reference the same hero model, palette,
outline/shading treatment and light direction. Uploaded classic sprites remain
preserved. `npm run test:character-style:browser` checks the equipped/base
turnarounds, neck continuity, native facing directions and cape layering.

## Edit monster and portal placements

Open `/map-editor.html` on the deployed client, or run `npm run map:editor` and
open `http://localhost:5190/map-editor.html`. This is a placement editor, with
zoom/pan, draggable monster/portal markers, approach-monster additions/removal,
undo and JSON import/export. It does not write to GitHub or modify the live game.

Export `woods-placement.json`, then replace
`packages/game-data/src/woods-placement.json` with the downloaded file (or send
it back for application). Run `npm test` and `npm run build`, commit, and deploy
both Vercel and Render. Terrain, painted paths/plazas and walls need separate
artwork/collision edits; the editor background shows the last painted version.
New approach spurs and collision clearances derive from the placement data, but
painting their appearance still requires a ground-art pass when moved substantially.
