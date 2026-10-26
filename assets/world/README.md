# World art

Terrain: eight distinct sets of six 32×32 materials, with a padded rendering
atlas per island. The generated master is preserved in terrain/master.png.
Run `npm run art:island-terrain` to repeat extraction. Each 32px tile is one
gameplay grid cell; the renderer enlarges it to 64 screen units.

Objects: 88 independent transparent sprites. Buildings, trees and stairs can be
larger than one terrain cell. Replace an object's PNG under the same filename
to retain its texture key. Footprints and display sizes live in
packages/game-data/src/grid-world.ts. No reference map image drives the layout.

See docs/grid-world.md for authoring, movement, collision and deployment.
