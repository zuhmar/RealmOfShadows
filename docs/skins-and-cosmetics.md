# Themed outfits, wings and auras

Players now use complete animated character sprites. The paper-doll renderer
and its appearance toggle are no longer part of the live character renderer.
Equipping armor or a weapon changes combat stats but does not change the skin.
Mara keeps her existing NPC sprite and animation sheet.

## Wardrobe

Open the character profile and choose **Wardrobe**. Ten complete human medieval
outfits are available to every class from level one: Citizen, Knight, Hunter,
Scholar, Assassin, Noble, Adventurer, Merchant, Pirate and Nomad. Use the Outfit
selector or expand **Browse all outfits** to choose from illustrated cards.
The selected card and live portrait update when the choice is accepted.

Outfits are independent of combat class. A Citizen can wear Knight armor, a Mage
can look like a Hunter, and a Rogue can wear Noble finery without changing class,
weapons, spells, skills, stats, gold or inventory slots. No class or level unlock
is required for this initial wardrobe. No purchase or loot system is implied.

Automatic remains an optional compatibility choice that follows the current
class. Once an explicit outfit is chosen, changing class keeps that outfit.
Existing saved `archer`, `mage` and `rogue` outfit IDs remain valid; their displayed
outfit names are Hunter, Scholar and Assassin. Combat class names are unchanged.

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
from the authoritative class; explicit choices can use any registered outfit.
Requests reject unknown IDs, extra keys and arbitrary textures. Changing cosmetics changes no stats, gold or ownership.
Selections save through the existing character JSON and save queue. Old saves
receive Automatic / None / None. Guests keep cosmetics for their session only.
No database migration is required. Deploy Vercel and Render from the same commit
so the server accepts the new IDs and the client has their artwork.

## Artwork and animation

All ten outfits use original human characters in a shared smooth, flat glossy
cartoon style, with controlled highlights, restrained cel shading and medieval
fabrics and silhouettes. The five existing human outfits are retained. The new
set adds purple velvet and gold Noble finery, a weathered-cape Adventurer,
a brocade-clad Merchant, a sea-coat Pirate and a layered desert-robed Nomad.

Each master contains two idle and four walk poses for down, left, right and up:
240 full-character poses in total. No held weapon is baked into the outfits;
combat continues to use equipped weapons. These are complete painted characters,
not equipment paper dolls, pixel-art conversions or copies of Tibia sprites.

Original generated masters are preserved in `assets/skins/masters/`. Run
`python3 scripts/extract-class-skins.py` to repeat measured atlas extraction.
Generated row spacing can drift, so extraction finds clear gaps near the quarter
boundaries to keep feet and hoods intact. Runtime outfit poses share 160×160 transparent canvases,
a common centered figure pivot, a foot baseline at y=154 and a constant scale per outfit. The wing master uses measured column bands because full pairs are wider than
folded profile views. The pipeline also extracts twelve directional wing sprites (192×160) and three auras
(192×64), all lossless WebP. `assets/skins/frames.json` records source bounds.
Runtime assets are loaded from `assets/skins/runtime/` without loading masters.

Wing extraction preserves a fixed scale across directions and anchors at the measured
root rather than centering each alpha bounding box. Upper-back heights account for the human body proportions. Profile roots attach at the inner
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
