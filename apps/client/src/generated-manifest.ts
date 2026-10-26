import {generatedFrames,type GeneratedFrame} from './generated-frames';
import {cavernsPropFrames} from './caverns-prop-frames';
export type {GeneratedFrame} from './generated-frames';
import {equipmentHeadFrames} from './equipment-head-frames';
import equipmentHeadsUrl from '../../../assets/equipment/heads.webp?url';
import {equipmentFrames} from './equipment-frames';
import beginnerEquipmentUrl from '../../../assets/equipment/beginner.webp?url';
import copperEquipmentUrl from '../../../assets/equipment/copper.webp?url';
import ironEquipmentUrl from '../../../assets/equipment/iron.webp?url';
import goldEquipmentUrl from '../../../assets/equipment/gold.webp?url';
import mythrilEquipmentUrl from '../../../assets/equipment/mythril.webp?url';
import dragonEquipmentUrl from '../../../assets/equipment/dragon.webp?url';
import shadowEquipmentUrl from '../../../assets/equipment/shadow.webp?url';
import itemsUrl from '../../../assets/generated/items.png?url';
import characterUrl from '../../../assets/generated/character.png?url';
import hoodedUrl from '../../../assets/generated/hooded.png?url';
export interface GeneratedSheet {key:string;url:string;scale:number;frames:Record<string,GeneratedFrame>}
// Common materials use the same painted source in both regions. Each destination
// retains its own logical canvas and placement, so world footprints stay intact.
export const sharedEnvironmentSprites:Record<string,string>=Object.fromEntries(
 ['oak','pine','boulder','banner','lamp','gate-pier'].map(name=>[`woods-${name}`,`elderwood-${name}`]),
);
export const generatedSheets:GeneratedSheet[]=[
 {key:'equipment-heads',url:equipmentHeadsUrl,scale:1,frames:equipmentHeadFrames},
 {key:'equipment-beginner',url:beginnerEquipmentUrl,scale:1,frames:equipmentFrames.beginner},
 {key:'equipment-copper',url:copperEquipmentUrl,scale:1,frames:equipmentFrames.copper},
 {key:'equipment-iron',url:ironEquipmentUrl,scale:1,frames:equipmentFrames.iron},
 {key:'equipment-gold',url:goldEquipmentUrl,scale:1,frames:equipmentFrames.gold},
 {key:'equipment-mythril',url:mythrilEquipmentUrl,scale:1,frames:equipmentFrames.mythril},
 {key:'equipment-dragon',url:dragonEquipmentUrl,scale:1,frames:equipmentFrames.dragon},
 {key:'equipment-shadow',url:shadowEquipmentUrl,scale:1,frames:equipmentFrames.shadow},

 // Map prefabs are reconstructed from their 32px tile pages. Keep their trim
 // metadata for tooling; the original master atlases are no longer downloaded.
 {key:'generated-buildings',url:'',scale:2,frames:generatedFrames.buildings},
 {key:'generated-village',url:'',scale:2,frames:generatedFrames.village},
 {key:'generated-forest',url:'',scale:2,frames:{...generatedFrames.forest,'woods-portal':generatedFrames.village['elderwood-portal']}},
 {key:'generated-caverns',url:'',scale:2,frames:cavernsPropFrames},
 {key:'generated-items',url:itemsUrl,scale:1,frames:generatedFrames.items},
 {key:'generated-character',url:characterUrl,scale:1,frames:generatedFrames.character},
 {key:'generated-hooded',url:hoodedUrl,scale:1,frames:generatedFrames.hooded},
];
