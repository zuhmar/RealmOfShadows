# Player houses on Elderwood's cliffs

Five properties sit on widened terraces connected to the existing cliff walk. Every door is one cell wide. Each footprint is a union of rooms, with matching stepped tile roofs and exposed boundary walls; the houses are not square copies. Terrain, walls, roofs and stair parts retain the existing map artwork and grid scale.

| House | Cliff side | Floors | Price |
| --- | --- | --- | --- |
| Briar Cottage | North-west | 1 | 500 gold |
| Pinewatch House | North-east | 2 | 1,000 gold |
| Stonebend Lodge | West | 2 | 1,500 gold |
| Eastridge Manor | East | 3 | 2,500 gold |
| Sunset Terrace | South | 1 | 750 gold |

Climb any of the four village cliff stairs, then click a house's single door. The player approaches its doorstep and opens a dialog. Unowned houses show a gold purchase button; owned houses show their public owner's name. Owners use their Supabase display name if configured, otherwise a public Adventurer identifier. Email addresses and account UUIDs are not sent in housing snapshots.

Only signed-in accounts can buy. Gold and ownership commit in one PostgreSQL transaction. Buying opens the door to visitors; ownership is global across rooms, server restarts and sessions. Anyone can visit an owned house to see its contents, but only the owner can move display items. This first version has no sale, rent, eviction, guest permissions or automatic furnishing grants.

Inside, click a display plinth along the room wall. The owner can choose an unequipped bag item to display, or take the displayed item back. A supply display consumes one unit. Equipment retains its unique instance, identified rarity and attributes. Equipped gear cannot be displayed; full bags prevent retrieval. Plinths are nonblocking. Taking an item that already exists as a unique catalogue weapon/equipment entry in the bag is refused rather than duplicating it. Displayed items are removed from the owner's bag and saved with the house. They remain visible to other players and survive restarts.

House ground floors live on `elderwood-upper`; additional floors use `elderwood-homes-upper` and `elderwood-homes-attic`. Each property's floor stays isolated by edge walls. Paired stairs connect its actual rooms; portal travel cannot enter these floors. Existing Depot/Hall lofts, town buildings, four cliff stairs, game features and supplied art are retained. Guests can inspect houses but cannot buy or move persistent items.

## Deploy

1. In this project's Supabase SQL Editor, run [202610300001_player_housing.sql](../supabase/migrations/202610300001_player_housing.sql) **after the two existing character-save migrations**. It is safe to rerun and preserves existing ownership. It creates global housing rows and service-role-only RPCs, with RLS blocking direct browser access.
2. Redeploy **Render and Vercel together** so clients and server use the same new rooms, collision edges and stairs. Existing Supabase environment variables are reused. No new keys are needed.
3. Sign in, earn the listed gold, climb to the cliffs and click a door. Check the owner label, place an item, sign out and back in, and verify it remains displayed.

The migration has been tested locally with PGlite/PostgreSQL and a mocked Supabase REST service. It has not been applied to production from this workspace, which has no Supabase administration connection. Until applied, the town still loads; purchases are disabled with an explicit housing availability message.

## Verification

- `npm run build` and `npm test` cover floor paths, wall edges, distinct shapes, real texture keys, actual item ownership, gold, equipped/full-bag rejection, SQL transactions, revision races, stale leases and permission restrictions.
- `npm run test:housing:integration` exercises the real multiplayer server with signed-in and guest clients, gold deduction, public ownership, supply/Legendary displays, restart persistence, retrieval and all three manor floors.
- `npm run test:housing:browser` checks desktop/mobile cliff approaches, guest restrictions, single-door textures and floor rendering.
- `npm run test:housing:accounts:browser` signs in on mobile, buys through the dialog, places a real item, verifies the cutaway roof and takes the item back.

Per-character housing writes share the existing save queue. Mutation requests pause during the cloud commit, preventing conflicting bag actions or prediction spam. A failed/uncertain transaction closes the save session and disconnects the character; later autosaves cannot overwrite an already committed transaction. Reconnect reloads confirmed gold, inventory and ownership. Optimistic house revisions prevent two rooms from buying the same property. Room ownership caches refresh every five seconds; mutations refresh before planning and the database remains authoritative.
