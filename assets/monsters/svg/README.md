# Whispering Woods monster vectors

The Thorn Spider, Wild Boar and Forest Bear have original transparent SVG frames
created with `scripts/build-monsters-svg.ts`. Run `npm run art:monsters` after
editing it. Each has four directions, four idle frames and four walk frames.
The existing uploaded Wolf PNG animation sheets remain in use and unchanged.

The browser loads these as Phaser textures once and animates them without
regenerating SVGs at runtime. Health bars, level/name labels and click targets
are separate game objects. The Forest Bear is larger and marked BOSS.

Gameplay stats and eight spawn positions live in `packages/game-data/src/monsters.ts`.
Wolves use their existing bite. Spiders attack faster, boars move faster and hit
harder, and the bear's close-range slam damages nearby players. All enemies
chase within their habitat leash, return and heal when disengaged, and respawn.
Combat and rewards are authoritative on the server and also run in guest preview.

Wolves retain 35 EXP, 6 gold and one pelt. Spiders award 30 EXP / 12 gold,
boars 45 EXP / 18 gold, and the bear 180 EXP / 75 gold. Non-wolf loot is currently
gold only; no new inventory or save schema is needed. Rewards remain private to
the player credited with the kill, and gold requires collecting the loot bundle.
