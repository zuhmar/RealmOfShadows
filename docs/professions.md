# Professions and crafting

All characters can train all eight skills independently, from level 1 to 100:

| Gathering | Crafting | Legacy processing recipe |
| --- | --- | --- |
| Mining | Blacksmithing | 3 ore → 1 matching bar |
| Fishing | Cooking | 2 legacy raw fish → 1 cooked fish |
| Herbalism | Alchemy | 3 legacy healing herbs → 1 healing potion |
| Woodcutting | Woodworking | 2 legacy logs → 1 timber |

## Resources on every map

Every current gathering map, including both lower floors, contains all six
ore tiers, all eight tree varieties and all eight plants. Elderwood is fishing-only:
no mining, woodcutting or herbalism nodes spawn there. Each gathering map has 37 land
resource nodes: six copies of its local ore, tree and plant type, and one copy of
every other variety. Local-level resources therefore outnumber the rarer higher
tiers without removing them. Lower floors use their parent island’s local types. Island names describe a variety's origin; they do not restrict where that
variety can spawn. A level-1 character with Mining 51 can mine a Shadow vein outside
Elderwood. Only the appropriate profession level, proximity, sight, alive state,
combat state, gathering cooldown and bag space are required.

Positions are deterministic and spread across reachable land, keeping at least
three tiles between centers. They avoid water, cliffs, map-prop artwork, Depot interiors, arrivals,
portal/stair entrances and NPC/workbench interaction space. They do not alter
terrain or grid collision. Click a resource to approach and gather. Tree sprites
become stumps when chopped; ore and plant nodes fade. Nearby/hovered labels show
required levels or remaining refresh time without filling the map with labels.

| Ore | Mining / processing level |
| --- | ---: |
| Copper | 1 |
| Iron | 11 |
| Gold | 21 |
| Mythril | 31 |
| Dragon | 41 |
| Shadow | 51 |

| Origin | Tree → log | Plant | Gathering / processing level |
| --- | --- | --- | ---: |
| Elderwood | Elderwood Oak → Oak Log | Meadowleaf | 1 |
| Whispering Woods | Silver Birch → Birch Log | Whisperfern | 1 |
| Crystal Caverns | Crystalroot Tree → Crystalroot Log | Glowcap | 11 |
| Murkmire Swamp | Bog Mangrove → Mangrove Log | Bogbloom | 21 |
| Frostfall Tundra | Frostpine → Frostpine Log | Frostmint | 31 |
| Celestial Realm | Starwood Tree → Starwood Log | Sunblossom | 41 |
| Ember Peaks | Emberwood Tree → Emberwood Log | Ashroot | 51 |
| Shadow Fortress | Nightwood Tree → Nightwood Log | Nightshade | 61 |

All of these trees, plants and ores are available on current maps, including
varieties originating from islands whose full maps are still unfinished.

## Click-water fishing

Click any water tile to fish. A deep-water click resolves to the nearest fishable
edge of that same connected water body. The player approaches a legal shoreline
cell and casts into water; fishing never allows walking onto water. Bridges and
wall/terrain visibility are checked. There are no standalone fishing-spot nodes.
The selected water gets a targeting ripple, followed by a bobber and a visible
cast countdown. The server chooses an integer duration from one to ten seconds.
The player receives exactly one fish only when the cast completes. Click water
again to recast immediately at the same location; fishing does not exhaust water
or apply a five-minute water cooldown. There is no automatic repeat casting.
Repeated clicks during a cast do not reset its timer or grant extra catches.
Moving, attacking, travel, death or disconnect cancels the cast without a reward.

Each island has three unique local fish. The server chooses uniformly among the
species unlocked by the player's Fishing level; a client cannot choose its catch
or quantity. Lower floors share their parent island's table. Elderwood also has
its own three fish.

