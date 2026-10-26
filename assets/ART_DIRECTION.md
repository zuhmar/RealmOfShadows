# Realm of Shadows art direction

The canonical character identity is the user's original black-haired, blue-caped
hero (`assets/characters/Citizen_idle_animations.png`). The original Whispering
Woods reference establishes the world style. The coordinated four-view model in
`assets/generated/hero-style-guide.png` is the shared reference for new assets.

Use crisp warm dark outer outlines, medium internal lines, rounded readable
forms, broad cel-painted shading and restrained upper-left highlights. Group
foliage and fur into readable masses rather than noisy photographic strands.
Cobalt cloth, emerald foliage, warm umber wood/leather and cool slate/silver are
the core materials; brass and amber are small accents. Purple is for magic.
Avoid neon lime grass, polished plastic, oversized gold ornament and unrelated
portrait/icon rendering styles. Keep consistent head/body proportions, camera,
lighting and material treatment across characters, equipment, props and monsters.

All live maps now use native 32×32 terrain tiles from `tilesets/shared-32/`.
Grass, dirt, paving, water, decking and cliff stone each have four variants.
Repeat borders match across variants; extruded atlas gutters prevent texture
bleeding during zoom. The shared terrain plan builds paths, clearings, shores,
bridges and walls from the existing layout/collision geometry. Boundary cells
are cached as 32px edge tiles once per region, then rendered as ordinary culled
Phaser TilemapLayers. Full-map images are previews/reference artwork only.
Buildings, trees and other large map props are packed into 32px tile pieces,
then composed once per prefab to preserve depth sorting and original pivots.
Use `npm run art:map-tiles` to rebuild atlases from their preserved PNG masters;
run `npm run art:map-previews` against a running Vite client to refresh previews.
See `assets/tilesets/shared-32/README.md` for atlas dimensions and layout rules.
The game uses a density-aware backing canvas (up to 2×) with matching camera
zoom to retain the same field of view and touch coordinates. Do not use
nearest-neighbor filtering to disguise softness in the painted art. This is a
cartoon tileset conversion; character/monster art and animation remain intact.

All repaint batches should reference this same model, retain existing asset
identities and silhouettes, and preserve alpha. Grounds retain exact geography;
props retain their registered footprint and baseline. The original uploaded
PNGs remain intact. The classic sprite appearance remains an optional comparison.

Elderwood is the environment material reference: broad emerald leaf clusters,
warm ochre paths, cool slate facets and restrained wood grain. Whispering Woods
uses the same construction with deeper greens and denser placement, rather than
finer texture or different lighting. Shared oaks, pines, boulders, banners, lamps
and gate pillars sample the same village atlas in both regions; destination
canvases and placements remain region-specific. Forest-only props use the same
outline weight and broad shading. Keep clearing interiors readable and quiet.

The live adventurer rig has overlapping neck/shoulder/hip attachments, a proper
cape, direction-specific torsos/tunics/boots and fitted equipped hooded heads.
Painted equipment uses the same materials as those body parts. Preview actual
assembled front, side and rear views both equipped and unequipped, in-world and
in portraits, before accepting character changes. Review complete maps with
those characters present before accepting a new art batch.

Crystal Caverns uses the same slate/wood construction with cyan and amethyst
mineral accents, compact facets and clean outlines. Its live 32px material
colors are cached into terrain textures for Canvas/WebGL parity. Cave props
are in `generated/caverns-props.png`; monster PNG masters retain four rows of
down/left/right/up poses, with 2 idle, 4 walk, 1 attack and 1 defeated pose each.
Alpha-inspected crops and fixed baselines define their animation frames. Bats
and crawlers use 128px runtime canvases, golems 192px and the Wyrm 256px, with
matching display scales; source sheets are released after pose extraction.
WebP derivatives reduce download size while the PNG masters remain available.
