# Shared equipment tiers

All four classes share the same seven armor sets. Weapon behavior and damage
continue to use the equipped weapon and its melee, distance or magic skill.
A tier contains head, chest, legs, feet, shield, pendant, ring, sword, bow, staff
and paired daggers: 77 item sprites, plus 21 equipped head views.

| Tier | Minimum level | Armor per piece | Armor price | Weapon price |
| --- | ---: | ---: | ---: | ---: |
| Beginner | 1 | 1 | Starter pieces free; jewelry 10 | Free training weapons |
| Copper | 5 | 2 | 60 | 120 |
| Iron | 11 | 4 | 180 | 360 |
| Gold | 21 | 6 | 450 | 900 |
| Mythril | 31 | 9 | 1,000 | 2,000 |
| Dragon | 41 | 13 | 2,400 | 4,800 |
| Shadow | 51 | 18 | 5,000 | 10,000 |

Higher-tier pendant/ring prices are half the armor price. Mara sells all tiers,
with purchases enforced by server-owned level, gold, proximity and ownership.
Class selection still grants its copper starter weapon. The first five armor
pieces and four training weapons remain available to new characters as before.

`masters/` preserves generated PNGs. Runtime atlases are compressed WebP.
Alpha bounds are measured, then extracted into `assets/items/*.png` (128×128
canvases) and the smaller paper-doll textures; no source masters are rewritten.
`preview.png` shows all seven outfits in four directions.

Run `npm run art:equipment` to rebuild derived assets and frame metadata.
Extraction requires Python with Pillow, NumPy and SciPy. Three native helmet
views are mirrored for the fourth facing, and equipment shares the existing
articulated walking rig, cape and pivots. Armor rig pieces come from the matching
item artwork; source pixels and transparent margins are preserved.

Old item IDs remain the IDs for Beginner pieces and Copper class weapons.
Existing saved equipment/ownership is retained. Saves accept the expanded
catalogue while still validating ownership, slots, levels and duplicate IDs.
Deploy the Vercel client and Render server from the same commit. No database
migration is required.
