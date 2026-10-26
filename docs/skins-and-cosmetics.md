# Class skins, wings and auras

Players now use complete animated character sprites. The paper-doll renderer
and its appearance toggle are no longer part of the live character renderer.
Equipping armor or a weapon changes combat stats but does not change the skin.
Mara keeps her existing NPC sprite and animation sheet.

## Wardrobe

Open the character profile and choose **Wardrobe**. Automatic follows the
character's class. Citizen is always available; Knight, Archer, Mage and Rogue
outfits unlock when that class is chosen at level 5. Class choice itself is
unchanged. A character cannot use another class's outfit by forging a request.

Wings have independent None, Dawn Feathers, Ember Drake and Violet Fae choices.
Auras have None, Golden Radiance, Arcane Circle and Ember Halo choices. One of
each can be worn at once or removed. This first collection is freely available;
there is no purchase, loot roll or combat bonus. Cosmetics do not consume bag or
Depot slots and do not affect the grid footprint, speed, damage or learned spells.
Wings follow all four facing directions using measured upper-back attachment roots;
auras pulse beneath the feet. Neither modifies character body parts.

Selections update the in-world character and profile portraits. The server
replicates only the resolved public `look` (skin, wings, aura) to other players.
The existing public equipment appearance field is retained for compatibility,
but is not used to assemble the player visually. Inventory stays private.

## Saving and validation

`Profile.cosmetics` stores exactly three validated IDs. Automatic is resolved
from the authoritative class; requests cannot select a locked class outfit or
an arbitrary texture. Changing cosmetics changes no stats, gold or ownership.
Selections save through the existing character JSON and save queue. Old saves
receive Automatic / None / None. Guests keep cosmetics for their session only.
No database migration is required. Deploy Vercel and Render from the same commit.

## Artwork and animation

All five skins are original, distinct characters made without the supplied references:
Citizen courier (auburn hair and teal overalls), dwarf Knight (white beard and ruby armor),
elf Archer (mint ponytail), moon-witch Mage (silver bob and crescent hat), and foxfolk Rogue
(orange fur and indigo leathers). Each master contains two idle and four walk poses for down, left, right and up:
120 character poses. No held weapon is baked into the outfits; combat still
uses the equipped weapon. The Archer carries a decorative quiver.

Original generated masters are preserved in `assets/skins/masters/`. Run
`python3 scripts/extract-class-skins.py` to repeat measured atlas extraction.
Some master rows are not exactly 256 pixels tall, so measured row bands keep
feet and hoods intact. Runtime class poses share 160×160 transparent canvases,
a common foot baseline at y=154 and a constant scale per class. The wing master uses measured column bands because full pairs are wider than
folded profile views. The pipeline also extracts twelve directional wing sprites (192×160) and three auras
(192×64), all lossless WebP. `assets/skins/frames.json` records source bounds.
Runtime assets are loaded from `assets/skins/runtime/` without loading masters.

Wing extraction preserves a fixed scale across directions and anchors at the measured
root rather than centering each alpha bounding box. Profile roots attach at the inner
edge; their horizontal offsets follow the wearer’s back. Rear-facing wings render over
the character, while front-facing wings render behind it. No image-center flutter
scaling is used. Extraction requires Pillow, NumPy and SciPy.

`SkinAvatar` draws a full-character animation sprite, a directional wing pair and
an aura beneath it. Directional poses are drawn artwork; walking does not
rotate or move separate limbs. Portraits render the same selected look.

Checks: `npm test`, `npm run build`, `npm run test:cosmetics:browser`,
`npm run test:cosmetics:integration`, and `npm run test:accounts`.
Browser URL defaults to localhost:5250 and server URL to ws://localhost:2640;
set TEST_CLIENT_URL and TEST_SERVER_URL to choose other running services.
