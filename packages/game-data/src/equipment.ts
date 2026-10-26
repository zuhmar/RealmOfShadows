import type {EquipmentTier} from './equipment-tiers';
export const equipmentSlots={offhand:'Off-hand',head:'Head',chest:'Chest',legs:'Legs',feet:'Feet',neck:'Necklace',ring:'Ring'} as const;
export type EquipmentSlot=keyof typeof equipmentSlots;
export const equipmentItems={
 clothHood:{name:'Beginner Hood',slot:'head',armor:1,tier:'beginner',level:1,price:0},
 clothTunic:{name:'Beginner Tunic',slot:'chest',armor:1,tier:'beginner',level:1,price:0},
 clothTrousers:{name:'Beginner Trousers',slot:'legs',armor:1,tier:'beginner',level:1,price:0},
 leatherBoots:{name:'Beginner Boots',slot:'feet',armor:1,tier:'beginner',level:1,price:0},
 woodenShield:{name:'Beginner Shield',slot:'offhand',armor:1,tier:'beginner',level:1,price:0},
 beginnerPendant:{name:'Beginner Pendant',slot:'neck',armor:1,tier:'beginner',level:1,price:10},
 beginnerRing:{name:'Beginner Ring',slot:'ring',armor:1,tier:'beginner',level:1,price:10},
 copperHelm:{name:'Copper Helm',slot:'head',armor:2,tier:'copper',level:5,price:60},
 copperArmor:{name:'Copper Armor',slot:'chest',armor:2,tier:'copper',level:5,price:60},
 copperGreaves:{name:'Copper Greaves',slot:'legs',armor:2,tier:'copper',level:5,price:60},
 copperBoots:{name:'Copper Boots',slot:'feet',armor:2,tier:'copper',level:5,price:60},
 copperShield:{name:'Copper Shield',slot:'offhand',armor:2,tier:'copper',level:5,price:60},
 copperPendant:{name:'Copper Pendant',slot:'neck',armor:2,tier:'copper',level:5,price:30},
 copperRing:{name:'Copper Ring',slot:'ring',armor:2,tier:'copper',level:5,price:30},
 ironHelm:{name:'Iron Helm',slot:'head',armor:4,tier:'iron',level:11,price:180},
 ironArmor:{name:'Iron Armor',slot:'chest',armor:4,tier:'iron',level:11,price:180},
 ironGreaves:{name:'Iron Greaves',slot:'legs',armor:4,tier:'iron',level:11,price:180},
 ironBoots:{name:'Iron Boots',slot:'feet',armor:4,tier:'iron',level:11,price:180},
 ironShield:{name:'Iron Shield',slot:'offhand',armor:4,tier:'iron',level:11,price:180},
 ironPendant:{name:'Iron Pendant',slot:'neck',armor:4,tier:'iron',level:11,price:90},
 ironRing:{name:'Iron Ring',slot:'ring',armor:4,tier:'iron',level:11,price:90},
 goldHelm:{name:'Gold Helm',slot:'head',armor:6,tier:'gold',level:21,price:450},
 goldArmor:{name:'Gold Armor',slot:'chest',armor:6,tier:'gold',level:21,price:450},
 goldGreaves:{name:'Gold Greaves',slot:'legs',armor:6,tier:'gold',level:21,price:450},
 goldBoots:{name:'Gold Boots',slot:'feet',armor:6,tier:'gold',level:21,price:450},
 goldShield:{name:'Gold Shield',slot:'offhand',armor:6,tier:'gold',level:21,price:450},
 goldPendant:{name:'Gold Pendant',slot:'neck',armor:6,tier:'gold',level:21,price:225},
 goldRing:{name:'Gold Ring',slot:'ring',armor:6,tier:'gold',level:21,price:225},
 mythrilHelm:{name:'Mythril Helm',slot:'head',armor:9,tier:'mythril',level:31,price:1000},
 mythrilArmor:{name:'Mythril Armor',slot:'chest',armor:9,tier:'mythril',level:31,price:1000},
 mythrilGreaves:{name:'Mythril Greaves',slot:'legs',armor:9,tier:'mythril',level:31,price:1000},
 mythrilBoots:{name:'Mythril Boots',slot:'feet',armor:9,tier:'mythril',level:31,price:1000},
 mythrilShield:{name:'Mythril Shield',slot:'offhand',armor:9,tier:'mythril',level:31,price:1000},
 mythrilPendant:{name:'Mythril Pendant',slot:'neck',armor:9,tier:'mythril',level:31,price:500},
 mythrilRing:{name:'Mythril Ring',slot:'ring',armor:9,tier:'mythril',level:31,price:500},
 dragonHelm:{name:'Dragon Helm',slot:'head',armor:13,tier:'dragon',level:41,price:2400},
 dragonArmor:{name:'Dragon Armor',slot:'chest',armor:13,tier:'dragon',level:41,price:2400},
 dragonGreaves:{name:'Dragon Greaves',slot:'legs',armor:13,tier:'dragon',level:41,price:2400},
 dragonBoots:{name:'Dragon Boots',slot:'feet',armor:13,tier:'dragon',level:41,price:2400},
 dragonShield:{name:'Dragon Shield',slot:'offhand',armor:13,tier:'dragon',level:41,price:2400},
 dragonPendant:{name:'Dragon Pendant',slot:'neck',armor:13,tier:'dragon',level:41,price:1200},
 dragonRing:{name:'Dragon Ring',slot:'ring',armor:13,tier:'dragon',level:41,price:1200},
 shadowHelm:{name:'Shadow Helm',slot:'head',armor:18,tier:'shadow',level:51,price:5000},
 shadowArmor:{name:'Shadow Armor',slot:'chest',armor:18,tier:'shadow',level:51,price:5000},
 shadowGreaves:{name:'Shadow Greaves',slot:'legs',armor:18,tier:'shadow',level:51,price:5000},
 shadowBoots:{name:'Shadow Boots',slot:'feet',armor:18,tier:'shadow',level:51,price:5000},
 shadowShield:{name:'Shadow Shield',slot:'offhand',armor:18,tier:'shadow',level:51,price:5000},
 shadowPendant:{name:'Shadow Pendant',slot:'neck',armor:18,tier:'shadow',level:51,price:2500},
 shadowRing:{name:'Shadow Ring',slot:'ring',armor:18,tier:'shadow',level:51,price:2500},
} as const satisfies Record<string,{name:string;slot:EquipmentSlot;armor:number;tier:EquipmentTier;level:number;price:number}>;
export type EquipmentId=keyof typeof equipmentItems;
export type Equipment=Record<EquipmentSlot,EquipmentId|null>;
export const starterEquipment=['clothHood','clothTunic','clothTrousers','leatherBoots','woodenShield'] as EquipmentId[];
export function emptyEquipment():Equipment{return {offhand:null,head:null,chest:null,legs:null,feet:null,neck:null,ring:null};}
export function isEquipment(value:unknown):value is EquipmentId{return typeof value==='string'&&Object.hasOwn(equipmentItems,value);}
export function isEquipmentSlot(value:unknown):value is EquipmentSlot{return typeof value==='string'&&Object.hasOwn(equipmentSlots,value);}
export function equipmentArmor(equipment:Equipment){return Object.values(equipment).reduce((sum,id)=>sum+(id?equipmentItems[id].armor:0),0);}
// Public appearance contains equipped slots only, never inventory or ownership.
export function readAppearance(value:unknown):Equipment{
 const result=emptyEquipment();if(typeof value!=='string'||value.length>1024)return result;
 try{const data=JSON.parse(value);if(!data||typeof data!=='object'||Array.isArray(data))return result;for(const slot of Object.keys(equipmentSlots) as EquipmentSlot[]){const id=data[slot];if(isEquipment(id)&&equipmentItems[id].slot===slot)result[slot]=id;}}catch{}
 return result;
}
