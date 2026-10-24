# SVG Elderwood

The game loads these four standalone, genuinely vector SVGs:

- `base.svg`: meadow, dirt paths, paved square, river banks, water, cliffs,
  waterfalls and bridge decks. Surface flowers and grass do not block movement.
- `tavern.svg`: the blue-roof tavern beside Mara.
- `blacksmith.svg`: the red-roof forge.
- `portal.svg`: the crystal portal in the village square.

No PNGs are embedded or traced into bitmap wrappers. Original uploaded PNGs and
Reference.png remain in the parent folders unchanged. Player/NPC/monster artwork
is configured separately.

Source: `scripts/build-elderwood-svg.ts`. Run `npm run art:elderwood` to regenerate
all four SVGs. Edit that generator for styles/building details, and
`packages/game-data/src/elderwood.ts` for water, cliffs, bridges or object placement.
Base art and server/client collision share the same geometry. Tests reject stale
generated SVGs after geometry edits. Direct edits to generated SVGs are replaced
on regeneration, so transfer permanent changes into the generator.

Dimensions remain 1536 × 1024 for the base. Existing world scale, building
footprints, merchant position, portal interaction and travel destinations are
unchanged. Phaser rasterizes the source SVGs once at load time, with extra
resolution for display; it does not parse vector paths during gameplay.
