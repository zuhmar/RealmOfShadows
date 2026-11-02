# Crystal Caverns layout and crystal cliffs

The main floor keeps 28 enemies and stable IDs: nine bats, nine crawlers, nine
golems and one Crystal Wyrm. Bat encounters begin on the safe-entry route and
continue toward the roost. Crawlers occupy irregular lower-chamber pockets and
an upper connector. Golems occupy the gallery and four outer approach positions;
the latter stay beyond the Wyrm's detection range. Existing monster stats,
respawn timers, quest goals and loot remain unchanged.

The Wyrm chamber has one three-cell southern entrance. A mining recess beside
the central route and a quiet western landing recess add exploration space.
Two solid rock outcrops interrupt the broad rooms while preserving routes to all
spawns, the bridge, portals and stairs. Depth 2 retains its existing encounters.

Both floors use broad rounded rock forms with a muted violet palette, continuous
joins, directional shading and small embedded violet/cyan crystals. Side faces are
12 native pixels wide against a 24-pixel front face, preserving perspective while
avoiding thin strips. Cliff tops use a darker tint over the existing stone texture;
the shared rim has softer contrast. Rock fields wrap seamlessly across native tiles.
A visible purple rock floor caps the cliff mass, with one vertical face along
its edge instead of stacked faces. The top floor and visible faces share one footprint. Closed, connected contours
outline that footprint with a uniform inset rim, including hidden-face edges,
outer corners, inward turns and holes; separate corner patches are not used. Narrow barriers keep their artwork inside the
available rock. Every part is a native 32×32 cell. Faces, bevels and
crystals are clipped to solid cells, preserving walkable floor, water and paths.
The same renderer serves gameplay and map-editor previews. Elderwood and Woods
keep the existing natural cliff palette.

No SQL migration is needed. Deploy client and server together because map
collision and authored spawn positions changed. Existing characters and quest
progress load normally.

Validation:
- `npm test`: reachability, encounter pockets, sanctuary
  clearance, entrance topology and wall-edge masks on both floors.
- `npm run build`.
- `TEST_CLIENT_URL=http://localhost:5366 node tests/browser-caverns-layout.cjs`:
  desktop/mobile rendering on both floors, pixel comparison for floor/water
  preservation (one-channel-level canvas readback tolerance), stable populations
  and credited approach kills.
