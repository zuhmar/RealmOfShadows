# Outdoor stacked floors: Lookout Ledge

Whispering Woods now has a raised lookout northeast of the Root Hollow stairs.
The platform occupies x37–42, y3–6 at the same coordinates as the forest below.
Its two-cell rock face blocks ground movement through x37–42, y3–8. The northern
trail bends around the front to the open stone staircase at (40.5, 9.5).

Click the steps to climb. The upper landing is (40.5, 6.5), with a return stair
near (40.5, 5.5) that returns to (40.5, 10.5) below. Server-side range and floor
validation apply to both directions. Client travel waits for authoritative
position to reach stair range, avoiding premature requests during prediction.
Existing occupied-cell landing checks prevent two players landing on one cell.

`woods-upper` is a logical floor of the Woods, not a portal destination. It
shares the 96×72 coordinate system and Woods tileset. Only the ledge's cells are
walkable upstairs; blocked outer cells prevent walking or falling off the edge.
There are three additional Forest Wolves upstairs; the 28 original surface
encounters remain. Wolves do not follow players between floors. Loot and quest
progress resolve to Whispering Woods through `islandForRegion`.

The game draws the ground backdrop, continuous north/east/south/west cliff faces,
rock strata, irregular moss-edged turf cap and recessed stone stairs together.
The silhouette and shading wrap around the corners instead of using a rectangular
brick facade. This visual perimeter stays within the existing blocked footprint;
walkable cells, stair landings and server collision remain unchanged.
Both floors' nearby creatures and networked player avatars are visible, with
upper actors sorting above the cliff. Clicking a creature on another floor
explains that stairs are needed. Targeting, weapon attacks, learned spells,
monster AI, occupancy and loot pickup still use the actor's actual floor.
Visibility never grants cross-floor combat. The lookout has no portal sanctuary.

`elevation.ts` owns the initial outdoor floor's footprint and visibility/depth
rules. `floors.ts` defines stair pairs; `grid-world.ts` defines collision and
spawns. The shared `paintLedge` canvas painter is used by the game, map editor
and exported previews. The platform plus face is a square 192×192 native canvas,
rendered at two screen units per pixel. Existing character and wolf art is reused.

This is the first visible outdoor upper floor. Root Hollow, Crystal Depth 2 and
the village upper rooms retain their existing layout and transition behavior.
Further outdoor floors can extend the same visibility and stair definitions.

Checks cover same-coordinate floor separation, stairs, fall prevention, upper
monster navigation, learned-spell/weapon rejection across floors, combat after
climbing, and server rejection of remote stair requests. Desktop/mobile browser
checks exercise guest and multiplayer climbing, combat and descent, including
an actual second player visible upstairs from below.

Deploy Render and Vercel together. No database migration or new environment
variables are needed; progress uses the existing save format.

## Woods cliff scenery

`woods-cliffs.ts` defines five solid scenic outcrops at (28,2), (2,25),
(20,28), (44,15), and (39,39). Their square footprints use blocked terrain in
both client and server. They reuse the lookout's continuous stone/moss painter
without stairs or upper-floor actors. The existing one-cell map boundary uses
joined rock strata and inward-facing moss instead of root-wall terrain. The
boundary collision and map dimensions are unchanged. Preview/editor terrain and
the upper-floor ground backdrop include the same scenery; game outcrops also
have depth-sorted overlays so forest actors pass behind them correctly.

The route regression covers all surface monster spawns, resource nodes and
stairs after placing cliffs. `npm run test:woods-cliffs:browser` checks desktop
and mobile rendering at northern, western and southern outcrops. Deploy both
Render and Vercel for the new solid outcrop footprints.

## Expanded forest highlands

Whispering Woods and its upper floor now use a 96×72 grid (previously 68×48),
with the original portal, boss grove and encounter IDs retained. Eastern and
southern trail loops connect the added hunting areas to the existing network.
There are 46 surface monsters, nine upper-floor monsters, sixteen scenic
outcrops and three new connected plateaus in addition to Lookout Ledge:

- Wolf Ridge joins two overlapping sections in the northeast, with three wolves.
- Silkstone Heights joins two sections in the south, with three thorn spiders.
- Mosswatch Overlook is a connected quiet plateau without monster spawns.

Each plateau has paired validated stairs. `ridgeCells` forms the union of its
parts for both collision and rendering: shared edges have no separating wall.
The ground blocks the full top and two-cell front escarpment; upper walking is
restricted to the connected turf cap. Cliffs keep the established stone/moss
palette, with continuous fractured faces. Approved forest props dress the tops
and remain visible from below. Forest trees and resources extend across the new
reachable land. Existing encounters, fishing pools and boss entrance stay open.

Highlands tests check all connected upper cells, monster and stair approaches,
fall prevention, quiet versus populated ridges, and larger bounds. Browser
checks climb, cross joins and descend on desktop/mobile. The multiplayer check
walks from the original portal to Wolf Ridge, crosses its join, fights a wolf
upstairs and descends using authoritative server movement.

Deploy Render and Vercel together for the larger bounds, spawns and collision.
No migration or environment changes are needed.
