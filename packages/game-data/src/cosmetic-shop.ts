import type {ClassId} from './classes';
import {outfitThemes,skinDefinitions,wingDefinitions,auraDefinitions,type Cosmetics} from './cosmetics';
export type ShopItem={id:string;name:string;category:'outfits'|'wings'|'auras';cosmetics:Partial<Cosmetics>;amount:500;currency:'usd'};
export const cosmeticCatalog:ShopItem[]=[...Object.entries(outfitThemes).filter(([id])=>!['citizen','knight','archer','mage','rogue'].includes(id)).map(([id,t])=>({id:`outfit:${id}`,name:t.name,category:'outfits' as const,cosmetics:{skin:id as Cosmetics['skin']},amount:500 as const,currency:'usd' as const})),...Object.entries(wingDefinitions).filter(([id])=>id!=='none').map(([id,t])=>({id:`wings:${id}`,name:t.name,category:'wings' as const,cosmetics:{wings:id as Cosmetics['wings']},amount:500 as const,currency:'usd' as const})),...Object.entries(auraDefinitions).filter(([id])=>id!=='none').map(([id,t])=>({id:`aura:${id}`,name:t.name,category:'auras' as const,cosmetics:{aura:id as Cosmetics['aura']},amount:500 as const,currency:'usd' as const}))];
export const shopItem=(id:unknown)=>typeof id==='string'?cosmeticCatalog.find(i=>i.id===id):undefined;
export function cosmeticKeys(c:Cosmetics){return[c.skin==='auto'?null:`outfit:${skinDefinitions[c.skin].theme}`,c.wings==='none'?null:`wings:${c.wings}`,c.aura==='none'?null:`aura:${c.aura}`].filter((s):s is string=>!!s)}
export const ownsCosmetics=(c:Cosmetics,owned:readonly string[])=>cosmeticKeys(c).every(id=>owned.includes(id));
export function accessibleCosmetics(c:Cosmetics,owned:readonly string[]):Cosmetics{return{skin:c.skin==='auto'||owned.includes(`outfit:${skinDefinitions[c.skin].theme}`)?c.skin:'auto',wings:c.wings==='none'||owned.includes(`wings:${c.wings}`)?c.wings:'none',aura:c.aura==='none'||owned.includes(`aura:${c.aura}`)?c.aura:'none'}};

export function earnedCosmetics(p:{classId:ClassId;level:number}){return ['outfit:citizen',...(p.classId!=='citizen'&&p.level>=5?[`outfit:${p.classId}`]:[])];}
