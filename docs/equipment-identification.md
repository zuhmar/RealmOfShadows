# Monster equipment and identification

Equipment drop chances scale with encounter difficulty. Each successful drop
contains one unidentified item, chosen uniformly from the eleven armor/weapon
types in that island's tier. Rarity odds are the same for every monster.
Lower floors retain the equipment tier of their parent island.

| Monster | Equipment chance | EXP | Gold |
| --- | ---: | ---: | ---: |
| Forest Wolf | 20% | 35 | 6 |
| Thorn Spider | 24% | 45 | 12 |
| Wild Boar | 30% | 60 | 18 |
| Forest Bear | 75% | 180 | 75 |
| Cave Bat | 22% | 80 | 15 |
| Shard Crawler | 26% | 110 | 22 |
| Crystal Golem | 32% | 155 | 35 |
| Crystal Wyrm | 80% | 650 | 160 |

The Woods rates average one equipment drop per five wolves, 4.2 spiders or
3.3 boars. These are independent rolls, not guaranteed intervals. Bosses are
more rewarding without guaranteeing equipment. Spider EXP rises from 30 to 45
and boar EXP from 45 to 60; existing character EXP, gear, rarity odds, equip
levels, gold, material rewards and identification costs are preserved.
Future islands use the tier table when their encounters are added; this pass
does not add those maps or monsters.

| Island | Equipment tier | Minimum equip level |
| --- | --- | ---: |
| Whispering Woods | Beginner | 1 |
| Crystal Caverns | Copper | 5 |
| Murkmire Swamp | Iron | 11 |
| Frostfall Tundra | Gold | 21 |
| Celestial Realm | Mythril | 31 |
| Ember Peaks | Dragon | 41 |
| Shadow Fortress | Shadow | 51 |

Pick up the bundle, open **Bag → Monster equipment**, and tap **Identify**.
Identification is free and available in the bag. It rolls once, on the server:

| Rarity | Chance | Stat multiplier | Primary attribute per material rank |
| --- | ---: | ---: | ---: |
| Uncommon | 60% | 1.15× | +1 |
| Rare | 25% | 1.35× | +2 |
| Epic | 12% | 1.65× | +3 |
| Legendary | 3% | 2× | +4 |

The stat is base armor/attack plus the rounded multiplier increase (minimum +1),
plus rarity rank minus one. This makes every rarity strictly better on the same
base item, including low armor values. Material rank is Beginner/Copper=1, then Iron=2 through Shadow=6.
Epic adds one material rank in a secondary attribute; Legendary adds two.
Weapons favor their matching Strength/Dexterity/Intelligence. Head/neck favor
Intelligence, feet/ring Dexterity, legs Strength, and chest/shield Vitality.

Items have individual UUIDs, so duplicate base items can have different rarities.
Unidentified items cannot be equipped. Identified items must meet their minimum
level. Repeated identification cannot reroll a rarity. Equipped items cannot be
discarded. The shared bag has 32 slots. Each supply stack or unequipped item, including
starter/trader gear, uses one slot. Equipped gear has separate slots. Pickup is
atomic: if it needs more room than available, nothing is collected and the bundle
remains available. Filling existing supply stacks uses no new slot.

Equipped bonuses contribute to armor, shield protection, weapon attack and
effective attributes. Allocated attributes and spendable points remain separate.
Removing/replacing gear removes its bonuses and clamps health/mana to the new
maximum without healing or restoring resources. Existing sprites show the base
material; rarity colors, names, stats and bonuses appear in the bag.

Mara buys unequipped monster gear (identified or unidentified), catalogue gear,
and supply stacks including potions. Prices are server-controlled and shown in
the bag while visiting her. Free starter catalogue items sell for zero gold,
preventing buy/sell loops. Repeated sale requests cannot credit an item twice.
Personal Depot storage is available; house storage is not implemented.

Starter and trader equipment remain ordinary identified catalogue items. Old
saves migrate to empty individual-item bags while retaining equipment, skills,
attributes and ownership. Saves validate UUIDs, duplicates, rarities, material,
slot, level and selected-instance/base consistency. Stats are derived from the
base and rarity, never accepted from request payloads or saved bonus fields.
Older inventories above 32 slots are preserved. They can sell, discard, equip,
consume, or fill existing stacks, but cannot increase slot use until below the
limit. Unequipping and class starter grants must also fit. No database migration
is needed. Deploy the client and server from the same
commit because snapshots and the player weapon-bonus schema changed.

Bag item comparisons show the equipped slot being replaced, attack/armor deltas,
and all gained or lost attributes. Weapon cards also show base weapon attack per
second, range and a skill change warning. This rate excludes skill scaling,
attributes and enemy defense; it is not promised damage per second. Unidentified
stats remain hidden until the server confirms the roll. The bag highlights the
newly revealed card once and announces its name/stats in a status banner; reduced
motion disables the reveal animation. The bag's collapsed loot guide lists tier
progression, encounter drop chances and rarity odds.
