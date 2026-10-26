import {depthsMap,depthsFootprintBlocked} from './caverns-depths';
import {isLowerFloor} from './floors';
export * from './floors';
export * from './caverns-depths';
import {woodsFootprintBlocked,woodsPortal} from './woods';
import {cavernsFootprintBlocked,cavernsPortal} from './caverns';
export * from './caverns';
export * from './woods';
import {elderwoodBlocked,elderwoodObjects} from './elderwood';
export {elderwoodGround,elderwoodBlocked,elderwoodFootprintBlocked,elderwoodPositionBlocked,elderwoodTerrainGeometry,elderwoodMap,elderwoodObjects,type ElderwoodTerrain} from './elderwood';
export const WORLD = { tile:64, width:32, height:24, speed:4, sprint:1.5, capacity:32, spawn:{x:16.5,y:14.5} };
export const landmarks=elderwoodObjects.filter(object=>object.name&&object.key!=='elderwood-stall-red'&&object.key!=='elderwood-stall-blue'&&object.key!=='elderwood-stall-green').map(object=>({name:object.name!,x:object.x/48,y:object.y/48+4/3,w:object.w/48,h:object.h/48,color:0x8b9b79,description:'A village landmark. Interiors are not open yet.'}));
export const regionSize=(region:RegionId)=>region==='caverns-depths'?{width:48,height:36}:region==='woods'?{width:68,height:48}:region==='caverns'?{width:64,height:48}:WORLD;
export function blocked(x:number,y:number,region:RegionId='elderwood'):boolean {
 return x<1||y<1||x>=regionSize(region).width-1||y>=regionSize(region).height-1||(region==='elderwood'?elderwoodBlocked(x,y):region==='caverns-depths'?depthsFootprintBlocked(x+.5,y+.5):region==='woods'?woodsFootprintBlocked(x+.5,y+.5):region==='caverns'?cavernsFootprintBlocked(x+.5,y+.5):regions[region].obstacles.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h));
}
export type Facing='down'|'left'|'right'|'up';
export interface SpriteManifest {key:string;url:string;frameWidth:number;frameHeight:number;anchor:{x:number;y:number};scale:number;animations:Partial<Record<'idle'|'walk',Record<Facing,{frames:number[];fps:number}>>>}
// Add a supplied sprite sheet here. Empty means explicit geometric placeholders.
export const characterSprite:SpriteManifest|null=null;

export const regions = {
 elderwood:{name:'Elderwood',description:'The shared village and your safe haven.',ground:[0x426a50,0x456e52],road:[0xb4aa84,0xbab18d],accent:0x76d6d3,obstacles:[]},
 woods:{name:'Whispering Woods',description:'Levels 1–10 · Wolves, thorn spiders, wild boars and the Forest Bear.',ground:[0x294b38,0x31573e],road:[0x7d8060,0x878867],accent:0x9be5ad,obstacles:[]},
 caverns:{name:'Crystal Caverns',description:'Levels 11–20 · Cave bats, shard crawlers, crystal golems and the Crystal Wyrm.',ground:[0x34364f,0x3b4059],road:[0x66667b,0x717187],accent:0xc6a0ff,obstacles:[]},
 'caverns-depths':{name:'Crystal Caverns · Depth 2',description:'Lower chambers · Crystal galleries, a sunken roost and the forgotten vault.',ground:[0x29263f,0x333049],road:[0x626081,0x74718d],accent:0xb293f0,obstacles:[]},
 swamp:{name:'Murkmire Swamp',description:'Misty wetlands. Future herbs and swamp creatures.',ground:[0x354d46,0x40584d],road:[0x7c8161,0x858a68],accent:0xc5dc83,obstacles:[{x:5,y:6,w:6,h:5},{x:23,y:6,w:4,h:5},{x:6,y:18,w:5,h:3}]},
} as const;
export type RegionId=keyof typeof regions;
export const PORTAL={x:16.5,y:13.5,radius:2.5,arrival:{x:16.5,y:15.5}};
export function isRegion(value:unknown):value is RegionId{return typeof value==='string'&&Object.hasOwn(regions,value);}
export const portalFor=(region:RegionId)=>region==='caverns-depths'?{x:24,y:1420/48,radius:2.5,arrival:{x:24,y:32}}:region==='woods'?woodsPortal:region==='caverns'?cavernsPortal:PORTAL;
export function canTravel(position:{x:number;y:number},from:RegionId,to:unknown):to is RegionId{return isRegion(to)&&!isLowerFloor(from)&&!isLowerFloor(to)&&from!==to&&Math.hypot(position.x-portalFor(from).x,position.y-portalFor(from).y)<=portalFor(from).radius;}
export {combat,wolfSpawns} from './combat';
export {items,rewards,merchant,totalXp,levelForXp,type ItemId} from './economy';
export * from './classes';

export * from './spells';

export * from './equipment';

export * from './island-layout';

export * from './monsters';
export * from './terrain-plan';

export * from './equipment-tiers';

export * from './attributes';

export * from './loot-equipment';

export * from './inventory';
