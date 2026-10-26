# Monster equipment and identification

Every current monster has a 20% chance to include one unidentified item in its
private loot bundle; bosses have a 65% chance. The item is chosen from all eleven
armor/weapon types in the island's tier. Materials, gold and experience continue
to drop as before. Future islands use the same tier table when their encounters
are added; this change does not add those maps or monsters.

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
Bank and house storage are not implemented yet.

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
