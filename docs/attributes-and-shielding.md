# Attributes and Shielding

Open the character profile and expand **Attributes** to spend points. Characters
start with 10 in every attribute and earn three points for each level after 1.
Unspent points are derived from level and invested attributes, so existing
characters receive their full retroactive allowance. Each attribute caps at 100.

| Attribute | Benefit per point above 10 |
| --- | --- |
| Strength | +0.75 melee weapon and melee spell damage |
| Dexterity | +0.75 distance weapon and distance spell damage |
| Intelligence | +0.75 magic damage and +3 maximum mana |
| Vitality | +5 maximum health |

Damage still uses the weapon/spell's matching combat skill. Integer damage rounds
at the end. Projectile damage captures attributes at firing/casting time. Spending
a point increases capacity without instantly healing or restoring mana. Potions,
Mend, regeneration, login and respawn all respect the increased limits. Attributes
do not unlock spells; spells must still be learned.

Shielding appears beside Melee, Distance and Magic. Equip a shield and take a
physical attack to train. After normal armor mitigation, a shield prevents
`1 + floor((shieldingLevel - 1) / 5) + floor(shieldArmor / 3)` damage, limited so
at least one damage gets through. Each successful block awards five skill EXP,
using the same level curve and level-100 cap as other skills. Fully mitigated
attacks that already deal the minimum damage award no shielding EXP. Unequipping
the shield removes its blocking benefit. Bites, charges and slams can be blocked;
poison and crystal projectiles bypass Shielding. Existing armor mitigation remains.

The server owns points, spending, shield state, mitigation and training. Saves
retain attributes and shielding EXP. Legacy version-1 saves receive base
attributes and zero shielding EXP; malformed or overspent values are rejected.
No database migration is needed. Deploy Vercel and Render from the same commit
because player schema and economy snapshots gained fields.

Checks: `npm test`, `npm run test:accounts`,
`npm run test:attributes:browser`, and
`TEST_SERVER_URL=ws://localhost:2567 npx tsx tests/shielding.integration.ts`.
