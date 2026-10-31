# Elderwood north entrance study

The approved north entrance has been extended to all four Elderwood cliff entrances. Shared cliff tiles in Elderwood and Whispering Woods use the same fractured rock planes.

- A grass cap overhangs a joined vertical rock face with broad fractured planes, shaded recesses and a contact shadow.
- The stone landing reaches the head of a recessed flight. Its grey stone side cheeks, six treads, risers and dark opening all fit inside one native 32×32 cell.
- The north flight, both 64×64 gameplay click zones, the upper arrival and the descent trigger are centered at (52.5, 32.5). Clicking from below approaches the existing ground transition at (52.5, 33.5). A one-cell-wide upper stair recess connects the flight to the cliff walk at (52.5, 30.5). The other three entrances use the same shared geometry rule.
- Upper-floor collision includes four short stair recesses; the ground village, houses, fences, items and saves are preserved.

The stair and landing are drawn by `apps/client/src/cliff-study.ts`; surrounding rock uses the same shared fracture field and contour renderer as every other cliff. The former seven-cell scenery patch has been removed. `npm run test:cliff-study:browser` checks the one-cell footprint and real approach, climb and descent using mouse and touch, and exports native and gameplay screenshots to `/tmp/cliff-study-*`.

Deploy Render and Vercel together because the shared upper-floor collision and stair destinations changed. No database migration is needed.
