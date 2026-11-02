# Elderwood terrain finish

Adds subtle grass colour fields, scattered blades, path wear and loose shoulders, shallow water edges and light cliff contact shading. These details are painted into the existing native 32px terrain canvas when it is created. There are no new scene objects or per-frame effects.

Coordinate noise keeps details stable across visits and redraws. Upper-floor views dim details on the ground below. Floors, bridges, cliff faces and complete stair flights are protected. Map geometry, authoritative collision, entrances and gameplay are unchanged.

Validation:
- 271 root tests passed; full workspace build passed.
- Browser pixel checks preserved 162 protected samples exactly, confirmed deterministic redraws and no shoulder overflow, and verified unchanged collision.
- Stair landing visual checks passed for all four directions.

Only the client deployment needs this change; no database migration is required.
