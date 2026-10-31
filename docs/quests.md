# Dawnreach campaign

As a boy, the protagonist lost his family and most of Dawnreach when the Shadow
Dragon destroyed the city. Rowan rescued him and raised him in Elderwood. Years
of training lead into the playable journey: choose a class at level 5, master its
skills, follow the surviving evidence through the islands, and confront the dragon.
The destination is Master Knight, Archer, Mage, or Rogue, according to the chosen
class. The story does not assign every player the title of warrior.

## Playable content and contacts

There are 40 authored quests: five in Elderwood and two main/three side quests
on each of seven adventure islands. **15 are playable now** in Elderwood,
Whispering Woods and Crystal Caverns. The remaining 25 appear as planned and
cannot be accepted until their maps and encounters are implemented. This update
adds no new island maps or future-island monster sprites.

Click a named NPC to approach and open their conversation. Accept quests there;
conversation objectives offer Continue conversation. Claim completed rewards at
the contact. Mara can still coordinate adventure-island quests to preserve the
previous workflow. Elderwood quests require their own named contact.
Journal contains the full journal, backstory, rank and keepsakes.

| NPC | Location | Role and approved human appearance |
| --- | --- | --- |
| Rowan | Elderwood 54.5,54.5 | Guardian; sand nomad |
| Master Aldren | Elderwood 43.5,49.5 | Knight mentor; royal guardian |
| Master Lyra | Elderwood 60.5,49.5 | Archer mentor; female archer |
| Master Selene | Elderwood 43.5,57.5 | Mage mentor; female mage |
| Master Corvin | Elderwood 60.5,57.5 | Rogue mentor; rogue |
| Lysa | Elderwood 49.5,55.5 | Dawnreach survivor; female citizen |
| Nerin | Woods 36.5,28.5 | Warden; archer |
| Orin | Caverns 34.5,43.5 | Expedition archivist; mage |
| Varek | Elderwood 37.5,42.5 | Wardsmith; inferno knight |

These NPCs use nine distinct existing approved outfit sheets, with idle poses
and matching portraits. Dialogue and biographies are in `story-characters.ts`.
No character-reference replacements are required.

Elderwood main quests recover the family locket, then choose a class and reach
level 2 in its primary skill (melee for Knight/Rogue, distance for Archer, magic
for Mage). The level-5 choice remains explicit. Side quests ask players to carry
a potion, gather/catch three resources, and craft one recipe. Supplies remain
in the player's bag. Existing crafting trainers provide the benches/recipes.

## Chapter arc

| Island | Main chapters | Story evidence |
| --- | --- | --- |
| Whispering Woods | Beyond the Training Yard; The Woodland Trial | Trail charter; ranger's mark |
| Crystal Caverns | The Missing Expedition; What the Crystal Remembered | Crystal compass; expedition ledger |
| Murkmire Swamp | Names in the Marsh; The City We Carry | Survivor ribbon; city seal |
| Frostfall Tundra | The Northern Record; Resolve in the White Silence | Veteran's journal; frost medallion |
| Celestial Realm | Light Beneath the Shadow; The Seraph's Design | Sun lens; seraph sigil |
| Ember Peaks | A Ward Worth Forging; Through Dragonfire | Ember ingot; dragon ward |
| Shadow Fortress | Break the Fortress; For Dawnreach | Broken chain; memorial star |

The expedition reveals that Dawnreach's ward research made it a target. Survivor
accounts, northern records and celestial knowledge lead to forging a counterward,
freeing the fortress and confronting the dragon. The final quest requires level
100. The family remains lost; the ending honors them rather than resurrecting them.
All seven claimed boss chapters plus the class-path quest earn the Master title.
Intermediate titles are Apprentice, Disciple, Adept and Expert.

## Items and art

Twenty generated transparent 128×128 keepsake icons are in `assets/items/story`:
16 shared story items and four class insignias. Only the chosen class's insignia
is awarded. The set includes the family locket and training manual in addition
to the chapter evidence above. Item descriptions and claim associations live in
`story-items.ts`. Keepsakes are derived from claimed quests, displayed separately
in the journal, cannot be sold, and consume no bag slots. They do not grant combat
stats or unlearned spells. No extra mutable save field is needed.

The original generated atlas is `assets/generated/story/story-icons-atlas.png`.
`npm run art:story-items` extracts icons using alpha connected components (Pillow
and NumPy), retaining pieces extending across nominal atlas cell boundaries.
The contact sheet is `assets/generated/previews/story-keepsakes.png`.

