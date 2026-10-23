import idleUrl from '../../../assets/characters/Citizen_idle_animations.png?url';
import walkUrl from '../../../assets/characters/Citizen_walk_animations.png?url';
import {idleCharacterSheet} from '../../../packages/game-data/src/character-sheet';
export const characterAssets = [
 {key:'citizen-idle',url:idleUrl,layout:idleCharacterSheet,scale:.30,origin:.97},
 {key:'citizen-walk',url:walkUrl,scale:.29,origin:.97,layout:{
  width:1536,height:1024,
  rows:[{direction:'down',top:10,bottom:278},{direction:'left',top:278,bottom:524},{direction:'right',top:526,bottom:758},{direction:'up',top:760,bottom:1012}],
  groups:[{action:'walk',fps:6,columns:[[440,744],[824,1128]]}],
 }},
] as const;
