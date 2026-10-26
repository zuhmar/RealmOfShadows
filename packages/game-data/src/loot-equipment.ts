import {equipmentItems,isEquipment,type EquipmentId,type EquipmentSlot} from './equipment';
import {weapons,isWeapon,type WeaponId} from './classes';
import type {EquipmentTier} from './equipment-tiers';
import type {Attributes,AttributeId} from './attributes';
export const rarityDefinitions={uncommon:{name:'Uncommon',color:'#83d895',multiplier:1.15,attributes:1,weight:60},rare:{name:'Rare',color:'#78b7ff',multiplier:1.35,attributes:2,weight:25},epic:{name:'Epic',color:'#c398ef',multiplier:1.65,attributes:3,weight:12},legendary:{name:'Legendary',color:'#ffc66c',multiplier:2,attributes:4,weight:3}} as const;
export type Rarity=keyof typeof rarityDefinitions;
export type GearBase=EquipmentId|WeaponId;
export type GearSlot=EquipmentSlot|'weapon';
export interface GearInstance{id:string;base:GearBase;rarity:Rarity|null}
export type GearLoadout=Record<GearSlot,string|null>;
export const lootEquipmentRules={capacity:32,dropChance:.20,bossDropChance:.65};
export const emptyGearLoadout=():GearLoadout=>({weapon:null,head:null,chest:null,legs:null,feet:null,offhand:null,neck:null,ring:null});
export const islandEquipmentTiers:Record<string,Exclude<EquipmentTier,'beginner'>>={woods:'copper',caverns:'iron',swamp:'gold',tundra:'mythril',celestial:'dragon',peaks:'shadow',fortress:'shadow'};
export function isGearBase(value:unknown):value is GearBase{return isEquipment(value)||isWeapon(value);}
export function isRarity(value:unknown):value is Rarity{return typeof value==='string'&&Object.hasOwn(rarityDefinitions,value);}
export function gearDefinition(base:GearBase){return isEquipment(base)?equipmentItems[base]:weapons[base];}
export function gearSlot(base:GearBase):GearSlot{return isEquipment(base)?equipmentItems[base].slot:'weapon';}
export function rollRarity(random:()=>number):Rarity{let roll=random()*100;for(const [id,r]of Object.entries(rarityDefinitions)){roll-=r.weight;if(roll<0)return id as Rarity;}return 'legendary';}
export function gearStats(item:GearInstance){const definition=gearDefinition(item.base),base='armor'in definition?definition.armor:definition.attack,rank=item.rarity?rarityDefinitions[item.rarity].attributes:0,rarity=item.rarity?rarityDefinitions[item.rarity]:null;const value=rarity?base+Math.max(1,Math.round(base*(rarity.multiplier-1)))+rank-1:base;
 const bonuses:Attributes={strength:0,dexterity:0,intelligence:0,vitality:0};
 if(rarity){const tier=['beginner','copper','iron','gold','mythril','dragon','shadow'].indexOf(definition.tier),slot=gearSlot(item.base);const primary:AttributeId=isWeapon(item.base)?(weapons[item.base].skill==='melee'?'strength':weapons[item.base].skill==='distance'?'dexterity':'intelligence'):slot==='head'||slot==='neck'?'intelligence':slot==='feet'||slot==='ring'?'dexterity':slot==='legs'?'strength':'vitality';bonuses[primary]=Math.max(1,tier)*rank;if(rank>=3)bonuses[primary==='vitality'?'strength':'vitality']=Math.max(1,tier)*(rank-2);}
 return {armor:isEquipment(item.base)?value:0,attack:isWeapon(item.base)?value:0,bonuses};
}
export function gearName(item:GearInstance){return `${item.rarity?rarityDefinitions[item.rarity].name:'Unidentified'} ${gearDefinition(item.base).name}`;}
