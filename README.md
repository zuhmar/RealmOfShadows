# Realm of Shadows

Phase 1: Elderwood movement foundation. Original flat glossy cartoon art is intended; world graphics are temporary geometric placeholders; the main character uses the supplied idle and walk artwork. No final artwork is generated or replaced.

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

Supabase accounts and character saves are implemented; configure the client/server credentials and run both SQL migrations to enable them. Chat and banking/crafting are not implemented. A session inventory, wolf rewards and a village merchant are available. A first wolf combat slice is available in Whispering Woods. Portal travel is available between the village and three exploration regions. Landmarks are interactive previews of future systems. Fresh joins start at the square. Accounts restore character progress on rejoin; automatic network reconnection remains future work. Current networking is a foundation with approximate snapshot reconciliation rather than timestamped rollback; latency/loss can cause visible corrections. It needs network-condition and load testing before production. Movement input has no economy authority. No production deployment is claimed.

Maps use configuration-defined building rectangles; client world graphics are geometric placeholders. Four-direction idle/walk animation manifests are supported; eight-direction input maps to the nearest primary facing. Sprint reuses walk. Future attacks use projectiles and area spells; character attack and run sheets are not required. Real device touch testing remains outstanding. Backend TLS, origin policy and account authorization belong to later deployment/hardening work.

## Next phase

Supabase email/password accounts and PostgreSQL character saves are available. Next: starter quests, password reset UI, chat, and automatic reconnect. See `supabase/README.md` for the deployed setup and current limits.

## Frontend-only preview and multiplayer configuration

A deployed frontend with no `VITE_SERVER_URL` runs **Local preview · No multiplayer** after you explicitly choose **Play as guest** on the login screen. Keyboard, click/tap navigation, collision, stamina, sprite animation and camera movement work locally. If an explicitly chosen guest connection fails, the same labeled preview is enabled. Account failures remain on the login screen with Retry. Preview movement is not sent to a server and is not saved. A lost established multiplayer connection stops movement and returns to the login screen with Retry; it does not silently convert a shared session to local play.

For multiplayer on Vercel, deploy `apps/server` to a WebSocket-capable Node host, then set `VITE_SERVER_URL=wss://your-backend-host` in the Vercel project and redeploy. Vercel serves the client; it does not run the long-lived Colyseus process on port 2567. Local development still attempts the server at the browser hostname on port 2567. Walk animations now depend on simulated displacement, so disconnected or collision-blocked characters stay idle.

Movement browser regression: with Vite and the game server running, run `npm run test:browser`. It uses the committed Citizen sheets and checks automatic loading, world displacement, camera follow, walk/idle state and collision in local-preview and server-connected modes. Install a Playwright Chromium browser first (`npx playwright install chromium`) or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an existing Chromium binary. `TEST_CLIENT_URL` overrides the Vite URL (default port 5173). This check imports the Vite entry module to inspect actual world positions; run it against the development server.

## Village portal

The Wayfarer Portal is in the middle of Elderwood square. Walk nearby and click/tap it, press Space, or use Interact. Choose Whispering Woods, Crystal Caverns, or Murkmire Swamp. Each destination has the same portal near arrival, with Elderwood available as a return destination. Close the picker with × or Escape.

Travel works in local preview and multiplayer. Connected travel is validated by the server against the current player position and allowed destination IDs; arrivals and map collisions come from shared configuration. The client only renders players in its own region. Regions currently share the room's total 32-player capacity; this is not independent regional sharding. Region selection is temporary and resets to Elderwood on a fresh session. Both the client and server must be deployed together for the updated region state/message protocol.

The three destinations have distinct palettes and collision layouts. Whispering Woods now has wolf combat; the caverns and swamp remain exploration prototypes. Gathering remains future work; wolves now grant EXP and collectible gold/pelts. Original character artwork, idle/walk animations and movement controls are preserved.

## Wolf combat

