# Generated PNG artwork

This is the live painted-art source for the game. The coordinated PNGs were generated
from guides made from the prior vector artwork; these are newly painted assets,
not rasterized copies of the old SVGs. The generated source sheets are copied
unchanged, including their alpha channels. Original user PNGs and vector sources
are preserved in their existing folders.

- `buildings.png`: seven Elderwood buildings.
- `village.png`: nineteen village props, plants, stalls, gates and portal.
- `forest.png`: twenty-two Whispering Woods props, plants, ruins and portal.
- `items.png`: fifteen equipment, weapon, material and potion icons.
- `character.png`: twenty-three coordinated body/clothing pieces, including capes and real
  side-view torsos, tunics and boots; a shoulder crop supports correct side layering.
- `hooded.png`: three fitted equipped-head views that preserve visible eyes/face.
- `hero-style-guide.png`: the canonical four-view model used to guide every repaint.
- `elderwood-ground.png` and `woods-ground.png`: painted ground materials following
  the existing path, water, cliff, bridge, plaza and arena layouts.
- `previews/`: assembled full-map PNG exports using these same sprites, in depth
  order. They are review images; the game keeps ground and props separate.

The 90 sprite crops, original canvas sizes and original alpha placement offsets
are recorded in `apps/client/src/generated-frames.ts`. Crop regions follow the
actual painted alpha silhouettes, including shapes crossing nominal grid lines.
`generated-manifest.ts` assigns source sheets and texture scale;
`generated-art.ts` prepares the textures once when the scene starts. Character
parts retain compatible logical canvases, with overlapping neck, shoulder and hip
attachments. A fitted cape changes depth with facing; true profile clothing and
boots replace squeezed front views. Equipped hoods swap to complete fitted heads
instead of masking faces with an empty hood. Gear and walking remain articulated. Inventory icons use cached PNG crops.
Individual user PNG/WebP icons in `assets/items/` still take priority by item ID.

The client loads no SVG artwork. Legacy SVG generators remain useful as layout
and silhouette guides; rerunning them does not repaint or overwrite the live PNGs.
Future paint updates should retain crop order or update the corresponding atlas
coordinates. Keep collision footprints and prop placements in the shared game-data
files; rendering changes must not silently change the authoritative map geometry.

Common environment sprites are mapped by `sharedEnvironmentSprites` in the
manifest. The forest keeps its own logical sizes and offsets while sampling the
village atlas for common trees, rocks and fixtures. Its unique props and ground
are repainted to match those materials; changing a forest crop does not change
these shared sources.

The three painted monster cutouts remain in `assets/monsters/generated/`.
Those are single-pose images with motion feedback, not directional sprite sheets.
The uploaded animated wolf, citizen and Mara sheets remain unchanged.

Validation: `npm test`, `npm run build`, `npm run test:generated-art:browser`,
`npm run test:paper-doll:browser`, `npm run test:island:browser`, and
`npm run test:woods:browser` (browser checks require a running client/server).

The shared visual rules and canonical reference are documented in
`assets/ART_DIRECTION.md`. Review `previews/character-turnaround.png` alongside the
complete maps when extending the art set.
