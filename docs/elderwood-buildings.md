# Elderwood modular buildings

All five active Elderwood buildings now use native 32px floor tiles and a shared
edge-aligned wall kit. The Smithy, Workshop, Bank and Hall replace their former
whole-building sprites with same-map interiors. Full-height walls and cutaway roofs are now described in
[the house artwork notes](elderwood-house-art.md). The Depot keeps its
existing footprint, three storage boxes, sign and behavior.

`packages/game-data/src/village-buildings.ts` defines each rectangle and its
south-facing doorway. `grid-world.ts` assembles floors, four distinct L corners,
four edge strips and authoritative boundary collision from those definitions.
Doors use two cells (three for the Depot), while wall-adjacent floor cells remain
usable. The client fades each room's front wall while the player is inside.
Furniture has grid footprints; doorway approaches stay clear of resource nodes.

Walls reuse the approved Depot timber/plaster artwork. `npm run art:depot` also
refreshes the eight village wall textures. The original generated signs and
furniture master is preserved at `assets/world/buildings/master.png`; run
`python3 scripts/extract-village-furniture.py` to reproduce the padded runtime
sprites using measured gutters. Original building sprites remain archived in the
asset folder, but are not placed on the active map.

The new furnishings identify each room: forge/anvil, woodworking bench, banking
counter and meeting table. Existing crafting and trading interactions keep their
positions; item storage remains the existing personal Depot system. This change
does not add a separate banking or crafting economy.

Game rendering, map editor and full-map export draw floors below furniture and
walls. Tests cover portal-to-interior routes, perimeter collision, open doors,
solid furniture, and desktop/mobile guest/multiplayer entry and exit. Depot
storage and resource coverage retain their existing checks. Build and deploy
both client and server for matching building collision.

## Windows and looking inside

Each building side has two to four windows across the complete visible shell, spaced between plain wall panels. Multi-story buildings share that window budget instead of repeating a full row on every floor. East/west windows are built into the same narrow timber wall profile.

Walking within 1.25 cells of an exterior window on the same floor temporarily cuts away its building roof and fades its walls so the interior can be seen. Moving away restores the exterior. Window proximity does not unlock houses, open doors, remove collision or permit attacks through walls. The existing interior roof cutaway remains active after entering normally.

`npm run test:window-peeking:browser` checks real walking, reveal/restoration, solid window walls and loaded assets on desktop and mobile. Window counts and four-direction proximity are covered by the unit suite. This client visual update requires Vercel only, with no SQL migration.
