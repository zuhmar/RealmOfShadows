# Neighborhood and trail layout pass

Elderwood keeps its buildings, NPC services, portal, pond fishing and upper rooms.
The outdoor layout now separates the main stone street, building forecourts,
Smithy delivery yard and pond walk. A fenced flower garden north of the well has
a two-cell southern gate, flower beds and a bench; one lane beside the bench
stays open. Smithy supplies use existing directional chest and barrel sprites.
Flowers along the southern approach are scenery, not gatherable herbs.

Whispering Woods keeps the same 28 encounters, habitats, enclosed boss grove,
portal and stairs. Main trails bend through the hunting approaches. Dirt margins
weather in multi-cell patches, with a protected dirt tile beneath each approach
spawn. Tree sites use deterministic scattered spacing rather than planted rows;
trunks keep clear of the original full-width trail. Small understory props sit
beside trails and away from monster spawn rings. Grass remains walkable, so a
weathered trail shoulder is not an invisible wall.

Caverns and both lower floors have irregular chamber shoulders. Only unmarked
floor on the top/bottom room boundary is notched, and no notch enters a spawn's
two-cell safety ring. Marked corridors, bridges, water and stairs retain their
own materials. This keeps routes readable while breaking up rectangular rooms.

All scenery uses the existing art and square runtime canvases. `grid-world.ts`
is shared by game, editor and server; `map-prop-sizes.json` includes the newly
placed furniture/fences. The map editor collision preview shows actual solid
fences, supply piles, trunks and terrain walls. Monster stats, spawn counts,
loot, professions, quests and saves are unchanged. Elderwood remains fishing-only.

Validation includes garden/yard/pond routes, solid garden boundaries, all current
monster and stair destinations, all walkable town interiors, timed fishing,
resource distribution and square prop rendering. Regenerate map previews with
`npm run art:map-previews` against a running development client.

Deploy Render and Vercel together for the new collision layout. Reload old game
tabs after deployment. Saved characters use normal free-landing recovery if a
new prop occupies their previous cell; no database migration is required.
