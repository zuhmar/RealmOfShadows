# Elderwood residential update

Elderwood now has thirty purchasable homes: the existing twenty cliff houses and ten new single-storey homes on the main floor. Five Willow homes occupy the western lower lane and five Sunrise homes occupy the eastern lane. Each has its own stable ID, price, single door, cutaway roof, windows and owner-controlled item displays. Existing cliff house IDs, prices, layouts, ownership and displayed items are preserved.

The former Hall is now the larger Class Hall. Aldren, Lyra, Selene and Corvin share its ground-floor room. Their IDs, class quests and dialogue remain unchanged; journey guidance and server interaction checks use their new positions. The Hall library staircase remains accessible.

The lower village has a scalloped footprint with two residential bays and broad central shoulders. The outer cliff island now has headlands, inlets and trimmed corners. Existing cliff streets bend around the southern inlets. All four cardinal stair IDs are preserved, but their positions now follow the reshaped inner boundary; rendering, upper landings and downward transitions share the same one-cell stair tile.

Cliff feet use rounded, chipped profiles within native 32×32 parts, using the existing fractured stone palette. The rounded contact edge has a restrained shadow and reveals the lower ground beneath. Upper walkways keep their paving clear of grass lips. These art changes are limited to Elderwood.

## Required production step

Run `supabase/migrations/202611020001_ground_houses.sql` in the Supabase SQL Editor after the existing housing and character-slot migrations. It only inserts the ten new catalog rows, uses layout version 2, and can be rerun safely. It does not change any current owner, item display, price or character save. No new environment variables or RPC changes are needed.

Deploy Render and Vercel together because both use the new house and cliff collision layout. Housing transactions remain unavailable until the database contains the complete catalog. This migration was verified locally under PostgreSQL/PGlite; it has not been applied to the production Supabase project from this workspace.

## Validation

- `npm test`: 255 tests passed, including all thirty doors/interiors, main-floor ownership/display authorization, class mentor access, old cliff housing, windows, fences, courtyard paths, stairs and idempotent SQL with existing-owner preservation.
- `npm run build`: TypeScript and Vite production build passed.
- `TEST_CLIENT_URL=http://localhost:5370 node tests/browser-elderwood-renewal.cjs`: actual ground-house door information, Class Hall NPC positions/dialogue, old upper-floor house interactions, desktop/mobile renders and no runtime errors.
- `HOUSING_TEST_GROUND=1 HOUSING_TEST_PORT=32917 npm run test:housing:integration`: real authenticated server walking, ground-house gold purchase, private legendary/supply item placement, public ownership, guest rejection, restart persistence, owner item retrieval and subsequent cliff-manor purchase/three-floor travel.
