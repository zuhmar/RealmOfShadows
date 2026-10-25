# Generated PNG artwork

This is the live painted-art source for the game. The seven PNGs were generated
from guides made from the prior vector artwork; these are newly painted assets,
not rasterized copies of the old SVGs. The generated source sheets are copied
unchanged, including their alpha channels. Original user PNGs and vector sources
are preserved in their existing folders.

- `buildings.png`: seven Elderwood buildings.
- `village.png`: nineteen village props, plants, stalls, gates and portal.
- `forest.png`: twenty-two Whispering Woods props, plants, ruins and portal.
- `items.png`: fifteen equipment, weapon, material and potion icons.
- `character.png`: sixteen separate body/clothing parts for the existing rig.
- `elderwood-ground.png` and `woods-ground.png`: painted ground materials following
  the existing path, water, cliff, bridge, plaza and arena layouts.
- `previews/`: assembled full-map PNG exports using these same sprites, in depth
  order. They are review images; the game keeps ground and props separate.

The 79 sprite crops, original canvas sizes and original alpha placement offsets
are recorded in `apps/client/src/generated-frames.ts`. Crop regions follow the
actual painted alpha silhouettes, including shapes crossing nominal grid lines.
`generated-manifest.ts` assigns source sheets and texture scale;
`generated-art.ts` prepares the textures once when the scene starts. Character
parts retain their original pivots and canvas sizes, so changing gear and walking
still use the existing articulated rig. Inventory icons use cached PNG crops.
Individual user PNG/WebP icons in `assets/items/` still take priority by item ID.

The client loads no SVG artwork. Legacy SVG generators remain useful as layout
and silhouette guides; rerunning them does not repaint or overwrite the live PNGs.
Future paint updates should retain crop order or update the corresponding atlas
coordinates. Keep collision footprints and prop placements in the shared game-data
files; rendering changes must not silently change the authoritative map geometry.

The three painted monster cutouts remain in `assets/monsters/generated/`.
Those are single-pose images with motion feedback, not directional sprite sheets.
The uploaded animated wolf, citizen and Mara sheets remain unchanged.

Validation: `npm test`, `npm run build`, `npm run test:generated-art:browser`,
`npm run test:paper-doll:browser`, `npm run test:island:browser`, and
`npm run test:woods:browser` (browser checks require a running client/server).
