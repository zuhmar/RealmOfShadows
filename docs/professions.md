# Professions and crafting

All characters can train all eight skills independently, from level 1 to 100:

| Gathering | Crafting | First processing recipe |
| --- | --- | --- |
| Mining | Blacksmithing | 3 ore → 1 matching bar |
| Fishing | Cooking | 2 raw fish → 1 cooked fish |
| Herbalism | Alchemy | 3 healing herbs → 1 healing potion |
| Woodcutting | Woodworking | 2 logs → 1 timber |

Click a resource to walk into gathering range. All nodes are on reachable land;
fishing spots border water. Nodes do not add collision or change terrain. Successful
gathering grants one material and profession EXP, with no character EXP or gold.
Resources replenish after 45 seconds, shared by players in the same server room.
Players have a two-second gathering cooldown. A depleted node fades and displays
its countdown. Range, region, sight, skill level, alive state, combat state,
cooldowns and bag space are checked by the server. No tool items are required.

| Ore | Mining / processing level | Vein region | Status |
| --- | ---: | --- | --- |
| Copper | 1 | Whispering Woods | Playable |
| Iron | 11 | Crystal Caverns | Playable |
| Gold | 21 | Murkmire Swamp | Playable on its current starter map |
| Mythril | 31 | Frostfall Tundra | Defined for future map |
| Dragon | 41 | Ember Peaks | Defined for future map |
| Shadow | 51 | Shadow Fortress | Defined for future map |

There are two veins per configured region. Elderwood, Woods and Caverns also have
fishing, herb and timber nodes. Advanced node definitions and material icons are
ready, but this feature does not add unfinished islands. Mining node material
progression is separate from monster equipment drop tiers; existing loot tiers
and quest objectives are unchanged.

The workbench stands beside Elderwood's blacksmith at (20.5, 10.5). Click it to
walk over and open Bag → Professions and crafting. Recipes can be inspected
anywhere, but crafting requires standing within two tiles of the bench. Expand
a profession pair to see its levels, EXP bars, costs, required levels and recipes.
Skills use 10 × (level − 1)² EXP thresholds; successful crafting grants only its
own crafting skill EXP. Gathering and crafting levels do not automatically raise
each other, and no class restricts a profession.

Blacksmithing produces all seven armor/accessory slots plus swords and daggers
across Copper, Iron, Gold, Mythril, Dragon and Shadow. Woodworking produces bows
and staffs across those six tiers, using timber and metal bars. There are 66 gear
recipes plus six smelting recipes and the three basic processing recipes.
Crafted equipment is an identified Uncommon item with a unique UUID and normal
equip-level requirements. Monster drops retain their identification and higher
rarity rolls. Crafting does not count as identifying monster equipment.

Cooked fish restores up to 30 HP from the bag and shares the healing-potion
cooldown. Alchemy creates the existing 40-HP healing potion. Materials and food
use normal stack limits, 32-slot bag rules, Mara selling and personal Depot
storage. Crafting consumes ingredients across stacks atomically; missing
materials, insufficient output space or gear limits cost no items or EXP.
Requests cannot override recipe costs, quantities, quality or skill rewards.

The eight profession EXP values persist in private account saves and snapshots.
Old saves migrate to eight level-1 skills. Validation rejects unknown/missing
skills, negative/fractional EXP and values above the level-100 cap. World node
respawn timers and brief player gathering cooldowns are transient room state;
they reset on a server restart. Guest skills and materials remain session-only.
No database migration is needed. Deploy Render and Vercel from the same commit.

Generated masters are preserved under `assets/professions/masters/`. The 17 usable
item icons plus a fishing-spot marker are true-alpha 96×96 PNGs under
`assets/items/professions/`; the existing automatic item loader finds them.
`npm run art:professions` reproduces crops from transparent gutters without
clipping ore tips or changing the source art.

Validation: `npm test`, `npm run test:professions:browser` (TEST_CLIENT_URL),
`npm run test:professions:integration` (TEST_SERVER_URL; defaults to port 2655),
and `npm run test:accounts` for private skill and crafted-supply persistence.
