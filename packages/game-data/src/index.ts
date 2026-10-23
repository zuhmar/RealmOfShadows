import {elderwoodGround} from './elderwood';
export {elderwoodGround,elderwoodPonds,type ElderwoodTerrain} from './elderwood';
export const WORLD = { tile:64, width:32, height:24, speed:4, sprint:1.5, capacity:32, spawn:{x:16.5,y:14.5} };
export const landmarks = [
 {name:'The Copperleaf Bank',x:5,y:5,w:5,h:4,color:0x668ca0,description:'Your future vault. Banking arrives in Phase 5.'},
 {name:'Willow & Anvil',x:22,y:5,w:5,h:4,color:0xb78256,description:'The crafting district. Professions arrive in Phase 4.'},
 {name:'Adventurers’ Hall',x:5,y:17,w:5,h:4,color:0x8b77a3,description:'A home for future parties and guilds.'},
 {name:'Whispering Gate',x:23,y:17,w:4,h:3,color:0x668b72,description:'The woods await. Hunting opens in Phase 3.'},
];
export function blocked(x:number,y:number,region:RegionId='elderwood'):boolean {
 return x<1||y<1||x>=WORLD.width-1||y>=WORLD.height-1||(region==='elderwood'?landmarks:regions[region].obstacles).some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)||(region==='elderwood'&&(elderwoodGround(x,y)==='water'||(x===16&&y===10)));
}
export type Facing='down'|'left'|'right'|'up';
export interface SpriteManifest {key:string;url:string;frameWidth:number;frameHeight:number;anchor:{x:number;y:number};scale:number;animations:Partial<Record<'idle'|'walk',Record<Facing,{frames:number[];fps:number}>>>}
// Add a supplied sprite sheet here. Empty means explicit geometric placeholders.
export const characterSprite:SpriteManifest|null=null;

export const regions = {
 elderwood:{name:'Elderwood',description:'The shared village and your safe haven.',ground:[0x426a50,0x456e52],road:[0xb4aa84,0xbab18d],accent:0x76d6d3,obstacles:[]},
 woods:{name:'Whispering Woods',description:'Forest wolves roam beyond the portal sanctuary.',ground:[0x294b38,0x31573e],road:[0x7d8060,0x878867],accent:0x9be5ad,obstacles:[{x:6,y:6,w:4,h:5},{x:23,y:7,w:4,h:4},{x:7,y:18,w:5,h:3}]},
 caverns:{name:'Crystal Caverns',description:'Crystal-lit tunnels. Future mining and cave encounters.',ground:[0x34364f,0x3b4059],road:[0x66667b,0x717187],accent:0xc6a0ff,obstacles:[{x:6,y:5,w:5,h:5},{x:23,y:6,w:3,h:6},{x:5,y:18,w:6,h:3}]},
 swamp:{name:'Murkmire Swamp',description:'Misty wetlands. Future herbs and swamp creatures.',ground:[0x354d46,0x40584d],road:[0x7c8161,0x858a68],accent:0xc5dc83,obstacles:[{x:5,y:6,w:6,h:5},{x:23,y:6,w:4,h:5},{x:6,y:18,w:5,h:3}]},
} as const;
export type RegionId=keyof typeof regions;
export const PORTAL={x:16.5,y:13.5,radius:2.5,arrival:{x:16.5,y:15.5}};
export function isRegion(value:unknown):value is RegionId{return typeof value==='string'&&Object.hasOwn(regions,value);}
export function canTravel(position:{x:number;y:number},from:RegionId,to:unknown):to is RegionId{return isRegion(to)&&from!==to&&Math.hypot(position.x-PORTAL.x,position.y-PORTAL.y)<=PORTAL.radius;}
export {combat,wolfSpawns} from './combat';
export {items,rewards,merchant,totalXp,levelForXp,type ItemId} from './economy';
export * from './classes';

export * from './spells';
