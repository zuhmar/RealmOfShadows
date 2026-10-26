# Map floors

Current layouts, coordinates and editing instructions are documented in
[Grid world](grid-world.md). Floors use the same grid navigation and distinct
parent-island terrain sets as the surface. Both lower floors preserve separate
combat, monsters and loot. Travel requires clicking stairs; portal menus list
islands only. No database migration is needed.

- Whispering Woods: stairs at (34.5, 12.5) lead to Root Hollow, with 19 monsters.
- Crystal Caverns: stairs at (32.5, 22.5) lead to Depth 2, with 17 monsters.
- Both lower-floor return stairs are at (24.5, 30.5).
- Lower landings start at (24.5, 32.5); occupied arrivals use a nearby free cell.

Build and deploy both Vercel and Render from the same commit.
