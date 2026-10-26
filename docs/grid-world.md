# Island terrain, individual props and grid combat

The live maps are authored in cells in `packages/game-data/src/grid-world.ts`.
They do not consume the reference-map images or the old traced polygons.
Elderwood, Whispering Woods, Crystal Caverns, Murkmire's current starter map,
Root Hollow and Crystal Depth 2 use this system. Future islands have artwork
prepared but are not newly playable destinations in this change.

## Artwork

`assets/world/terrain/` has distinct sets for Elderwood, Woods, Caverns, Swamp,
Tundra, Celestial, Ember Peaks and Shadow Fortress. Every set has six separate
**32×32** PNGs: ground, path, stone, water, bridge and wall. These are 48 distinct
material drawings, not one set recolored per island. The generated master is
preserved as `master.png`. `npm run art:island-terrain` performs normal grid
extraction/resampling and creates padded atlas files for rendering. Each source
cell is 181×181 in the 1086×1448 master; native runtime tiles are exactly 32×32.

The renderer enlarges each tile to 64 screen units, so one tile is one gameplay
cell while the existing character scale remains readable. Camera zoom can
change how large that appears on a device. Lower floors use their parent
island's material set. The map has no underlying full-map background image.

`assets/world/objects/` contains 88 independent transparent PNGs. Trees,
buildings, portal entrances and decorations may be several cells tall or wide.
Vite discovers these files directly by filename. They are no longer split into
32px terrain/object tile pages at runtime. Existing painted prop art is retained;
this change generates new terrain, not replacement art for every prop.
The one-time extraction can be reproduced with
`python3 scripts/extract-world-objects.py` from the archived object pages.
It overwrites exported sprites; do not run it over edited replacements.

Depot walls use directional edge sprites and shared boundary barriers, leaving
wall-adjacent floor cells free. Other buildings and tree trunks have explicit cell footprints; visual canopies can
overhang a path. Water and wall cells are solid. Bridge cells remain walkable.
Village, forest habitats and the enclosed bear grove have newly authored paths.
Floor entrances moved to the new paths: Woods (34.5,12.5), Caverns (32.5,22.5).
Both lower floors return via stairs at (24.5,30.5). Portal and stair arrivals are
cell centers and select a nearby free cell when another actor occupies them.

## Movement and combat

Shared movement starts steps only at cell centers. An actor may choose any of
the eight neighbors; a committed step finishes before turning or stopping.
World coordinates interpolate during that step, so movement stays smooth.
Diagonals cover the longer distance rather than gaining extra movement speed.
Sprint still consumes stamina. The server enforces the same rules as prediction.

Living creatures reserve their current and destination cells. Players and
monsters cannot step into an occupied destination. Terrain blocks diagonal
corner cutting; creatures in the two side cells do not prevent an otherwise
free diagonal escape. Thus four cardinal creatures alone do not make a full
box. Eight surrounding cells can be occupied by eight distinct monsters.
Dead creatures release their cells. Melee can reach a diagonal neighbor, and
ranged attacks keep range and line-of-sight checks. Monsters use separate legal
approach cells and retain passive/retaliation, aggression, leash and respawn rules.
Charges follow collision-tested grid cells without ending on another creature.

The wire state now includes `stepX` and `stepY` for both players and monsters.
Deploy **both Vercel and Render from the same commit**. No Supabase schema or
saved-character migration is required; saved equipment, skills and attributes
are unaffected.

## Editing

Open `/map-editor.html` during `npm run dev -w @realm/client`, select a map and
paint its terrain. Undo, import and export work with version-2 grid JSON.
Save the export to `packages/game-data/src/grid-overrides.json` and rebuild.
Both server collision and client rendering consume that same file. Props and
encounter positions are authored in `grid-world.ts`; the editor currently paints
terrain. The archived version-1 reference/marker editor is replaced by this grid
editor. Layout tests reject blocked entrances and disconnected encounter cells.

Checks: `npm test`, `npm run build`, `npm run test:grid:browser`, and
`npm run test:grid:integration`. Browser URL defaults to localhost:5218;
server URL defaults to ws://localhost:2610. Use TEST_CLIENT_URL / TEST_SERVER_URL
to select your running development services.
