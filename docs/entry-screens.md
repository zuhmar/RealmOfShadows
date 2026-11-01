# Login and character screens

Login uses the Realm of Shadows logo and a clean illustrated background. Returning
accounts choose a character; other users can sign in, create an account, or enter
as a guest. Guest progress is still temporary. Restoring a session does not enter
the world automatically.

Character selection is a full-screen four-slot carousel showing only character
sprites or + signs. Swipe, use the arrows, press Left/Right/Home/End, or choose
a slot indicator to browse. The selected name, level and class appear below. Tap
a sprite to play; tap + to open the separate creation screen. Creation has a name field,
a required male/female choice and an Adventurer preview. Back returns to the roster
without creating or saving anything. Submission keeps the active screen in its
loading state until the server accepts the character. Existing save slots and
level-five class choice work as before.

All three views share `apps/client/src/entry.css`. Their fields/buttons remain
native and scroll into view on small screens and when a phone keyboard is open.
The original uploaded login PNG is preserved under `assets/ui/login`; new artwork
separates the logo from the background so the layout can resize independently.

No database migration or server configuration change is needed. Deploy the client.

Checks:
- `npm run build`
- `node tests/browser-entry-screens.cjs` (TEST_CLIENT_URL selects the dev server)
- `node tests/browser-login.cjs` (set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH as needed)
- `npx tsx tests/character-slots.browser.ts` (mock Supabase plus real game server)
