# Island quests

Each of the seven combat islands has two main quests and three optional side
quests, defined in `packages/game-data/src/quests.ts`. Elderwood is the quest
hub: speak with Mara, open Bag → Quests, expand an island, and accept quests.
Return to Mara to claim the listed gold and EXP. The journal can be read anywhere.
Main quest two requires claiming main quest one. No quests gate travel or combat.

Whispering Woods and Crystal Caverns currently have playable encounters and
therefore ten playable quests. Swamp, Tundra, Celestial, Peaks and Fortress each
have five defined quests shown as Planned. Acceptance is disabled until those
islands' encounters are implemented. No nonexistent monster art or maps are added.

| Island | Main 1 | Main 2 | Side 1 | Side 2 | Side 3 |
| --- | --- | --- | --- | --- | --- |
| Woods | 6 wolves + 4 spiders | 1 bear | 5 boars | Identify 2 Beginner items | Collect 6 bundles |
| Caverns | 6 bats + 4 golems | 1 wyrm | 5 crawlers | Identify 2 Copper items | Collect 6 bundles |
| Swamp (planned) | 6 bog slimes + 4 lurkers | 1 hydra | 5 bog slimes | Identify 2 Iron items | Collect 6 bundles |
| Tundra (planned) | 6 frost wolves + 4 ice trolls | 1 frost giant | 5 frost wolves | Identify 2 Gold items | Collect 6 bundles |
| Celestial (planned) | 6 fallen sprites + 4 sentinels | 1 fallen seraph | 5 fallen sprites | Identify 2 Mythril items | Collect 6 bundles |
| Peaks (planned) | 6 fire imps + 4 magma golems | 1 infernal drake | 5 fire imps | Identify 2 Dragon items | Collect 6 bundles |
| Fortress (planned) | 6 shadow knights + 4 liches | 1 shadow dragon | 5 shadow knights | Identify 2 Shadow items | Collect 6 bundles |

Only events after acceptance count. Credited kills, successful private loot
pickups, and first identification of a matching-tier item advance objectives.
Lower floors count for their parent island. Identification may happen anywhere;
items and loot remain yours. Repeated identify/pickup requests do not count twice.
Progress caps at the objective target. Completed quests pay once, server-side;
client-supplied rewards, counts and claimed flags are ignored. Rewards use no bag
slots and do not grant spells, equipment, attributes or automatic class choices.

Woods rewards (gold/EXP) are main 1: 35/100, main 2: 60/150, side 1: 25/75,
side 2: 20/60, side 3: 20/60. Later island rewards scale by island index; they are
one-time expedition bonuses alongside existing monster rewards. Acceptance
levels are 1, 11, 21, 31, 41, 51 and 61.

The private profile stores each accepted quest's progress array and claimed flag.
Existing saves migrate to an empty journal without resetting anything. Validation
rejects unknown IDs, wrong array lengths, invalid counts, incomplete claimed
quests, missing main prerequisites, planned quests and quests above the saved
level. Private snapshots clone the journal and never broadcast it in player
schema. Existing authenticated autosave and logout saving persist the journal;
guests retain temporary session-only progress. No SQL migration is required.

Validation: `npm test`, `npm run test:quests:browser` (Vite on localhost:5252 or
TEST_CLIENT_URL), and `npm run test:accounts` (includes journal persistence and
one-time reward claiming through a real server restart). Deploy both Render and
Vercel from the same commit.