| Island | First fish / level | Second fish / level | Third fish / level |
| --- | --- | --- | --- |
| Elderwood | Pond Minnow / 1 | Brook Perch / 4 | Golden Carp / 7 |
| Whispering Woods | Leafscale Minnow / 1 | Mossfin Trout / 4 | Whisper Pike / 7 |
| Crystal Caverns | Blind Cavefish / 11 | Crystal Guppy / 14 | Gemscale Char / 17 |
| Murkmire Swamp | Mudskipper / 21 | Mire Catfish / 24 | Bog Eel / 27 |
| Frostfall Tundra (planned map) | Ice Minnow / 31 | Frost Trout / 34 | Glacier Salmon / 37 |
| Celestial Realm (planned map) | Starfin Dace / 41 | Sunscale Koi / 44 | Moonray / 47 |
| Ember Peaks (planned map) | Ashfin Carp / 51 | Ember Perch / 54 | Flamefin Snapper / 57 |
| Shadow Fortress (planned map) | Gloom Minnow / 61 | Shadow Bass / 64 | Void Angler / 67 |

## Land replenishment and fishing casts

Harvested land nodes replenish exactly 300 seconds after a successful harvest,
shared by everyone in the same server room. The brief two-second player gathering
cooldown applies to land gathering. Fishing instead uses its 1–10 second cast
and can be manually recast as soon as the catch completes. Players can fish the
same water simultaneously, with independent casts and catches.

Range, terrain, skill and bag-space checks are authoritative. Casts start only
from a completed grid step and award nothing early. If the bag fills while
waiting, the cast ends without awarding or overflowing items. The private cast
snapshot is cloned, never added to player schema or saved as character progress.
Completion messages and account saves are triggered server-side. Timers are
transient room state and reset on server restart or disconnect.

## Crafting and persistence

The workbench stands beside Elderwood's blacksmith at (20.5, 10.5). Click it to
walk over and open Bag → Professions and crafting. Recipes can be inspected
anywhere, but crafting requires standing within two tiles of the bench. Each
pair includes a collapsed resource/catch guide, independent skill bars, material
costs, output amounts and level requirements. No class restricts a profession.
Skills use 10 × (level − 1)² EXP thresholds and cap at level 100.

There are 66 equipment recipes across Copper–Shadow, six smelting recipes,
three legacy processing recipes, and 40 new processing recipes: 24 fish, eight
plants and eight wood types. New fish yield cooked meals, new plants yield
healing potions, and new logs yield timber. Higher-level resources give larger
processing batches. Existing material IDs and recipes remain usable, so old
inventory and Depot contents are preserved.

Blacksmithing produces all seven armor/accessory slots plus swords and daggers.
Woodworking produces bows and staffs using timber and bars. Crafted equipment is
an identified Uncommon instance with a unique UUID and normal equip-level
requirements. Monster drops keep their original island tiers, identification and
higher rarity rolls. Crafting does not count as identifying monster equipment.

Cooked fish restores up to 30 HP and shares the potion cooldown. Materials use
normal stack limits, the 32-slot bag, Mara selling and personal Depot storage.
Crafting consumes stacks atomically; failed prerequisites or insufficient output
space cost no ingredients or EXP. Gathering and crafting grant profession EXP,
not character EXP, and do not automatically raise the paired skill.

Profession EXP and all new materials persist in private account saves. Existing
saves migrate normally without resetting quests, items or skills. Snapshots clone
private state and do not broadcast profession EXP in player schema. No SQL
migration is required. Deploy Render and Vercel from the same commit.

Generated masters and extraction layout are preserved under
`assets/professions/masters/`. There are 58 true-alpha 96×96 item/marker PNGs under
`assets/items/professions/` and eight 192×224 tree sprites under
`assets/professions/runtime/`. `npm run art:professions` reproduces crops from
transparent gutters. Item and tree loaders discover these files automatically.

Validation: `npm test`, `npm run test:resource-varieties:browser`,
`npm run test:professions:browser`, `npm run test:professions:integration`,
and `npm run test:accounts`. Browser and multiplayer URLs use TEST_CLIENT_URL
and TEST_SERVER_URL. Tests cover water clicks, shoreline movement, local catch
selection, skill gating on beginner maps, all-map resource coverage, exact
300-second land replenishment, local-tier abundance, 1–10 second casts, manual
recasting, cancellation, independent multiplayer fishing, crafting and
save/restart survival.
