import type {ClassId} from './classes';
export const skinDefinitions={citizen:{name:'Citizen'},knight:{name:'Knight'},archer:{name:'Archer'},mage:{name:'Mage'},rogue:{name:'Rogue'}} as const;
export const wingDefinitions={none:{name:'None'},dawn:{name:'Dawn Feathers'},ember:{name:'Ember Drake'},fae:{name:'Violet Fae'}} as const;
export const auraDefinitions={none:{name:'None'},radiance:{name:'Golden Radiance'},arcane:{name:'Arcane Circle'},embers:{name:'Ember Halo'}} as const;
export type SkinId=keyof typeof skinDefinitions;export type WingId=keyof typeof wingDefinitions;export type AuraId=keyof typeof auraDefinitions;
export interface Cosmetics{skin:SkinId|'auto';wings:WingId;aura:AuraId}
export interface CosmeticLook{skin:SkinId;wings:WingId;aura:AuraId}
export const defaultCosmetics=():Cosmetics=>({skin:'auto',wings:'none',aura:'none'});
export const isSkin=(id:unknown):id is SkinId=>typeof id==='string'&&Object.hasOwn(skinDefinitions,id);
export const isWing=(id:unknown):id is WingId=>typeof id==='string'&&Object.hasOwn(wingDefinitions,id);
export const isAura=(id:unknown):id is AuraId=>typeof id==='string'&&Object.hasOwn(auraDefinitions,id);
export function validCosmetics(value:unknown,classId:ClassId):value is Cosmetics{const c=value as Cosmetics;return !!c&&typeof c==='object'&&!Array.isArray(c)&&Object.keys(c).sort().join(',')==='aura,skin,wings'&&(c.skin==='auto'||c.skin==='citizen'||c.skin===classId)&&isWing(c.wings)&&isAura(c.aura);}
export function cosmeticLook(c:Cosmetics,classId:ClassId):CosmeticLook{return {skin:c.skin==='auto'?classId:c.skin,wings:c.wings,aura:c.aura};}
export function readCosmeticLook(value:unknown):CosmeticLook{const fallback:CosmeticLook={skin:'citizen',wings:'none',aura:'none'};if(typeof value!=='string'||value.length>256)return fallback;try{const c=JSON.parse(value);return c&&isSkin(c.skin)&&isWing(c.wings)&&isAura(c.aura)?{skin:c.skin,wings:c.wings,aura:c.aura}:fallback;}catch{return fallback;}}
