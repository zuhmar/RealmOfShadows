# Whispering Woods encounter flow

The surface retains 46 monsters (15 wolves, 15 spiders, 15 boars and one bear),
with stable spawn IDs and unchanged stats, aggression and respawn timers.

- A passive wolf at the western junction introduces combat before the harder
  branches. Aggressive encounters stay away from the portal arrival.
- Eastern wolves and southern spiders alternate small pairs and isolated
  encounters, leaving longer stretches to recover or explore.
- Three existing `wild-boar` spawns now stand on the southern boss approach,
  at cells (37,43), (46,44), and (52,43). They are outside the enclosed grove,
  beyond the bear's detection range, and clear of the single entrance.
- The remaining roaming boars form an optional deeper eastern pocket and a
  southeastern encounter. Upper-floor habitats and the quiet overlook are retained.

These guards give The Woodland Trial a natural route for its three-boar objective.
The objective still accepts boars elsewhere on the island; no special kill IDs
or new quest requirements are introduced.

All relocated spawns are reachable from the portal. Generated trail shoulders
remain clear around their footprints. No cliffs, stairs, arena walls or map size
were redesigned. Deploy server and client together so enemy positions and shared
map collision agree. No SQL migration is needed.

Checks: `npm test`, `npm run build`, and
`TEST_CLIENT_URL=http://localhost:5366 node tests/browser-woods-encounter-flow.cjs`.
The browser check covers desktop/mobile rendering, kills credited from the three
relocated guards, the bear trial, and the resulting level-11 unlock.
