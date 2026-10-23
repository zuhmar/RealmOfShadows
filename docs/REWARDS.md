# Hunting rewards and merchant loop

## Play

1. Use the village portal to enter Whispering Woods and fight wolves.
2. Each wolf grants **35 character EXP** to the player who lands the killing blow. It leaves an owner-only bundle containing **6 gold and 1 wolf pelt**.
3. Walk close and click/tap the bundle, press **E**, or use **Loot**. Bundles expire after 90 simulation seconds. Pickup requires the correct region, proximity, clear sight and available inventory space.
4. Press **I** or **Bag** to inspect your inventory, gold and level. The bag holds 12 stack slots; pelts stack to 20 and potions to 10.
5. Return to Elderwood and visit **Mara the Trader**, east of the portal. Click/tap her or use Interact nearby. Sell all pelts for 4 gold each; buy individual healing potions for 12 gold.
6. Press **3** or **Potion** to restore up to 40 health. Potions have a three-second cooldown and cannot be consumed at full health or while defeated.

Two wolf kills provide 12 gold and two pelts. Selling those pelts gives 20 gold, enough for a potion with 8 gold left.

## Progression

Character EXP is separate from Melee, Distance and Magic skill EXP and future profession skills. Level L requires cumulative `100 × (L − 1)²` EXP: level 1 starts at 0, level 2 at 100, level 3 at 400. The cap is 100. The HUD shows level, gold and EXP progress. This slice tracks character levels; class choice unlocks at level 5, combat skill progression is implemented, and attribute growth remains later work (see `docs/CLASSES.md`).

`packages/game-data/src/economy.ts` defines item stacks, prices, healing, drop contents, inventory capacity and progression constants.

## Authority and transactions

The combat simulation emits one internally identified kill record when an eligible wolf dies. The reward service consumes records in server-generated order and rejects records already processed. Clients cannot submit kill records, currency amounts, item quantities, prices, healing amounts or EXP changes. The current reward policy is last-hit credit, without party sharing or assists.

Each pickup validates drop ownership, expiration, region, range, sight and the entire inventory addition before changing anything. Success adds the bundle and removes its unique ID synchronously; replay finds no drop. A full bag leaves both currency and bundle unchanged. Trades validate life state, town/merchant proximity, funds and capacity before applying the whole operation. Sales consume existing pelts before crediting gold; purchases deduct the fixed price and add exactly one potion. Failed actions leave the profile unchanged. These are atomic in-memory operations in one server process; database transactions will be required when persistence is added.

Colyseus sends each player a private inventory/reward snapshot; inventories and owner-only drops are not included in other players' snapshots. Item stack IDs are generated internally. Gold cannot become negative through the supported operations.

Local preview uses the same reward service locally and remains labeled. In connected games the server is authoritative.

## Lifetime and limits

Collected gold, EXP and inventory survive death and portal travel within the current session. Uncollected drops keep their expiry timer. **Progress is temporary:** disconnect/reload, room teardown or server restart resets it. There are no accounts, saved characters, item trading, equipment or durable economy yet. Publish the updated client and server together. The original character and wolf PNGs are unchanged; loot and the trader use placeholder presentation.

## Validation

`npm test` includes kill/EXP uniqueness, progression boundaries, ownership/range/region/expiry, duplicate pickup, stack capacity, merchant validation, fixed prices, insufficient funds, potion effects/cooldown/full-health/death, and session reset. `npm run test:integration` uses real wolf kills and two Colyseus clients to check private rewards, malicious messages, duplicate/foreign pickups, sales and purchases. `npm run test:browser` exercises the hunting-to-merchant loop and potion healing in preview and connected modes, alongside existing movement/portal/combat checks. Run integration and browser suites sequentially against a dedicated server.
