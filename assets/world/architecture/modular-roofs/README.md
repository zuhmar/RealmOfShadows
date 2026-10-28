# Modular Elderwood roofs

Run `npm run art:town-roofs` to rebuild the source SVGs and runtime PNGs. The
roof kit uses code-native geometry, the existing timber/stone material swatches,
and each building's established roof color. It requires Playwright/Chromium only
for regeneration; production uses the committed images.

Each slope tile has a 64×64 core, representing one map cell (32×32 in the map
editor). A 12px gutter on all sides carries outward-facing eaves only. Thus all
slope PNGs are 88×88 and render with identical scale, regardless of building size.
Interior cores touch exactly on grid boundaries. Neither a complete roof image
nor a cropped complete roof is stretched to fit a building.

The kit contains 75 slope/edge/corner tiles, 15 ridge tiles, and one independent
chimney. Back/front slope variants meet at the ridge. Odd-depth buildings use a
split-slope middle tile; even-depth buildings meet between two rows. All four
corners and four outer edges come from the building footprint. A row of separate
ridge caps spans the same footprint and ends at the side eaves.

`buildingVisuals()` places one core per building cell at the uppermost wall cap,
with a matching 0.1875-cell overhang. Roof pieces share their building's `roofFor`
identifier, so every slope, ridge and chimney hides/restores together. The Depot
and Hall keep their second-floor walls. The editor and preview exporter use the
same assembly. Old complete-roof artwork remains preserved but is not rendered.

Tests verify cell coverage, exact corners, native sizes, unchanged collision and
pixel-opaque assembled cores. Browser checks measure actual eave coverage and
verify group cutaways, entry/exit and existing door controls on desktop/mobile.
