# Elderwood elevated square-grid view

Elderwood now uses a fixed elevated view: broad visible top surfaces, shorter
front/side faces, square floor axes and four directional views drawn from the
same camera. This replaces the more frontal furniture and house treatment;
characters retain their approved artwork.

`townView` in `building-visuals.ts` is shared by the game, editor and full-map
export. Wall height is projected to 1.25 world cells. All wall faces use equal X/Y scale. Horizontal panels, halves, side rails and
four handed corners share a 0.1875-cell cap thickness. Side runs stop at corner
caps rather than overlapping them. Code-native SVG geometry reuses sampled
wood, plaster and stone textures from the preserved approved wall atlas.
`node scripts/build-town-walls.cjs` rebuilds these exact fitting pieces. Windows, signs, doors and
roof eaves use the same wall projection. The Depot and Hall have two visible
stories outside, with continuous upper walls and windows underneath their raised
roofs. Entering the ground floor hides both the roof and upper shell; upstairs
retains its own walls. The editor roof toggle also hides the upper shell. Structural collision remains on the
original grid boundaries.

Furniture canvases render at equal X and Y scale, centered on the original
footprint and anchored to its original base. A narrow collision rectangle no
longer stretches the image into a tall side elevation. Four views retain their
common native size and baseline. Roof cutaways, front-wall fading, doors, Depot
storage and both upper-floor connections retain their existing behavior.

## Artwork

The new source atlases are preserved in:

- `assets/world/furniture/elevated-masters/`: forge, benches/counters/tables,
  shelving, beds, racks, chests, chairs, barrels, well, planter and ascending stairs.
- `assets/world/architecture/elevated-masters/`: roofs and wall tops/faces.

Descending stairs retain the already elevated four-view source. Older masters
remain available as source history. `python3 scripts/extract-house-art.py`
reproduces the runtime frames; the extraction tool needs Pillow, NumPy and SciPy.
Node production builds use committed PNGs and do not run this script.

Elevated silhouettes can protrude into the next row of an atlas. Extraction
assigns connected alpha components to their parent sprite and preserves their
edge fringes, rather than relying on rectangular cells that can pick up a
neighbor's corners. Source pixels and original masters are retained. All
furniture canvases remain 96×96; wall panels span multiples of the 32px grid.

Validation covers unchanged collision, open door gaps, uniform sprite scale and
floor anchors, frame dimensions, preview/editor loading, roof hide/restore,
real entry/exit and Depot/upper-floor interactions on desktop/mobile in guest
and multiplayer, plus authoritative multiplayer door checks.

## Integrated openings and fitted eaves

Window variants now contain their own frames, sills and glass; legacy window
markers are filtered from the rendered shell. Door leaves and frames are built
at the exact native width of each two-/three-cell opening, sharing the wall cap
and jamb materials. Runtime switching retains the same bounds and lower hit area.
The game, editor and preview exporter all select the matching door-width variant.

Roofs use a shared 90%-height eave anchor rather than their transparent canvas
bottom. Their solid lower edge overlaps the uppermost wall cap across the whole
facade, while the projected gable can extend below the eave. Roof cutaways and
the Depot/Hall upper-floor shell cutaways retain their existing behavior.
