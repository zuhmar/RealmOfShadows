# Elderwood town systems

This extends the modular building pass into a detailed, playable town building
system while retaining Realm of Shadows' artwork. All five ground-floor rooms
have windows and shared, clickable open/closed doors. Smithy and Bank use stone
floors; Workshop, Hall and Depot retain timber. Furnishings include the forge,
workbench, banking counter, meeting table, shelves, tool/armor displays, seating
and a street well.

## Upper floors

The Depot loft and Hall library occupy separate rooms in `elderwood-upper`.
Four paired stair connections take players up and back to the matching ground
room. These rooms cannot be selected from portals or reached by walking across
the void between buildings. The town terrain below is dimmed, and upper-room
camera bounds allow the room to remain centered on mobile. Upper rooms share
the village's safe-area healing. Storage boxes stay on the ground floor.

## Door authority

Door states live in each Colyseus room's public `doors` map, initialized open.
They are separate from private character saves and from the globally cached
static grid. `toggleVillageDoor` validates the building/floor, actor health,
2.5-tile range and occupied/reserved doorway cells. Server messages are limited
to one door action per player every 0.25 seconds. Closed doors contribute doorway
cells to authoritative movement, landing and client pathfinding reservations.
Different multiplayer rooms do not share door state. Reconnects receive current
room state; a newly created room starts open.

Clicking a door approaches from a reachable side and toggles it once. Manual
movement or another interaction cancels the pending action. Remote closures stop
only routes crossing the newly closed cells; unrelated routes keep moving.
Town combat remains disabled, and this does not introduce player combat or
private housing permissions.

## Artwork and authoring

`assets/world/town/master.png` preserves the new twelve-object source atlas.
`python3 scripts/extract-town-sprites.py` extracts measured sprite bounds with
alpha padding and copies the existing native stone floor tile. Windows are 64px,
furniture/doors/stairs 96px, and the shared structural wall kit remains 32px.
Characters and monsters retain their approved references. Ground and upper
building placement is authored in `grid-world.ts` / `village-buildings.ts`.

The Bank counter, beds and displays are furnishings; trading, crafting and
personal storage keep their established interactions. This change does not add
currency banking, furnishing ownership, house trading, or movable world items.
Those are separate game systems, rather than unfinished building tiles.

## Validation

Unit checks cover paired stairs, legal return routes, portal restrictions, door
range/death checks, occupancy and reserved steps, movement blocking, room
isolation, existing equipment/professions/quests and resource placement. Browser
checks cover real door clicks and stair travel on desktop/mobile in guest and
multiplayer, Depot transactions and all building entrances. A two-player network
check verifies shared door state and server rejection of forged movement.

Deploy Render and Vercel together; no SQL migration or new environment variables
are needed.
