# Item sprites

The transparent SVGs are the initial glossy cartoon inventory icons. To replace
one, upload a transparent PNG using its exact ID, such as `sword.png`,
`clothTunic.png`, `woodenShield.png`, `potion.png`, or `pelt.png`. Subfolders are
allowed. PNG takes priority over WebP and SVG. Keep one file per item ID and
format. Vite includes new images on the next client build; originals are not edited.

Use square images with a little transparent padding (128 × 128 or larger is
recommended). Item definitions, equipment slots and armor values live in
`packages/game-data/src/equipment.ts`; weapons live in `classes.ts`.
Uploading an image replaces artwork; adding a new playable item also requires
an item definition and an acquisition method.
