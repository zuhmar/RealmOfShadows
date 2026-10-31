# Combat bot

Bottom HUD → Bot configures nearby automatic hunting. Enable bot, close the profile,
and it finds a reachable matching monster on the current floor. Search distance
can be 6, 10 or 16 tiles. Any normal monster excludes bosses; selecting a boss
explicitly allows that boss. The bot reuses click-to-attack pathfinding, weapon
range, line of sight and normal attack requests. It never changes floors. Loot from credited kills now goes directly into the bag
through the shared automatic-loot system. Full-bag bundles stay on the ground. Normal kill credit, quests and task progress apply.

Add learned spells to the rotation, then use Earlier/Later/Remove to arrange it.
Only learned spells are offered and only learned spells can be attempted.
Rotation proceeds through available spells, skipping cooldowns, insufficient
mana, invalid range, blocked line of sight and unnecessary healing. Weapon
attacks continue between spells. When using an offensive rotation spell with a
shorter range than the weapon, the bot approaches to that spell's range.
Manual spell casts also update the client's cooldown estimate. The server
continues validating learned spells, mana, individual cooldowns and targets;
no new combat protocol, spells, stats or permissions are introduced.

Healing potion automation has an on/off control and a health percentage (1–95).
It uses actual bag potions only, at or below that percentage, with a missing-HP
check, existing cooldown and a local request interval to prevent repeated sends.
The current game has healing potions; this feature adds no mana-potion item.
It does not buy supplies or grant items. No target is needed to use a potion
while the bot is enabled in a hunting area.

Menus pause the bot and stop its owned attack/route; closing them resumes it.
Manual map clicks, keyboard movement, Esc, the bot popup toggle and the visible
Bot · Stop button give control back to the player. Travel, death, loss of focus
and disconnect stop automation. It runs only while the client is open and
active, rather than continuing on the server after logout. Settings persist in
this browser/device; enabled state never persists and the bot starts off after
reload. Settings are not part of the character save or shared with other players.

The client stopping an attack is now allowed while a menu is open. Casting a
spell preserves the existing auto-attack/chase state instead of disabling it.
These fixes also apply to the manual controls.

Code: `apps/client/src/bot-brain.ts` (decisions), `bot-ui.ts` (settings), and
`main.ts` (existing combat/movement integration). Tests: `tests/bot.test.ts`,
`npm run test:bot:browser`, and `npm run test:bot:online`. Browser tests expect
Vite at port 5314 or TEST_CLIENT_URL. The online test needs VITE_SERVER_URL
pointing to a running local game server. No database migration is needed.

The bottom dock contains Bag, Shop and Bot. While running it overlays a small Stop icon above the Bot button, with a
44px touch target. The dock always keeps three main buttons. Manual potion/loot buttons, the 3/E shortcuts and the bag potion Use action
are removed. Set the potion health threshold in the Bot popup; close it to resume.
Both Render and Vercel must deploy this change for authoritative automatic loot.
