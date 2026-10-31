# Elderwood north entrance study

This example replaces seven tiles of cliff around the north entrance. It is deliberately local so its appearance can be reviewed before rebuilding other cliffs.

- A grass cap overhangs a joined vertical rock face with broad fractured planes, shaded recesses and a contact shadow.
- The stone landing reaches the head of a recessed flight. Its side cheeks, six treads, risers and dark opening all fit inside one native 32×32 cell.
- The visible north flight and its 64×64 gameplay click zone are centered at (52.5, 32.5). Clicking approaches the existing legal ground transition at (52.5, 33.5). The existing upper-floor transition remains at (52.5, 30.5), marked by a downward stair mouth.
- Map collision, floor destinations, houses, fences, items and saves are unchanged.

The implementation is `apps/client/src/cliff-study.ts`. `npm run test:cliff-study:browser` checks the one-cell footprint and real approach, climb and descent using mouse and touch, and exports native and gameplay screenshots to `/tmp/cliff-study-*`.

Deploy Vercel to review this example. No server or database update is needed.