## Progress, compatibility and deployment

The existing 35 adventure quest IDs, objective shapes, counts and gold rewards
remain unchanged. The opening Woods EXP rewards now follow the milestones below;
other island EXP rewards remain unchanged. Only accepted events count, except current-state class,
training and potion requirements. Successful gathering/fishing/crafting counts;
failed, cancelled or full-bag actions do not. Server checks contact distance,
floor/line of sight, prerequisites and one-time rewards. Private journals are
not broadcast to other players.

New cross-chapter prerequisites apply to fresh acceptance, not legacy accepted
journals. Previously completed quests yield their matching derived keepsakes.
Existing progress, equipment, learned spells and gameplay remain intact. Guests
retain session-only progress; authenticated profiles use the existing save path.
No SQL migration is required. Deploy Render and Vercel from the same commit.

Validation: `npm test`, `npm run build`, `npm run test:story:integration` (mock
Supabase with real Colyseus server restart), and `npm run test:story:browser`
(Vite on port 5298 or TEST_CLIENT_URL; desktop and mobile). The browser test
covers real NPC clicks, path approach, journal icons, class choice and both
island contacts. `test:quests:browser` covers the existing Mara workflow.

## Guided opening and repeatable tasks

The compact book icon below the profile opens the HUD tracker, which follows Rowan → woodland training → level-5 class
choice/mentor → woodland boss → Orin. The Journal popup's Track objective selector can
pin an eligible main or side quest; Automatic resumes the story or active hunt.
NPC markers: gold ! offers a quest, gold ? has a story reward, muted … means a
quest is in progress; teal ◆ offers tasks and teal ? has a task reward. Find
contact routes within the current floor. Cross-island guidance routes to the
portal; floor changes still use stairs. The journal stays readable anywhere.

Opening rewards are deliberately milestones: Woods main 1 now gives 1,210 EXP
and Woods main 2 gives 8,120 EXP. Six wolves (210 EXP) plus four spiders (180 EXP)
and main 1 guarantee level 5 even without side quests. Rowan's 40 EXP, the class
trial's 100 EXP, the bear's 180 EXP and main 2 bring that route to level 11.
Gold, monster stats/rewards, side-quest rewards and other islands' quest rewards
are unchanged. Fresh acceptance of the woodland boss quest requires the class
trial. Existing accepted/claimed journals remain valid and claimed rewards are
not paid again. These numbers replace the earlier generic 100/150 Woods EXP;
previously claimed quests receive no retroactive EXP.

At level 11, with a chosen class and The Woodland Trial claimed, Orin introduces
monster tasks. This is the Caverns story unlock; portal exploration behavior is
unchanged. Mara also arranges hunts from Elderwood. The task board is available
in Orin's conversation and Journal → Monster tasks. One active hunt can target any
of the eight implemented monsters: wolf, spider, boar, bear, bat, crawler, golem
or wyrm. Normal hunts offer 10/25/50 kills; boss hunts offer 1/3/5. No future
monster types are advertised until their encounters exist.

Rewards are a bonus on top of normal kill EXP and loot: 30% of that monster's
base EXP × hunt size and 50% of its base gold × hunt size, rounded to integers.
Example: 10 cave bats give a task bonus of 240 EXP and 75 gold. Completed hunts
can be repeated without a daily limit. Only credited matching kills after
acceptance on the monster's own island count; upper/lower floors count together.
Only one task is active, progress caps at its goal, and duplicate kill events
are ignored by the economy's existing event cursor. Failed/remote/forged claims
pay nothing. Each accepted hunt has a unique ID so an old claim cannot redeem a
new hunt. Rewards are claimed once at Orin or Mara. Abandoning requires an
explicit UI confirmation and gives no reward; a replacement starts from zero.

Tasks are a private profile field (`tasks.active` and `tasks.completed`), cloned
in snapshots and validated in saved progress. Older saves receive an empty task
state, preserving all existing items and progress. A server restart integration
test covers claiming a task, starting a new hunt and restoring it after login.
No database schema migration is required. Deploy client and server together.

Additional checks: `npm run test:tasks:browser` (Vite on port 5304 or
TEST_CLIENT_URL) and `npm run test:story:integration`.

The floating region/game title has been removed. The collapsed tracker is a
44px touch target with a 30px icon; its details open below the icon in a bounded,
scrollable panel. Check mobile portrait and landscape with
`npm run test:tracker-icon:browser`.
