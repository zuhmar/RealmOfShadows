# Wayfarer destination artwork

`island-atlas.png` is the original generated landscape atlas. It has two columns
and four rows: Elderwood / Woods, Caverns / Swamp, Tundra / Celestial, Peaks /
Fortress. These are travel-menu illustrations, not replacements for game maps.
No labels are baked into the artwork. Island names, level ranges, descriptions
and availability remain live HTML.

`island-atlas.webp` is the production image (about 600 KB). Regenerate it with
`npm run art:wayfarer` (Pillow), which compresses without changing the source
size/layout. `apps/client/src/wayfarer.ts` maps atlas cells to destination cards.

All eight islands have artwork. Current-region cards are disabled; future
regions not yet present in game data are marked Coming soon and cannot be
selected. Swamp retains its existing exploration-preview travel. Normal travel
checks, arrival locations and floor restrictions remain unchanged.

The inventory now shows the current skin, wings and aura between eight loadout
slots. Equipped items stay in those slots; carried catalogue gear, individual
monster drops and supplies are shown below. Equipped individual gear retains
its rarity border, full name/stat tooltip and unequip behavior. This layout does
not add paper-doll equipment overlays or change combat stats, item ownership,
bag capacity or saved data.

Check with `npm run build` and `npm run test:inventory-wayfarer:browser` (Vite on
port 5364 or TEST_CLIENT_URL). Desktop/mobile checks include catalogue and rolled
gear identification/equipping/unequipping, narrow-screen slot layout, image
loading, disabled planned destinations, travel and return travel. No migration
or new environment variables are required.
