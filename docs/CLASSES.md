# Classes, weapons and combat skills

This is the current design and supersedes the original classless direction in `MASTER_SPEC.md`.

Every new character starts as **Citizen**. At character level **5** (1,600 cumulative character EXP), the Adventurer panel enables **Choose your class**. Choose Knight, Archer, Mage or Rogue. The choice is made once for that character/session; it does not reset on death or travel. The matching starter weapon is granted and equipped:

| Class | Starter weapon | Skill |
| --- | --- | --- |
| Knight | Knight's Sword | Melee |
| Archer | Archer's Bow | Distance |
| Mage | Mage's Staff | Magic |
| Rogue | Rogue's Daggers | Melee |

Citizens have a training wand, sword, bow and dagger so players can try each style before choosing. Any owned weapon is currently usable by any class. Class determines the starter kit; **equipped weapon determines attack behavior and damage**, rather than a class-name multiplier. Class-specific stats, weapon restrictions, equipment artwork and exclusive abilities have not been specified or added. Original idle/walk art is preserved; weapon attacks use effects without requiring attack sheets. Starter weapons are a separate owned equipment collection, not tradable stack items in the loot bag.

## Attacks

Open **Adventurer**, choose an owned weapon, select an enemy, then press **1 / Space / the attack button**. Swords and daggers perform in-range melee hits. Bows fire arrows. Wands and staves fire magic bolts. Each weapon configures attack power, range, cooldown and projectile speed. Movement and targeting remain independent; attacks do not force a chase.

Stop auto-attacking before swapping weapons. Swapping preserves the existing attack cooldown. Projectiles lock in their weapon damage and skill at firing time, so changing equipment cannot upgrade a shot already in flight. **Moon Nova** requires a magic weapon, consumes mana and uses magic skill; its button is disabled with melee/distance weapons.

## Three skills

Melee, Distance and Magic start at level 1 and cap at 100. Each tracks its own EXP, separate from character EXP. Skill level L requires cumulative `100 × (L − 1)²` skill EXP. Eligible basic attack hits grant 5 skill EXP; area spells grant 3 magic EXP for each enemy actually damaged. Misses, invalid/dead/returning targets and repeated input without a successful hit grant nothing. Reaching a cap clamps EXP.

Damage starts with:

```
max(1, floor((weapon attack + 0.6 × matching skill level) × ability multiplier − 0.5 × target defense))
```

Basic attacks use multiplier 1, Nova 1.5. Wolf defense starts at 4. All values and class/weapon definitions live in `packages/game-data/src/classes.ts`. These are initial balancing values.

## Authority, UI and lifetime

The server checks actual character level, the current Citizen status, a valid class, weapon ownership, life state and auto-attack state. Client-provided level, weapon damage or skill values are ignored. Skill EXP is awarded by actual server hit resolution and synchronized to the character panel. Existing gold, loot, potions and character EXP behavior is preserved.

Progress remains **session-only** until persistence is implemented. Disconnect/reload or server restart creates a fresh Citizen. Level-5 choice and training skills survive death and portals only within that session. Deploy client and server together.

## Validation

`npm test` verifies all four choices, level gating, one-time selection, ownership and cooldown preservation, all weapon ranges/damage/skill matching, melee/projectile differences, non-magic spell rejection, skill thresholds, cap, anti-farming and firing-time projectile credit. Multiplayer tests exercise forged requests, bow/sword equipment and server skill rewards. Browser checks cover the equipment UI and four class choices using a seeded level-5 **local preview fixture**; they do not claim a level-5 multiplayer character was leveled through a full grind. Server gate tests separately reject client-supplied level/EXP bypasses. Existing gameplay regression suites still run.
