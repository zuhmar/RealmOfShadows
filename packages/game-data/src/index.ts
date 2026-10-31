export * from './fences';
export * from './neighborhood-dressing';
export * from './housing-visuals';
import {housingRegions} from './housing';
export * from './housing';
import {villageBuildings} from './village-buildings';
import {townPoint,elderwoodSize,elderwoodPortal} from './elderwood-layout';
import {woodsSize} from './woods-cliffs';
import {isRaisedFloor} from './elevation';
export * from './elevation';
export * from './building-visuals';
export * from './village-buildings';
export * from './cosmetics';
export * from './depot';
import {gridBlocked} from './grid-world';
export * from './grid-world';
import {rootsFootprintBlocked} from './woods-depths';
export * from './woods-depths';
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
export const WORLD = { tile:64, width:elderwoodSize.width, height:elderwoodSize.height, speed:4, sprint:1.5, capacity:32, spawn:{...elderwoodPortal.arrival} };
export const landmarks=villageBuildings.map(b=>({name:b.name,x:b.x,y:b.y,w:b.width,h:b.height,color:0x8b9b79,description:b.id==='depot'?'Walk inside and click a box to use your personal storage.':'Walk inside this village building.'}));
export const regionSize=(region:RegionId)=>isLowerFloor(region)?{width:48,height:36}:(region==='woods'||isRaisedFloor(region))?woodsSize:region==='caverns'?{width:64,height:48}:(region==='elderwood'||housingRegions.includes(region as typeof housingRegions[number]))?elderwoodSize:{width:32,height:24};
export function blocked(x:number,y:number,region:RegionId='elderwood'):boolean{return gridBlocked(region,x,y);}
export type Facing='down'|'left'|'right'|'up';
export interface SpriteManifest {key:string;url:string;frameWidth:number;frameHeight:number;anchor:{x:number;y:number};scale:number;animations:Partial<Record<'idle'|'walk',Record<Facing,{frames:number[];fps:number}>>>}
// Add a supplied sprite sheet here. Empty means explicit geometric placeholders.
export const characterSprite:SpriteManifest|null=null;

export const regions = {
 'elderwood-homes-upper':{name:'Elderwood · Homes Floor 2',description:'Player-owned cliff houses.',ground:[0x426a50,0x456e52],road:[0xb4aa84,0xbab18d],accent:0x76d6d3,obstacles:[]},
 'elderwood-homes-attic':{name:'Elderwood · Homes Floor 3',description:'The manor attic.',ground:[0x426a50,0x456e52],road:[0xb4aa84,0xbab18d],accent:0x76d6d3,obstacles:[]},
 'elderwood-upper':{name:'Elderwood · Cliff Walk & Lofts',description:'Connected perimeter cliffs, the Depot loft and Hall library.',ground:[0x426a50,0x456e52],road:[0xb4aa84,0xbab18d],accent:0x76d6d3,obstacles:[]},
 'woods-upper':{name:'Whispering Woods · Highlands',description:'A raised wolf lookout above the northern trail.',ground:[0x294b38,0x31573e],road:[0x7d8060,0x878867],accent:0x9be5ad,obstacles:[]},
 elderwood:{name:'Elderwood',description:'The shared village and your safe haven.',ground:[0x426a50,0x456e52],road:[0xb4aa84,0xbab18d],accent:0x76d6d3,obstacles:[]},
 woods:{name:'Whispering Woods',description:'Levels 1–10 · Wolves, thorn spiders, wild boars and the Forest Bear.',ground:[0x294b38,0x31573e],road:[0x7d8060,0x878867],accent:0x9be5ad,obstacles:[]},
 caverns:{name:'Crystal Caverns',description:'Levels 11–20 · Cave bats, shard crawlers, crystal golems and the Crystal Wyrm.',ground:[0x34364f,0x3b4059],road:[0x66667b,0x717187],accent:0xc6a0ff,obstacles:[]},
 'woods-depths':{name:'Whispering Woods · Root Hollow',description:'Mossy root chambers · Wolves, thorn spiders and wild boars.',ground:[0x28392d,0x334735],road:[0x6e7352,0x7b805d],accent:0xa9d694,obstacles:[]},
 'caverns-depths':{name:'Crystal Caverns · Depth 2',description:'Lower chambers · Crystal galleries, a sunken roost and the forgotten vault.',ground:[0x29263f,0x333049],road:[0x626081,0x74718d],accent:0xb293f0,obstacles:[]},
 swamp:{name:'Murkmire Swamp',description:'Misty wetlands. Future herbs and swamp creatures.',ground:[0x354d46,0x40584d],road:[0x7c8161,0x858a68],accent:0xc5dc83,obstacles:[{x:5,y:6,w:6,h:5},{x:23,y:6,w:4,h:5},{x:6,y:18,w:5,h:3}]},
} as const;
export type RegionId=keyof typeof regions;
export const PORTAL=elderwoodPortal;
export function isRegion(value:unknown):value is RegionId{return typeof value==='string'&&Object.hasOwn(regions,value);}
export const portalFor=(region:RegionId)=>region==='elderwood-homes-upper'?{x:26.5,y:8.5,radius:1.2,arrival:{x:27.5,y:8.5}}:region==='elderwood-homes-attic'?{x:88.5,y:26.5,radius:1.2,arrival:{x:89.5,y:26.5}}:isRaisedFloor(region)?{x:40.5,y:5.5,radius:1.2,arrival:{x:40.5,y:6.5}}:region==='elderwood-upper'?{...townPoint({x:28.5,y:21.5}),radius:2.5,arrival:townPoint({x:28.5,y:22.5})}:isLowerFloor(region)?{x:24.5,y:30.5,radius:2.5,arrival:{x:24.5,y:32.5}}:region==='woods'?{x:34.5,y:25.5,radius:2.5,arrival:{x:34.5,y:27.5}}:region==='caverns'?{x:32.5,y:40.5,radius:2.5,arrival:{x:32.5,y:42.5}}:region==='elderwood'?PORTAL:{x:16.5,y:13.5,radius:2.5,arrival:{x:16.5,y:15.5}};
export function canTravel(position:{x:number;y:number},from:RegionId,to:unknown):to is RegionId{return isRegion(to)&&!isRaisedFloor(from)&&!isRaisedFloor(to)&&!isLowerFloor(from)&&!isLowerFloor(to)&&!housingRegions.includes(from as typeof housingRegions[number])&&!housingRegions.includes(to as typeof housingRegions[number])&&from!==to&&Math.hypot(position.x-portalFor(from).x,position.y-portalFor(from).y)<=portalFor(from).radius;}
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

export * from './quests';

export * from './professions';

export * from './resource-varieties';
export * from './fishing';

export * from './town-services';

export * from './map-furniture';

export {woodsCliffs,woodsSize,woodsRidges,ridgeCells,woodsExpansionSpawns} from './woods-cliffs';

export type {WoodsRidge} from './woods-cliffs';

export {editorPropKeys,editorObject,propIdentity,editableProp,validateGridEdits,applyPropEdits} from './grid-editing';
export type {GridDocument,GridEdits,EditorProp,EditorSpawn} from './grid-editing';

export {authoredGridSpawns} from './grid-world';

export {townPoint,elderwoodTown,elderwoodSize,elderwoodPortal,elderwoodRimStairs,elderwoodStairTile,onElderwoodRim,onElderwoodLand} from './elderwood-layout';

export * from './neighborhood-life';

export * from './building-windows';

export * from './story-characters';
export * from './story-items';
