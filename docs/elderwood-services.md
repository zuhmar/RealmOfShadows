# Crafting Hall

The expanded former Workshop is now the Crafting Hall in southwestern Elderwood,
north of the pond. Its tiled roof, window walls, three-cell entrance and stone
approach use the same building system as the rest of the village. The other
buildings, portal and pond remain in place.

Four dedicated crafters stand behind their own customer-facing counters:

| NPC / corner | Profession | Custom bench |
| --- | --- | --- |
| Bram the Smith · northwest | Blacksmithing | Anvil, copper ingots and hammer |
| Elara the Woodworker · northeast | Woodworking | Timber, hand plane and saw |
| Tobin the Cook · southwest | Cooking | Soup pot, spoon, bread and carrots |
| Iris the Alchemist · southeast | Alchemy | Retort, bottles, herbs and mortar |

Each NPC uses an approved reference-based human outfit and occupies the actual
corner grid cell against the hall walls. Three counter cells fill the other cells
of a 2×2 square: the two adjacent cells and the inward diagonal. This L shape
closes the NPC into the corner without a walkable gap. North NPCs face south;
south NPCs face north. The central aisle and doorway stay open.

Counter tops join using their north/east/south/west neighbor masks; shared edges
have no end caps or exposed front faces. Separate generated tool clusters sit on
the inward elbow. All counter sections and tool clusters open their NPC service,
and become noninteractive outside the room.
Click a crafter or their bench to approach a reachable service point and open
their trade. Bram also links to existing free equipment identification.

Each service button opens its matching collapsible profession and jumps to its
recipes. The inventory close control remains visible while scrolling. The public
outdoor workbench still supports the existing four crafting professions. Recipes,
prices, level requirements, EXP, material costs, output and saved fields retain
their existing behavior.

`town-services.ts` in game-data defines work points, NPCs, bench footprints, skills
and room boundaries. Client routing and recipe availability use these definitions.
The server independently checks region, room, range, line of sight, skill level,
materials and capacity on each craft request. Rejected attempts preserve materials
and EXP. NPCs and benches use the same collision on client and server.

Artwork sources and extraction are documented in `assets/world/crafting-hall/`.
`npm run art:map-furniture` rebuilds connected counters and tool sprites.
`npm run art:crafting-hall` preserves the legacy packed benches and hall sign. These
are committed artifacts; production builds do not run the Python/art tools.

Validation covers four individual crafting skills and benches, reachability,
solid counters, server rejection of remote/wrong-trade requests and forged outputs,
and real desktop/mobile NPC and bench clicks in guest/multiplayer. Guest browser
fixtures craft at all four counters and identify equipment; multiplayer checks
verify station eligibility and authoritative collision. Roof cutaways, doors,
map preview and editor use the expanded footprint.

Deploy both Render and Vercel together for the new NPC positions and collision.
No database migration or environment-variable changes are needed. Existing server
login placement uses `freeLanding` if an old saved position is now obstructed.
