> Legacy vector source: the live game now uses generated PNG artwork. See
> `assets/generated/README.md` for the current asset pipeline. The instructions
> below describe the preserved vector reference workflow.

# Whispering Woods monster vectors

The Thorn Spider, Wild Boar and Forest Bear have original transparent SVG frames
created with `scripts/build-monsters-svg.ts`. Run `npm run art:monsters` after
editing it. Each has four directions and six frames each for idle, walk and attack, on
192 × 160 transparent canvases. The bear has a broad body and moss mantle, the
boar has a bristled ridge and curved tusks, and the spider has eight articulated
legs, a segmented carapace, six eyes and fangs.
The existing uploaded Wolf PNG animation sheets remain in use and unchanged.

The browser loads these as Phaser textures once and animates them without
regenerating SVGs at runtime. Health bars, level/name labels and click targets
are separate game objects. The Forest Bear is larger and marked BOSS.

Gameplay stats and eight spawn positions live in `packages/game-data/src/monsters.ts`.
Wolves use their existing bite with a visible attack motion. Spiders warn for
0.45 seconds before shooting venom at a fixed ground position; the projectile
can be dodged. Boars warn for 0.65 seconds before charging along the marked line;
the charge stops at terrain and cannot damage players in the sanctuary. The
bear warns for 0.85 seconds before its close-range area slam. Moving out of the
marked area avoids damage. Windups cancel when the target enters sanctuary.
Selected enemies have ground rings; taking damage briefly flashes their sprite. All enemies
chase within their habitat leash, return and heal when disengaged, and respawn.
Combat and rewards are authoritative on the server and also run in guest preview.

Wolves retain 35 EXP, 6 gold and one pelt. Spiders award 30 EXP / 12 gold,
boars 45 EXP / 18 gold, and the bear 180 EXP / 75 gold. Non-wolf loot is currently
gold only; no new inventory or save schema is needed. Rewards remain private to
the player credited with the kill, and gold requires collecting the loot bundle.
