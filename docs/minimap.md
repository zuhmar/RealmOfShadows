# Minimap

The top-right HUD contains a north-up minimap for every current map and floor. It follows the character across a roughly 48×36-cell view, clamped to the map edges. Small maps fit in full. The terrain, solid prop footprints and building wall edges come from the same edited grid data used by gameplay.

Markers:
- Cream circle: your character.
- Purple diamond: a surface travel portal.
- Cyan triangle: stairs on the current floor; triangle direction indicates up/down.
- Gold square: story NPCs and Mara.
- Red circle: living monsters within 12 tiles on the current floor.
- Blue circle: other living players on the current floor.

The bottom caption shows the map name. Coordinates and floor remain available in the caption tooltip and the canvas accessibility label. Click or tap the minimap (or focus it and press Enter/Space) to open a full-screen overview of the entire current map and floor, with live position and markers. Close it with × or Escape. The small map stays open and matches the profile button’s height on desktop, mobile and landscape. Its canvas resizes to the available space without stretching terrain. The panel stays clear of the profile down to a 320px viewport and hides on login/character selection.

`apps/client/src/minimap.ts` caches terrain canvases and redraws live markers at most ten times per second. It consumes the existing local simulation or multiplayer state and requires no server or database changes. Client camera zoom does not alter minimap scale.

Validation: `npm test`, `npm run build`, and `npm run test:minimap:browser` (Vite at localhost:5366, or set TEST_CLIENT_URL). The browser check covers all ten region IDs on desktop/mobile, movement, floor filtering, monster/player marker colors, fixed map height, chat collapse controls, narrow layouts, and returning to login.
