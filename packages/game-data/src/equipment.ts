export const equipmentSlots={offhand:'Off-hand',head:'Head',chest:'Chest',legs:'Legs',feet:'Feet',neck:'Necklace',ring:'Ring'} as const;
export type EquipmentSlot=keyof typeof equipmentSlots;
export const equipmentItems={
 clothHood:{name:'Cloth Hood',slot:'head',armor:1},
 clothTunic:{name:'Cloth Tunic',slot:'chest',armor:1},
 clothTrousers:{name:'Cloth Trousers',slot:'legs',armor:1},
 leatherBoots:{name:'Leather Boots',slot:'feet',armor:1},
 woodenShield:{name:'Wooden Shield',slot:'offhand',armor:1},
} as const;
export type EquipmentId=keyof typeof equipmentItems;
export type Equipment=Record<EquipmentSlot,EquipmentId|null>;
export const starterEquipment=Object.keys(equipmentItems) as EquipmentId[];
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
