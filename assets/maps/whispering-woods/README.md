# Whispering Woods

The original uploaded reference is preserved. The live map uses the generated
PNG ground in `assets/generated/woods-ground.png` and separate generated props
for correct depth around players. `assets/generated/previews/whispering-woods-full-map.png`
is a complete assembled review export.

The expanded source layout is 3264×2176, with 68×48 world bounds: roughly twice
the preceding expanded ground area. The Woods portal and arrival sit near the map center; Elderwood keeps its original portal.
Eight landmarks connect through the main trail network. Wolves occupy the northwest,
spiders the southwest, boars the northeast and the Forest Bear the southeast.
The normal habitats have identical 360×240 source-unit territory radii and six
spawns each. Each spawn has a small dirt pocket and an explicit branch path;
forest bands separate the wolf and spider areas instead of merging their clearings.
There are twenty-eight enemies total: six core and three approach encounters per normal species, plus one boss. Spawns stay at least 3.5
tiles apart and outside the portal sanctuary. The boss has a continuous stone
boundary with one northern entrance. Shared wall collision blocks movement and
sight through its sides and bottom. No doors lock players into the arena.
Quiet lookout, grove and crossroads areas remain available for exploration.

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

`woodsHabitats`, editable `woods-placement.json` and `woodsSpawnTrails` define the balanced
habitat and pocket layout directly in source pixels. There is no incremental
stretch transform. Monster world coordinates derive from those same pocket
coordinates. `tests/woods-layout.test.ts` validates equal populations, pocket
access trails, forest separation and the boss wall/entrance collision.

Open `/map-editor.html` for draggable monster and portal placements. Export the
JSON and replace `packages/game-data/src/woods-placement.json`; the editor does
not publish edits. The Woods portal source position and arrival/sanctuary come
from this same file through `portalFor(region)`. Painted plazas and ground trails
need repainting after substantial layout edits; the editor does not paint terrain
or alter boss walls. Editor/portal tests: `test:map-editor:browser` and
`test:woods-portal:browser`.
