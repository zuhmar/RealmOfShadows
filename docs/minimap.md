# Minimap

The top-right HUD contains a north-up minimap for every current map and floor. It follows the character across a roughly 48×36-cell view, clamped to the map edges. Small maps fit in full. The terrain, solid prop footprints and building wall edges come from the same edited grid data used by gameplay.

Markers:
- Cream circle: your character.
- Purple diamond: a surface travel portal.
- Cyan triangle: stairs on the current floor; triangle direction indicates up/down.
- Gold square: story NPCs and Mara.
- Red circle: living monsters within 12 tiles on the current floor.
- Blue circle: other living players on the current floor.

The footer shows your tile coordinates and floor: G for ground, F1–F3 for upper floors, B1 for underground. Map names identify the island and floor. Click or tap the header to collapse/reopen the map. The panel stays clear of the profile down to a 320px viewport and hides on login/character selection.

`apps/client/src/minimap.ts` caches terrain canvases and redraws live markers at most ten times per second. It consumes the existing local simulation or multiplayer state and requires no server or database changes. Client camera zoom does not alter minimap scale.

Validation: `npm test`, `npm run build`, and `npm run test:minimap:browser` (Vite at localhost:5366, or set TEST_CLIENT_URL). The browser check covers all ten region IDs on desktop/mobile, movement, floor filtering, monster/player marker colors, collapse controls, narrow layouts, and returning to login.
