# Realm of Shadows HUD artwork

Scalable SVG frames and icons for the dark-stone, worn-gold and amethyst HUD.
These are code-native UI decorations, with no text baked into the artwork.

- `panel-frame.svg`: explicit 96×96 source for nine-slice borders; slice at 20.
  Keep those dimensions when editing so tall popups retain square corners.
- `portrait-frame.svg`: frame behind the live player portrait canvas.
- `gem.svg`: small amethyst accent for the portrait and bottom dock.
- `shop.svg`, `bot.svg`, `skills.svg`, `journal.svg`: active dock icons. The earlier potion/loot SVGs remain
  available as artwork but their buttons have been removed. The existing Bag artwork is
  retained and all icon images are decorative; buttons supply accessible labels.

`apps/client/src/hud.css` controls surfaces, bars, sizing and safe-area layout.
`hud-assets.ts` imports icon URLs for both Vite development and production.
Native meters/progress, buttons, dialogs and gameplay event handlers remain live.
The illustrated login screen is intentionally excluded from the shared chrome.

Check with `npm run build` and `npm run test:hud:browser` (Vite on port 5354 or
TEST_CLIENT_URL). Browser checks cover 44px hit targets, profile/bag/shop actions,
sticky close controls, live health, spell/notification spacing,
320/390px portrait, landscape, desktop and the bot Stop control. The automatic-loot change also needs the matching server deployment.
No database migration or new environment variables are required.

Skills opens live combat/profession EXP in its own popup. Journal opens quests,
keepsakes and tasks directly; Bag retains a shortcut to it. Five 44px-or-larger
controls fit down to 320px-wide screens. Check these workflows with
`npm run test:dock-progress:browser`.
