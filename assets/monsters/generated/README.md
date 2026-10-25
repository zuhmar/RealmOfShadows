# Generated Whispering Woods monsters

`whispering-woods-monsters.png` contains the generated Thorn Spider, Wild Boar
and Forest Bear on true alpha. The original generated image is copied intact.
`apps/client/src/monster-assets.ts` defines padded frame regions and gameplay
sizes; Phaser extracts them at runtime without rewriting the image.

These are single-pose painted sprites, with subtle movement bobbing, attack
pulsing, facing flips and hit flashes. They are not directional animation
sheets. The Wolf keeps its uploaded PNG animations. The existing SVG frame
sets remain available as fallback. Targeting, warning effects, movement,
server combat, loot and saving continue using the existing game logic.
