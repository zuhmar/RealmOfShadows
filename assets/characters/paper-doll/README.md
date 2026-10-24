# SVG paper-doll prototype

These transparent SVG parts form the trial player character. The original PNG
sheets and Mara are preserved. Choose **Character appearance → Original
character** in the profile to compare; that preference stays in this browser.

`apps/client/src/paper-doll.ts` defines the rig and attachment points. Separate
front/back/side heads and hoods supply four facing directions; side art is
mirrored. Legs, arms and head animate together for walking and idle breathing.
The tunic/sleeves, trousers, boots, hood, shield and held weapon follow their body
parts. Wearables use fitted SVGs here; weapon/shield art reuses `assets/items/`.
Bag icons and fitted clothing serve different purposes and are edited separately.

Phaser loads each SVG into a reusable texture once, then transforms the layers.
`?url&no-inline` keeps SVG files compatible with Phaser's SVG loader in Vite
production builds. No SVG generation or rasterization happens on animation ticks.
Profile portraits compose the same visible parts onto their existing canvases.
Only equipped slot IDs and the active weapon are shared with other players;
private inventory and item ownership are not broadcast. Existing saved equipment
controls the appearance after relogin, without a database migration.
