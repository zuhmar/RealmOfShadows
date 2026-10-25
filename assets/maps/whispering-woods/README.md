# Whispering Woods

The original uploaded reference is preserved. The live map uses the generated
PNG ground in `assets/generated/woods-ground.png` and separate generated props
for correct depth around players. `assets/generated/previews/whispering-woods-full-map.png`
is a complete assembled review export.

The expanded source layout is 3264×2176, with 68×48 world bounds: roughly twice
the preceding expanded ground area. The portal and arrival coordinates stay unchanged.
Eight clearings connect through looped trails: portal sanctuary, wolf den,
web hollow, distant boar grounds, Forest Bear arena, overgrown lookout, ancient
grove and old crossroads. The enlarged wolf clearing is over twice its earlier
area. Eastern and southern trails, scenery and spawns are farther apart while props
retain their original gameplay size. Seventeen enemies are distributed across the habitats: six wolves, five
spiders, five boars and one Forest Bear. Every spawn is at least 3.5 tiles from
its nearest neighbor and outside the portal sanctuary. Spider and boar clearings
also have extra room; quiet exploration routes remain between encounters. No new loot or quests
are attached to the scenic landmarks yet.

`packages/game-data/src/woods.ts` owns ground dimensions, clearing/trail guides,
props and full-footprint collision. Water, cliffs and solid props remain blocked
on both client and server. The two side bridges are walkable scenic decks, not
travel portals. `packages/game-data/src/monsters.ts` owns monster stats/spawns.

`scripts/build-expanded-woods-guide.ts` generates the code-native ground guide
used as an image-generation reference. `npm run art:woods` regenerates legacy
vector ground/prop guides and a composed SVG review; it does not repaint live PNGs.
All four monster species use generated directional animation atlases.

Validate with `npm test`, `npm run build`, `npm run test:woods:browser`,
`npm run test:monsters:browser`, `npm run test:woods-exploration:browser` and
`tests/monsters.integration.ts`. Browser/integration checks need local services.
Deploy both Vercel and Render together when geometry or spawns change.

Wolves and spiders retaliate only after taking damage. The level-6 boars and
Forest Bear boss still acquire nearby players automatically; the threshold is
`monsterAggressiveLevel` in game-data. Target selection plans a clear attack
position using equipped weapon range and cancels on manual movement or Escape.
`npm run test:auto-approach:browser` checks melee/ranged approaches on desktop
and mobile, including server-confirmed melee damage. `tests/passive.integration.ts`
checks ordinary-monster passivity and retaliation on the multiplayer server.
