# Supplied character artwork

Keep original flat glossy cartoon art. Do not overwrite sprite sheets. Until supplied, the player is explicitly a geometric placeholder.

Set `characterSprite` in `packages/game-data/src/index.ts`. Place browser-served sheets under `apps/client/public/assets/characters/` (or use an approved asset URL). Recommended frames: transparent 128×128 px, consistent feet anchor, four directions down/left/right/up. `anchor` is the normalized feet position, e.g. `{x:0.5,y:0.88}`; `scale` is display scale.

Example manifest shape (frame indices are examples; match the actual sheet):

```ts
{
 key:'adventurer', url:'/assets/characters/adventurer.png',
 frameWidth:128, frameHeight:128, anchor:{x:.5,y:.88}, scale:.65,
 animations:{
  idle:{down:{frames:[0,1,2,3],fps:5},left:{frames:[4,5,6,7],fps:5},right:{frames:[8,9,10,11],fps:5},up:{frames:[12,13,14,15],fps:5}},
  walk:{down:{frames:[16,17,18,19,20,21],fps:10},left:{frames:[22,23,24,25,26,27],fps:10},right:{frames:[28,29,30,31,32,33],fps:10},up:{frames:[34,35,36,37,38,39],fps:10}}
 }
}
```

Animation names: idle, walk, run. Frame counts and frame rates are configurable. Future attack/cast/hit/death and equipment layers need explicit manifests with offsets and ordering. No supplied sheets were present during Phase 1 implementation.

## Supplied labeled sheet

The in-game **Import character sheet** control accepts the supplied 1536×1024 presentation layout. It registers 48 source rectangles (four frames × three actions × four directions), inset two pixels from the grid. It does not remove backgrounds, repaint sprites, or change alpha. Coordinates live in `packages/game-data/src/character-sheet.ts` and can be adjusted independently. Idle and walk are played by movement; attack frames are registered for later combat work.

The chat image was not accessible as a filesystem attachment during integration. Select your original PNG in the browser to use it for the local player. Import is local to that browser session; reload requires selecting it again, and other players retain placeholders. The original sheet is neither uploaded to the server nor committed. Exact visual alignment and transparency require checking the original PNG. To distribute the sheet to all players, place the original file in client public assets and configure a persistent manifest/atlas as a follow-up once its bytes are available.

## Two-frame idle sheet

Use **Import idle sheet** for the newer 1536×1024 idle-only image. It has two columns of character poses and rows ordered down, left, right, up. `idleCharacterSheet` in `packages/game-data/src/character-sheet.ts` defines eight explicit crop rectangles and a 3 fps loop. Crops retain source pixels and alpha; no background removal is performed. The wide presentation margins are excluded. These bounds were estimated from the chat preview; exact pixel alignment/transparency remains unverified without the original file.

Importing this image replaces only idle animations. Previously imported walk/attack animations remain registered, with their own scale/anchor settings. If no walk sheet is loaded, movement still works and uses the corresponding idle facing instead of inventing walk frames. Like the existing importer, this selection stays local to the browser session and does not distribute the artwork to other players or persist after reload.
