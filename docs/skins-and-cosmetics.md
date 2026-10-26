# Reference-based outfits, wings and auras

The uploaded images in `assets/references/` are the design source for this
collection. Outfits use the supplied human faces, hair, costume silhouettes,
colors, headgear and stylized glossy cartoon proportions. Wing and aura themes
follow their own reference sheets. Maps and item artwork use their existing
pipelines. The reference PNGs are preserved and never loaded into the game.

## Wardrobe

Open **Profile → Wardrobe → Browse reference outfits**. There are 15 outfit
themes, each with male and female versions (30 selectable looks):

- Iron Vanguard, Woodland Ranger, Arcane Scholar, Shadow Stalker, Wandering Adventurer.
- Shadow Reaper, Royal Guardian, Inferno Knight, Frostborn, Forest Spirit.
- Celestial Knight, Blood Moon, Crystal Warden, Sand Nomad, Void Lord.

The gallery can show both variants or filter to male/female. Changing the gallery
filter does not change the selected look. A variant is part of the outfit ID;
there is no new account or combat gender attribute.

Outfits remain independent of combat class and equipment. All choices are
available in this initial wardrobe, preserving the preceding wardrobe behavior.
The reference heading “unlockable outfits” has not introduced prices, quests,
level restrictions or loot rules. Those require a separate progression design.
Automatic still follows the current class's male base outfit; an explicit outfit
stays selected when class changes. Armor and weapons continue to determine stats.

The ten wing themes are Shadow, Divine, Inferno, Frost, Forest, Celestial, Void,
Phoenix, Crystal and Dragon. They have separate front, rear and profile art.
Profile roots sit on the upper back and the wings extend behind the wearer.
Rear-facing root clasps draw over the body; front-facing wings draw behind it.

The ten aura themes are Shadow, Divine, Inferno, Frost, Forest, Celestial, Void,
Blood, Crystal and Dragon. Each has three looping visual phases. Their upper
particles and the far half of the ground ring draw behind the character; the
near half draws in front of the feet. No character image is baked into an aura.
Wings and auras can be worn independently or set to None, and give no stats,
collision, skills, inventory slots, class abilities or combat bonuses.

## Runtime art pipeline

`packages/game-data/src/outfit-themes.json` defines theme metadata. Complete
reference-derived source images are preserved in `assets/skins/reference-masters/`.
`layout.json` records measured variant rows and separately generated profiles.
Crowded original atlases omitted some requested views, so dedicated rear and
right-facing strips supply those directions. No direction is substituted with
a rear view. The original uploaded references remain unedited.

Run `npm run art:skins` to extract and normalize the active collection. It uses
Pillow, NumPy and SciPy. Row detection uses eroded alpha only for measurement;
it does not erode the output artwork. Extraction excludes neighboring-cell
flecks, measures the actual figure's feet, and normalizes independently sized
source strips without stretching figures. A common 160×160 frame, centered
pivot and foot baseline y=154 keep idle and walking poses aligned.

The active folder is `assets/skins/reference-runtime/`:

- Thirty 960×640 outfit atlases: six poses across four facing directions,
  totaling 720 full-body poses. Two idle poses and four walking poses per view.
- Ten 768×160 wing atlases: four directional 192×160 frames, anchored at (96,90).
  A shared per-theme scale preserves profile foreshortening.
- Ten 1152×192 aura atlases: three back and three front frames, anchored at (96,162).
- Thirty separate 160×160 gallery thumbnails under `previews/`.

All runtime images are transparent lossless WebP. Atlas packing loads 50 cosmetic
textures instead of one image request per animation pose. Thumbnails use the
same first down-facing pose as the body. `reference-frames.json` records measured
source cells, bounds, placements and effect anchors for review. Old generated
art and its extraction script remain archived; `art:skins:legacy` reproduces
that older set. The active renderer loads only the reference-derived collection.

## Saving, migration and multiplayer

`Profile.cosmetics` still contains only `skin`, `wings`, and `aura`. Existing
character JSON storage and save queues are used; no SQL migration is required.
Guests retain choices only for their session. Private snapshots clone cosmetic
settings; other players receive only the resolved public `look` IDs.

Known retired choices migrate on save load, cosmetic requests and public-look
reads and wardrobe rendering: Noble → Royal Guardian; Adventurer/Merchant → Wandering Adventurer;
Pirate → Blood Moon; Nomad → Sand Nomad. Old Dawn/Ember/Fae wings map to
Divine/Dragon/Forest; Radiance/Arcane/Embers auras map to Divine/Shadow/Inferno.
Existing class-named base IDs remain valid. Unknown IDs, extra nested keys and
arbitrary textures are rejected, and migration changes no belongings or stats.

Rapid wardrobe selections are grouped for 150ms so the final choice stays under
the server's existing economy request budget. The accepted snapshot drives the
selected gallery card, portrait and in-world character.

Deploy **both Vercel and Render from the same commit** so both sides recognize
the collection and variant IDs. Checks: `npm test`, `npm run build`,
`npm run test:cosmetics:browser`, `npm run test:cosmetics:integration`,
`npm run test:cosmetics:peers`, and `npm run test:accounts`.
