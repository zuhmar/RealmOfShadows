# Character selection and paid services

New account characters must select Male or Female. This controls the male/female
variant of every outfit, including the automatic Adventurer/class outfit. Existing
saves infer sex from their equipped variant (automatic outfits default to male).
Joining an existing slot never overwrites its saved sex with creation options.

The shop Services category sells three separate $7.50 USD tokens:

- Sex change: switches male/female, keeping outfit themes and account purchases.
- Reset stats: restores base attributes and refunds every spent level-up point.
  Trained combat/profession skills, level and gear stay intact.
- Change class: requires level 5 and an already chosen class. Select a different
  Knight, Archer, Mage or Rogue. Level, XP, attributes, skills, weapons and gear stay
  intact. Spells the new class cannot learn are removed; they must be relearned if
  changing back. An equipped old class outfit returns to automatic.

Purchased tokens are account-wide balances, usable once on any of the four
characters. Use them from Services while alive in Elderwood and out of combat.
The confirmation spends one token on the active character. Guests cannot use them.
These balances do not occupy bag slots. Buying more of a service is allowed.

## Deployment

1. In Supabase SQL Editor, run the complete
   `supabase/migrations/202611010001_character_services.sql` after the existing
   character slots and cosmetic shop migrations. It is safe to rerun.
2. Deploy both Render (server) and Vercel (client). Existing PayPal credentials,
   webhook and shop configuration still apply; no new environment variables.
3. Verify a new female character, its class outfit, a sandbox $7.50 checkout,
   confirmation, token balance decrement, and persistence after reconnect.

This workspace did not apply the production migration or charge a live payment.
The server verifies PayPal's SKU, account, currency and exact per-item price.
The ledger rejects duplicate capture IDs. Token spending and character save are
one leased SQL transaction, serialized across account characters and per-character
save writes. Refund/dispute blocks prevent unused tokens from being consumed.
Already used character changes are not automatically reversed by refunds.
Uncertain transactions disconnect and block subsequent saves until reconnect.

Validation: unit/SQL/payment tests in `tests/character-services.test.ts`, actual
server/database flows via `npm run test:character-services:integration`, and desktop
plus mobile UI via `npm run test:character-services:browser` with TEST_CLIENT_URL.
