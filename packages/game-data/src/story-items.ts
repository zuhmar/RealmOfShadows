import type {ClassId} from './classes';import type {QuestJournal} from './quests';import {classPath} from './story-characters';
export const storyItems={
 familyLocket:{name:'Scorched Family Locket',quest:'elderwood-main-1',description:'The locket Rowan recovered from Dawnreach. Its damaged clasp still holds the memory of your family.'},
 trainingManual:{name:'Rowan\'s Training Manual',quest:'elderwood-side-3',description:'Practical lessons in preparation and craft, carried through years of training.'},
 trailCharter:{name:'Warden\'s Trail Charter',quest:'woods-main-1',description:'Nerin\'s record of your first work protecting the trails beyond Elderwood.'},
 rangersMark:{name:'Mark of the Woodland Trial',quest:'woods-main-2',description:'Proof that you faced the Forest Bear with purpose, rather than blind anger.'},
 crystalCompass:{name:'Expedition Crystal Compass',quest:'caverns-main-1',description:'A compass recovered from the expedition. Its crystal points toward traces of the lost city\'s ward research.'},
 expeditionLedger:{name:'Dawnreach Expedition Ledger',quest:'caverns-main-2',description:'Records proving the Shadow Dragon targeted the city\'s knowledge of a light-forged ward.'},
 survivorRibbon:{name:'Survivor\'s Ribbon',quest:'swamp-main-1',description:'A ribbon tied by Dawnreach refugees to mark safe passages through Murkmire.'},
 citySeal:{name:'Broken Seal of Dawnreach',quest:'swamp-main-2',description:'The city seal recovered from the Hydra\'s marsh. A surviving name, not a forgotten ruin.'},
 veteransJournal:{name:'Northern Campaign Journal',quest:'tundra-main-1',description:'A veteran\'s account of holding the northern passes against the dragon\'s forces.'},
 frostMedallion:{name:'Medallion of Resolve',quest:'tundra-main-2',description:'Awarded after the Frost Giant trial. Your chosen discipline now holds under the harshest pressure.'},
 sunLens:{name:'Celestial Sun Lens',quest:'celestial-main-1',description:'An ancient lens that reveals the pattern binding shadow to the dragon\'s scales.'},
 seraphSigil:{name:'Restored Seraph Sigil',quest:'celestial-main-2',description:'The light-bearing design needed to sever the dragon\'s protection.'},
 emberIngot:{name:'Wardsmith\'s Ember Ingot',quest:'peaks-main-1',description:'Heat-tempered material strong enough to hold the restored Celestial design.'},
 dragonWard:{name:'Dragonbreaker Ward',quest:'peaks-main-2',description:'The completed counter-ward. Its purpose is to strip the Shadow Dragon\'s protection during the final confrontation.'},
 brokenChain:{name:'Chain of the Liberated',quest:'fortress-main-1',description:'A broken shackle recovered as the fortress\'s defenders fall and its prisoners find a way out.'},
 memorialStar:{name:'Star of Remembrance',quest:'fortress-main-2',description:'A memorial for your family and Dawnreach after the Shadow Dragon\'s defeat. Loss is not undone; the journey is fulfilled.'},
 knightInsignia:{name:'Knight\'s Path Insignia',quest:'elderwood-main-2',description:'Aldren\'s recognition of your commitment to the Knight path.'},
 archerInsignia:{name:'Archer\'s Path Insignia',quest:'elderwood-main-2',description:'Lyra\'s recognition of your commitment to the Archer path.'},
 mageInsignia:{name:'Mage\'s Path Insignia',quest:'elderwood-main-2',description:'Selene\'s recognition of your commitment to the Mage path.'},
 rogueInsignia:{name:'Rogue\'s Path Insignia',quest:'elderwood-main-2',description:'Corvin\'s recognition of your commitment to the Rogue path.'},
} as const;
export type StoryItemId=keyof typeof storyItems;
export function storyKeepsakes(journal:QuestJournal,classId:ClassId):StoryItemId[]{const seal=classPath(classId)?.insignia;return(Object.keys(storyItems) as StoryItemId[]).filter(id=>journal[storyItems[id].quest]?.claimed&&(!id.endsWith('Insignia')||id===seal));}
