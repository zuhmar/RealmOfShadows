# Player houses on Elderwood's cliffs

Twenty properties occupy a wide, connected cliff belt: **five north, five south, five west, five east**. Elderwood is now **104×96 cells**. The original **48×40 village** is inset at `(28,28)` without rearranging it; its terrain, wall edges, solid props, Depot, ponds, trader and crafting hall retain their original relative layout. Houses and yards lie completely outside that original rectangle. Promenades and short drives connect every door to the four existing cliff stairs. Trees and lamps dress the outer neighborhoods, visible from both ground and cliff walk.

Each side has five different irregular plans, with 1–3 floors. All doors remain one cell wide, and larger architecture still assembles from tile parts.

| Plan on each side | Floors | Price |
| --- | --- | --- |
| Cottage | 1 | 500 gold |
| House | 2 | 1,000 gold |
| Lodge | 2 | 1,500 gold |
| Manor | 3 | 2,500 gold |
| Terrace | 1 | 750 gold |

The original IDs `briar`, `pinewatch`, `stonebend`, `eastridge`, and `sunset` remain valid. Fifteen additional lots complete the four neighborhoods. Their original owners and displayed items are preserved by the expansion migration, which translates display coordinates exactly once.

Climb any of the four village cliff stairs, then click a house's single door. The player approaches its doorstep and opens a dialog. Unowned houses show a gold purchase button; owned houses show their public owner's name. Owners use their Supabase display name if configured, otherwise a public Adventurer identifier. Email addresses and account UUIDs are not sent in housing snapshots.

Only signed-in accounts can buy. Gold and ownership commit in one PostgreSQL transaction. Buying opens the door to visitors; ownership is global across rooms, server restarts and sessions. Anyone can visit an owned house to see its contents, but only the owner can move display items. This first version has no sale, rent, eviction, guest permissions or automatic furnishing grants.

Inside, click a display plinth along the room wall. The owner can choose an unequipped bag item to display, or take the displayed item back. A supply display consumes one unit. Equipment retains its unique instance, identified rarity and attributes. Equipped gear cannot be displayed; full bags prevent retrieval. Plinths are nonblocking. Taking an item that already exists as a unique catalogue weapon/equipment entry in the bag is refused rather than duplicating it. Displayed items are removed from the owner's bag and saved with the house. They remain visible to other players and survive restarts.

House ground floors live on `elderwood-upper`; additional floors use `elderwood-homes-upper` and `elderwood-homes-attic`. Each property's floor stays isolated by edge walls. Paired stairs connect its actual rooms; portal travel cannot enter these floors. Existing Depot/Hall lofts, town buildings, four cliff stairs, game features and supplied art are retained. Guests can inspect houses but cannot buy or move persistent items.

## Deploy

1. After the two existing character-save migrations, run [202610300001_player_housing.sql](../supabase/migrations/202610300001_player_housing.sql) if not already applied. Then run [202610300002_expand_cliff_neighborhoods.sql](../supabase/migrations/202610300002_expand_cliff_neighborhoods.sql) in Supabase's SQL Editor. The expansion adds fifteen lots and translates existing displays without clearing ownership or inventory. Both migrations are safe to rerun. RLS continues to block direct browser writes. Old-layout servers cannot commit house mutations after the expansion migration, preventing item coordinates from reverting during deployment.
2. Redeploy **Render and Vercel together** so clients and server use the same new rooms, collision edges and stairs. Existing Supabase environment variables are reused. No new keys are needed.
3. Sign in, earn the listed gold, climb to the cliffs and click a door. Check the owner label, place an item, sign out and back in, and verify it remains displayed.

The migration has been tested locally with PGlite/PostgreSQL and a mocked Supabase REST service. It has not been applied to production from this workspace, which has no Supabase administration connection. Until all twenty lots are present, the town still loads; purchases are disabled with an explicit housing availability message.

## Verification

- `npm run build` and `npm test` cover a regression hash of the original village terrain/collision, twenty non-overlapping properties, five per side, floor paths, wall edges, distinct shapes, real texture keys, actual item ownership, gold, equipped/full-bag rejection, SQL transactions, revision races, stale leases and permission restrictions.
- `npm run test:housing:integration` exercises the real multiplayer server with signed-in and guest clients, gold deduction, public ownership, supply/Legendary displays, restart persistence, retrieval and all three manor floors.
- `npm run test:housing:browser` checks desktop/mobile cliff approaches, guest restrictions, single-door textures and floor rendering.
- `npm run test:housing:accounts:browser` signs in on mobile, buys through the dialog, places a real item, verifies the cutaway roof and takes the item back.

Per-character housing writes share the existing save queue. Mutation requests pause during the cloud commit, preventing conflicting bag actions or prediction spam. A failed/uncertain transaction closes the save session and disconnects the character; later autosaves cannot overwrite an already committed transaction. Reconnect reloads confirmed gold, inventory and ownership. Optimistic house revisions prevent two rooms from buying the same property. Room ownership caches refresh every five seconds; mutations refresh before planning and the database remains authoritative.

## Neighborhood gardens and connected fences

The cliff promenades now have bent housing drives, four small shared courtyards, individual flower gardens, scattered groves and rocky/mossy cliff-side pockets. Decorative flora does not create gathering resources. Houses, ownership, display coordinates and the original village's terrain/collision stay unchanged.

All new garden fences, plus the original village garden's visible fences, assemble from native 32×32 neighbor-mask tiles. North/east/south/west use bits 1/2/4/8; the renderer chooses ends, straight rails, corners and junctions from the actual occupied cells. Rails meet exactly at tile edges. Single-cell gate openings omit the fence cell and its collision, so the nearby segments finish in real end posts. Existing long fence footprints are converted only for rendering, preserving the original garden's collision.

`npm run art:fences` regenerates SVG masters and transparent PNG parts. `npm run test:fences:browser` checks every possible reciprocal tile join pixel-for-pixel and renders an editor close-up. Shared tests verify actual mask neighbors, solid fences, open gates, usable courtyard interiors and routes to every house. The original village regression hash remains unchanged. `npm run test:neighborhood:integration` against the current game server exercises real gate entry/exit, an attempted move through a fence and the route back to a house.

These decorations add shared collision on the cliff walk: deploy Render and Vercel together. No additional database migration is needed for the garden/fence polish.

## Neighborhood streets and public spaces

Housing drives now use one-cell lanes; the promenade uses two cells while the four main village approaches remain broad. North and south streets extend to the outer cottages. Side drives route below the complete house footprint, including L-shaped wings. All twenty paved doorsteps connect without requiring grass shortcuts.

The upper belt includes North Well Court, West Flower Walk, South Picnic Green and East Orchard, with seats, planting and connections to the street network. Loose oak groves and small garden props use existing sprites, with single-cell solid footprints and clear formal paths. House IDs, prices, geometry, owners, displays and the original village are preserved. These decorative trees and flowers are not gathering resources.

Run `npm run test:neighborhood-life:browser` for desktop/mobile walking and screenshots of the four places. The unit suite checks paved access to every house and public space. Deploy Render and Vercel together for the new prop collisions; no SQL migration is needed.
