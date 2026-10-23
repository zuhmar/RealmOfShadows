# Wolf combat prototype

Travel through Elderwood's portal to Whispering Woods. Three Forest Wolves spawn beyond the portal sanctuary. The supplied idle and walk PNGs in `assets/monsters/` load automatically through Vite. The originals are unchanged; `apps/client/src/wolf-assets.ts` defines crop rectangles, frame rates and four-direction mapping. Wolves use idle while biting and are removed on death; no attack/death sprite sheet is required.

## Controls

Click or tap a wolf to select it. Press **1**, **Space**, or **the weapon attack button** to start repeating attacks with the equipped weapon. **2** or **Moon Nova**, with a magic weapon equipped, casts an area spell centered on the selected wolf. **Escape** or **Stop** clears the target and stops repeating fire. Move with the existing keyboard, right-click/tap navigation or joystick. Attacks do not automatically chase a target. Moving beyond range pauses auto-fire until the target is valid again.

Training-wand Arc Bolt has travel time, a six-tile casting range and a cooldown. Bows fire arrows; swords and daggers use short-range melee. Weapon and skill formulas are documented in `docs/CLASSES.md`. Moon Nova costs mana, has its own cooldown and hits nearby visible wolves around the target. Health, mana, target health, projectiles, area rings and damage numbers provide feedback. Configuration lives in `packages/game-data/src/combat.ts`.

## Authority and lifecycle

`CombatSimulation` in `packages/shared/src/combat.ts` runs on the server for connected games. Clients submit an action and target ID, never damage or rewards. The server validates region, life state, portal sanctuary, range, sight, mana and cooldowns; limits action message frequency; advances projectiles; controls wolf damage, chasing, collision, leashing, return healing, death and respawn. Wolves are synchronized through Colyseus state. Projectile/area graphics are visual representations of server events; hit results come from the simulation.

The portal sanctuary prevents aggro and casting, so arrival and return travel are safe. Leaving the woods cancels combat and invalidates outgoing projectiles. Defeated players cannot move or attack and return to Elderwood after three seconds with restored health/mana. Elderwood regenerates health. Wolves return home when their victim leaves, dies, reaches sanctuary or exceeds the spawn leash. Returning wolves cannot be damaged; dead wolves respawn after ten seconds.

Local preview runs the same simulation locally and remains explicitly labeled. Preview results are temporary, not multiplayer or persisted progress.

## Validation and limits

Unit tests cover damage timing, repeated attack cooldowns, area mana/cooldown/radius checks, invalid targets, sanctuary/range/sight restrictions, wolf pursuit/leash/respawn, player death/respawn and cancellation on travel/disconnect. Multiplayer integration checks two clients observing the same kill, malicious client damage being ignored, wolf bites, observer safety and area-spell cooldown/mana. `tests/browser-combat.cjs` exercises the actual wolf sheets, portal entry, selection and both attacks in preview and connected modes.

Wolf kills now feed the session rewards/inventory service; see `docs/REWARDS.md`. Run suites sequentially against a dedicated test server to avoid shared-world clients affecting one another. The normal movement/portal browser checks remain available. Real-device touch testing, load testing, sound, persistence, balancing and enemy attack/death sheets are not part of this combat slice. Projectile visuals animate toward the target's firing-time position; server simulation handles the actual moving projectile and collision. Deploy the updated client and server together.
