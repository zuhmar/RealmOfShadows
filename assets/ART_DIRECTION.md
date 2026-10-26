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

Elderwood's ground is 1536×1024. Woods uses four independently detailed PNG
sections in `generated/woods-sections/`, assembled at 3072×2048. PNG masters
remain intact; the game loads quality-96 WebP encodings to keep downloads near
the old whole-map image's size (`npm run art:woods-sections` re-encodes masters).
Each section
covers 800×544 pixels of the preserved old 1536×1024 layout, at origins (0,0),
(736,0), (0,480), (736,480). The shared 64-pixel borders are blended at runtime;
preserve their geometry and cropped landmarks when repainting sections. UV
registration in `apps/client/src/woods-map.ts` aligns painted landmarks before
blending; review those coordinates whenever replacing a section. The
old `woods-ground.png` remains a layout reference and is not loaded in-game.
The game uses a density-aware backing canvas (up to 2×) with matching camera
zoom to retain the same field of view and touch coordinates. Do not use
nearest-neighbor filtering to disguise softness in the painted art.

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
