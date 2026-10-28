# Elderwood houses and directional furniture

The current camera and source atlases are documented in
[the elevated-view notes](elderwood-elevated-view.md).

All five ground buildings, plus the Depot loft and Hall library, now render as
full-height houses. The original floor plans, perimeter collision edges and door
rules remain authoritative. `buildingVisuals()` projects full wall faces, four
corner joins, front windows, signs and a separate roof over those footprints.
The old low wall sprites remain as structural authoring markers but are replaced
by full-height artwork in the game, map editor and map export.

Each building has its own roof color. Only the roof and sign of the building
containing the local player hide; they return immediately on exit. Front/near
wall faces cut away to reveal the room while the other walls remain standing.
Neighboring buildings keep their roofs. Upper rooms follow the same rule.
Doors retain authoritative shared state. Door pointer areas cover the lower
physical doorway rather than intercepting clicks through the taller arch.

## Furniture

Seventeen prop families have four purpose-drawn views: down/front, left, right
and up/back. These are drawings of the appropriate sides, not flat image
rotations. Native 96px canvases share a consistent scale and bottom pivot within
each family. Placement uses front views for counters/workbenches/storage and
appropriate side/rear views for racks, shelving, chairs, barrels and tables.
The set covers forge, workbench, bank counter, meeting table, bookcase, bed,
dining table, armor rack, storage chest, chair, barrel, well, bench, planter,
tool board, ascending stairs and descending stairs.

Choose a `furn-<family>-<direction>` key when authoring a placed object. This
provides directional artwork; it does not give players ownership or permission
to rotate town furnishings. Inventory/equipment icons and characters are unchanged.

## Sources and authoring

- `assets/world/architecture/masters/`: original roof and full wall atlases.
- `assets/world/furniture/masters/`: original directional prop atlases.
- `scripts/extract-house-art.py`: alpha-gutter extraction, measured exceptional
  row bounds, common directional scale and runtime packing.
- `assets/world/architecture/layout.json`: recorded source rectangles.

Run `python3 scripts/extract-house-art.py` to reproduce 68 directional frames,
five roof sprites and ten elevated wall pieces. Structural wall canvases
are 32×64 or 64×64; roofs are 320×256. Original masters are preserved, and no character or
monster references are changed. The editor's Roofs checkbox exposes interiors
without changing the exported collision grid.

Validation includes native frame sizes, asset coverage and unchanged shell
collision, plus real roof hide/restore during entry/exit on desktop/mobile in
guest/multiplayer. Depot transfers, shared doors and upper-floor stairs retain
regression checks. Deploy both services for the updated prop footprints; no SQL
or environment-variable changes are required.
