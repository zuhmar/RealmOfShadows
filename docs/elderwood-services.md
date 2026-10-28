# Smithy and Workshop services

Bram the Smith stands beside the Smithy forge. Elara the Artisan works inside
the Workshop. Both reuse approved reference-based human outfits and the existing
neutral idle pose. NPCs and their hit areas hide beneath exterior roofs, then
become available after entering the room. Click an NPC to approach their work
area and open their service panel.

Bram supports Blacksmithing: existing ore-smelting, shared armor and melee-weapon
recipes. His equipment button opens the existing free identification panel; it
does not automatically identify items or create a new fee. Elara supports
Woodworking, Cooking and Alchemy, including existing timber, bow/staff, fish and
potion recipes. Each service button opens its matching collapsible profession.
The inventory close control remains visible while scrolling recipes.

The rooms reuse the existing furniture kit: the Smithy adds material storage
and a wall tool board, while the Workshop adds shelving and a plant display.
NPC cells and furniture are blocked in the authoritative shared grid, with the
central aisles and door approaches left open. No new character artwork, crafting
prices, skill EXP rates, recipe outputs, or saved fields are introduced. The
public outdoor workbench continues to support all four crafting professions.

`town-services.ts` in game-data defines station skills, work-area coordinates,
NPC positions, and indoor boundaries. Client pathfinding and recipe availability
use those definitions. The server independently validates region, room, range,
line of sight, skill level, materials and bag capacity for every craft request.
Rejected attempts preserve materials and EXP. NPC reserve cells are shared by
client/server movement.

Validation includes unit crafting/room/route checks, network rejection of forged
remote and wrong-station requests, NPC collision, and real desktop/mobile entry,
NPC clicks, service panels and exit in guest/multiplayer. Guest browser fixtures
exercise smelting, free identification, woodworking, cooking and alchemy through
the UI. Existing profession and building checks remain applicable.

Deploy both the Render server and Vercel client for the new locations and
collision. No database migration or environment-variable changes are required.