Travel to Whispering Woods, leave the glowing portal sanctuary, and click/tap a wolf. Clicking enables repeating attacks with the equipped weapon when in range and sight; it does not chase. **1 / the weapon attack button** or **Space** also enables attacks. New characters know no spells. Learn shared **Spark** and **Mend**, or your class spell, from **Mara → Learn spells** using gold. Choose a learned spell in Actions and cast with **2 / Cast spell**; Mend needs no target. Class spells unlock at level 5: Knight **Cleave**, Archer **Power Shot**, Mage **Moon Nova**, Rogue **Shadow Strike**. Learning is explicit, including after choosing a class. **Escape / Stop** cancels attacks. The on-screen buttons support touch. Watch health and mana; defeated players return to Elderwood, and wolves respawn. No attack sprite sheet is needed: wolves use supplied idle/walk sheets, and player attacks use effects.

See `docs/COMBAT.md` for authority, lifecycle, balance configuration, tests and limits. Run `npm test`, then (with services running) `npm run test:integration` and `npm run test:browser` sequentially. Browser combat checks use the Canvas renderer to avoid software-WebGL stalls in headless CI. Real device and production deployment checks remain separate.

## Loot, EXP and trading

Wolf kills grant character EXP and leave private bundles of gold and wolf pelts. Pick up nearby spoils with **E**, **Loot**, or a click/tap. Open **Bag / I** for your 12-slot inventory. Return to Elderwood and visit **Mara the Trader**, east of the portal: sell pelts and buy healing potions. **3 / Potion** heals a wounded character. Levels and EXP appear on the HUD.

All connected rewards and transactions are server-controlled. **Signed-in characters save progress to Supabase** across reconnects and server restarts. Guest progress resets on disconnect/reload. Uncollected ground drops remain temporary. Configure both migrations and credentials before enabling accounts; see `supabase/README.md`. See `docs/REWARDS.md` for prices, rules, tests and current limits.

## Compact HUD

A compact top-left profile button shows the player sprite, level, health, mana and EXP bars. Click/tap it to open the detailed character popup with a larger sprite, vitals, gold, stamina, equipment, skills and class choice. Area info has been removed; the smaller world title stays below the profile, and connection status appears inside the character popup. **Actions** opens spell, potion and loot buttons, and opens automatically when selecting a wolf. **Controls** contains sprint, zoom and control hints. Actions and Controls open one at a time and collapse after portal travel. **Bag** and **Interact** remain on the small bottom bar; existing keyboard shortcuts still work. Notices fade after a few seconds. Panels support click/tap and native keyboard toggling.

## Citizen and class progression

New characters are Citizens. At character level 5, open your **profile** and choose **Knight, Archer, Mage or Rogue**. The choice grants and equips its starter weapon. The same panel selects owned weapons and displays **Melee, Distance and Magic** skills. Weapon type determines attacks; its matching skill improves damage. Citizens receive training weapons to try the styles. Stop attacking before swapping. Class and skill progress save for signed-in characters; guest progress is session-only. See `docs/CLASSES.md` for the current design, formulas and limits; it supersedes the original classless specification.

## Elderwood terrain

Elderwood now uses `assets/maps/elderwood/Base.png` as a single background, preserving its 1536 × 1024 aspect ratio inside the existing world. `Reference.png` is a placement guide and is not bundled into the game. Transparent tavern, blacksmith and portal PNGs in `objects/` render above the ground with depth based on their bases. Unprovided buildings remain open plots. `packages/game-data/src/elderwood.ts` defines image coordinates, water/cliff outlines, bridge decks and collision footprints attached to placed buildings, shared by client prediction, pathfinding and server movement. Movement checks the player footprint against the outlines directly, and Elderwood click-to-move uses a half-tile navigation grid to follow narrower paths. The new base has no tree/boulder blockers; grass, flowers and the former planting-bed areas are walkable. Future placed objects must supply their own collision footprints. Mara stands outside the tavern entrance; her shared position also controls trading range on the server. Update these outlines when changing the ground or placing obstacles. Original source PNGs and the older tileset remain intact; other regions continue using their existing terrain.

## Elderwood portal artwork

`assets/portals/elderwood/Magical Blue Portal Gate.png` replaces the geometric portal in Elderwood. The transparent original is loaded unchanged and scaled proportionally, with its entrance aligned to the existing portal location. A separate ground glow pulses; the artwork stays fully visible. Click/tap the gate or use Interact/Space within the existing range to travel. Other regions retain their existing portals.

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
