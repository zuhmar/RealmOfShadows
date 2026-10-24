# Whispering Woods

`Reference(1).png` is the original supplied layout and remains unchanged.
The playable map uses the generated `svg/` assets. `svg/full-map.svg` is a
standalone vector export for review; the game loads the base and shared props
separately so trees, ruins and enemies sort correctly around players.

The central portal connects four habitats: wolves north, Thorn Spiders west,
Wild Boars east, and the Forest Bear arena south. Eight enemies spawn on clear
land. Water, cliffs, tree trunks, boulders, logs and ruin bases use the same
collision geometry in the client and server. Broad paths remain open between
habitats. The two side bridges cross the boundary streams; they are scenery
and walkable decks, not additional travel portals.

Edit `packages/game-data/src/woods.ts` for terrain, props and collision;
`scripts/build-woods-svg.ts` for the ground and vector artwork. Run
`npm run art:woods` to regenerate. Do not overwrite the supplied PNG.

Monster spawn locations, levels and stats live in
`packages/game-data/src/monsters.ts`. The SVG monster generation workflow is
documented in `assets/monsters/svg/README.md`. Other islands keep their current
maps until their reference-driven versions are built.
