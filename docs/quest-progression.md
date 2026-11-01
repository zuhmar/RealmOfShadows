# Progressive quest difficulty

The opening woodland hunt still earns level 5, followed by class choice and primary
skill practice. The Woodland Trial now requires the Forest Bear plus three Wild
Boars credited after acceptance; completing it still reaches level 11 and opens
Crystal Caverns and repeatable monster tasks. No spells are granted automatically.

Each island has a main hunt, then a boss trial with a guard-clearing objective.
Counts increase by island. Bosses require one defeat, not repeated respawn farming.
The live encounter totals in both Woods and Caverns increase between main quests.
Monster stats, spawn positions, level caps and travel rules are unchanged.

| Island | Main hunt | Boss approach | Optional side chain: hunt / identify / loot |
| --- | --- | --- | --- |
| Whispering Woods | 6 wolves + 4 spiders | Bear + 3 boars | 5 boars / 2 beginner items / 16 bundles |
| Crystal Caverns | 10 bats + 6 golems | Wyrm + 8 golems | 8 crawlers / 3 copper items / 24 bundles |
| Murkmire Swamp | 14 slimes + 8 lurkers | Hydra + 13 lurkers | 11 slimes / 4 iron items / 32 bundles |
| Frostfall Tundra | 18 frost wolves + 10 trolls | Giant + 18 trolls | 14 frost wolves / 5 gold items / 40 bundles |
| Celestial Realm | 22 sprites + 12 sentinels | Seraph + 23 sentinels | 17 sprites / 6 mythril items / 48 bundles |
| Ember Peaks | 26 imps + 14 golems | Drake + 28 golems | 20 imps / 7 dragon items / 56 bundles |
| Shadow Fortress | 30 knights + 16 liches | Dragon + 33 liches | 23 knights / 8 shadow items / 64 bundles |

Only Woods and Caverns remain playable; the other rows define future chapters.
Optional side quests unlock in order within each island and never block the main
story. Their EXP and gold rewards rise at each step. Later main chapters also
pay more for increased objectives. Elderwood's optional lessons progress from
carrying a potion, to gathering three resources, to crafting two recipes.

Saved journals are migrated when read, before validation. Already claimed quests
are normalized to the new goals without paying rewards again or removing story
keepsakes/task unlocks. Active quests retain credited counts and receive zero
progress for newly added guard objectives. Previously accepted side quests remain
valid even without the newly introduced prerequisite. Active quests use the new
goals, including quests whose old goal was met but whose reward was not claimed.

No SQL migration is needed. Deploy server and client together so journal objectives
and authoritative completion checks use the same definitions.

Validation: 224 unit/SQL/payment tests, including increasing objective/reward curves,
legacy partial/claimed save compatibility, one-time rewards, rejection of forged
journals, and a real kill/claim route through levels 5 and 11. Browser journal checks
cover desktop/mobile; story server checks cover account saves and restart loading.
