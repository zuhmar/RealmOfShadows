import type {ClassId} from './classes';
import themes from './outfit-themes.json';
export const outfitThemes=themes;
export type OutfitThemeId=keyof typeof themes;
export type SkinId=OutfitThemeId|`${OutfitThemeId}-female`;
export type OutfitVariant='male'|'female';
interface SkinDefinition{name:string;themeName:string;theme:OutfitThemeId;variant:OutfitVariant;description:string;backHeight:number}
export const skinDefinitions=(()=>{
 const definitions={} as Record<SkinId,SkinDefinition>;
 for(const theme of Object.keys(themes) as OutfitThemeId[])for(const variant of ['male','female'] as const){
  const id:SkinId=variant==='male'?theme:`${theme}-female`,def=themes[theme];
  definitions[id]={...def,name:`${def.name} · ${variant==='male'?'Male':'Female'}`,themeName:def.name,theme,variant};
 }
 return definitions;
})();
export const wingDefinitions={none:{name:'None'},shadow:{name:'Shadow Wings'},divine:{name:'Divine Wings'},inferno:{name:'Inferno Wings'},frost:{name:'Frost Wings'},forest:{name:'Forest Wings'},celestial:{name:'Celestial Wings'},void:{name:'Void Wings'},phoenix:{name:'Phoenix Wings'},crystal:{name:'Crystal Wings'},dragon:{name:'Dragon Wings'}} as const;
export const auraDefinitions={none:{name:'None'},shadow:{name:'Shadow Aura'},divine:{name:'Divine Aura'},inferno:{name:'Inferno Aura'},frost:{name:'Frost Aura'},forest:{name:'Forest Aura'},celestial:{name:'Celestial Aura'},void:{name:'Void Aura'},blood:{name:'Blood Aura'},crystal:{name:'Crystal Aura'},dragon:{name:'Dragon Aura'}} as const;
export type WingId=keyof typeof wingDefinitions;export type AuraId=keyof typeof auraDefinitions;
export interface Cosmetics{skin:SkinId|'auto';wings:WingId;aura:AuraId}
export interface CosmeticLook{skin:SkinId;wings:WingId;aura:AuraId}
export const defaultCosmetics=():Cosmetics=>({skin:'auto',wings:'none',aura:'none'});
export const isSkin=(id:unknown):id is SkinId=>typeof id==='string'&&Object.hasOwn(skinDefinitions,id);
export const isWing=(id:unknown):id is WingId=>typeof id==='string'&&Object.hasOwn(wingDefinitions,id);
export const isAura=(id:unknown):id is AuraId=>typeof id==='string'&&Object.hasOwn(auraDefinitions,id);
const legacySkins:Record<string,SkinId>={noble:'royal-guardian',adventurer:'citizen',merchant:'citizen',pirate:'blood-moon',nomad:'sand-nomad'};
const legacyWings:Record<string,WingId>={dawn:'divine',ember:'dragon',fae:'forest'};
const legacyAuras:Record<string,AuraId>={radiance:'divine',arcane:'shadow',embers:'inferno'};
/** Translate only known retired choices; unknown IDs and extra keys still fail validation. */
export function migrateCosmetics(value:unknown):unknown{
 if(!value||typeof value!=='object'||Array.isArray(value))return value;
 const c=value as Record<string,unknown>;
 const alias=(v:unknown,table:Record<string,string>)=>typeof v==='string'&&Object.hasOwn(table,v)?table[v]:v;
 return {...c,skin:alias(c.skin,legacySkins),wings:alias(c.wings,legacyWings),aura:alias(c.aura,legacyAuras)};
}
export function validCosmetics(value:unknown):value is Cosmetics{const c=value as Cosmetics;return !!c&&typeof c==='object'&&!Array.isArray(c)&&Object.keys(c).sort().join(',')==='aura,skin,wings'&&(c.skin==='auto'||isSkin(c.skin))&&isWing(c.wings)&&isAura(c.aura);}
export function cosmeticLook(value:Cosmetics,classId:ClassId):CosmeticLook{const c=migrateCosmetics(value);if(!validCosmetics(c))return {skin:'citizen',wings:'none',aura:'none'};return {skin:c.skin==='auto'?classId:c.skin,wings:c.wings,aura:c.aura};}
export function readCosmeticLook(value:unknown):CosmeticLook{const fallback:CosmeticLook={skin:'citizen',wings:'none',aura:'none'};if(typeof value!=='string'||value.length>256)return fallback;try{const c=migrateCosmetics(JSON.parse(value));return validCosmetics(c)&&c.skin!=='auto'?{skin:c.skin,wings:c.wings,aura:c.aura}:fallback;}catch{return fallback;}}
