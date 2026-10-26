# Monster equipment and identification

Every current monster has a 20% chance to include one unidentified item in its
private loot bundle; bosses have a 65% chance. The item is chosen from all eleven
armor/weapon types in the island's tier. Materials, gold and experience continue
to drop as before. Future islands use the same tier table when their encounters
are added; this change does not add those maps or monsters.

| Island | Equipment tier | Minimum equip level |
| --- | --- | ---: |
| Whispering Woods | Copper | 5 |
| Crystal Caverns | Iron | 11 |
| Murkmire Swamp | Gold | 21 |
| Frostfall Tundra | Mythril | 31 |
| Celestial Realm | Dragon | 41 |
| Ember Peaks | Shadow | 51 |
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
base item, including low armor values. Material rank is Copper=1 through Shadow=6.
Epic adds one material rank in a secondary attribute; Legendary adds two.
Weapons favor their matching Strength/Dexterity/Intelligence. Head/neck favor
Intelligence, feet/ring Dexterity, legs Strength, and chest/shield Vitality.

Items have individual UUIDs, so duplicate base items can have different rarities.
Unidentified items cannot be equipped. Identified items must meet their minimum
level. Repeated identification cannot reroll a rarity. Equipped items cannot be
discarded. The monster equipment bag holds 32 items, including equipped pieces;
it is separate from supply slots and existing catalogue ownership. If either
needed capacity is full, pickup changes nothing and leaves the bundle available.

Equipped bonuses contribute to armor, shield protection, weapon attack and
effective attributes. Allocated attributes and spendable points remain separate.
Removing/replacing gear removes its bonuses and clamps health/mana to the new
maximum without healing or restoring resources. Existing sprites show the base
material; rarity colors, names, stats and bonuses appear in the bag.

Starter and trader equipment remain ordinary identified catalogue items. Old
saves migrate to empty individual-item bags while retaining equipment, skills,
attributes and ownership. Saves validate UUIDs, duplicates, rarities, material,
slot, level and selected-instance/base consistency. Stats are derived from the
base and rarity, never accepted from request payloads or saved bonus fields.
No database migration is needed. Deploy the client and server from the same
commit because snapshots and the player weapon-bonus schema changed.
