import {houseStairs} from './housing';
import {townPoint,elderwoodRimStairs} from './elderwood-layout';
import {woodsRidges} from './woods-cliffs';
import type {RegionId} from './index';
export interface StairConnection{id:string;from:RegionId;to:RegionId;x:number;y:number;radius:number;arrival:{x:number;y:number};direction:'up'|'down';label:string}
export const floorConnections:readonly StairConnection[]=[
 ...houseStairs(),
 ...elderwoodRimStairs.flatMap(s=>[
 {id:`elderwood-rim-${s.id}-up`,from:'elderwood' as const,to:'elderwood-upper' as const,x:s.x,y:s.y,radius:1.2,arrival:s.top,direction:'up' as const,label:`Up to ${s.id} cliffs`},
 {id:`elderwood-rim-${s.id}-down`,from:'elderwood-upper' as const,to:'elderwood' as const,...s.top,radius:1.2,arrival:s.return,direction:'down' as const,label:`Down to Elderwood`},
 ]),
 ...woodsRidges.flatMap(r=>[
  {id:`woods-ridge-${r.id}-up`,from:'woods' as const,to:'woods-upper' as const,x:r.stair.x,y:r.stair.y+3,radius:1.2,arrival:r.stair,direction:'up' as const,label:`Up to ${r.name}`},
  {id:`woods-ridge-${r.id}-down`,from:'woods-upper' as const,to:'woods' as const,...r.stair,radius:1.2,arrival:{x:r.stair.x,y:r.stair.y+4},direction:'down' as const,label:'Down to the forest trail'},
 ]),
 {id:'woods-ledge-up',from:'woods',to:'woods-upper',x:40.5,y:9.5,radius:1.2,arrival:{x:40.5,y:6.5},direction:'up',label:'Up to Lookout Ledge'},
 {id:'woods-ledge-down',from:'woods-upper',to:'woods',x:40.5,y:5.5,radius:1.2,arrival:{x:40.5,y:10.5},direction:'down',label:'Down to the forest trail'},
 {id:'depot-loft-up',from:'elderwood',to:'elderwood-upper',...townPoint({x:28.5,y:21.5}),radius:1.6,arrival:townPoint({x:28.5,y:22.5}),direction:'up',label:'Depot loft'},
 {id:'depot-loft-down',from:'elderwood-upper',to:'elderwood',...townPoint({x:28.5,y:21.5}),radius:1.6,arrival:townPoint({x:28.5,y:22.5}),direction:'down',label:'Down to Depot'},
 {id:'hall-library-up',from:'elderwood',to:'elderwood-upper',...townPoint({x:40.5,y:31.5}),radius:1.6,arrival:townPoint({x:40.5,y:31.5}),direction:'up',label:'Hall library'},
 {id:'hall-library-down',from:'elderwood-upper',to:'elderwood',...townPoint({x:40.5,y:31.5}),radius:1.6,arrival:townPoint({x:40.5,y:31.5}),direction:'down',label:'Down to Hall'},
 {id:'crystal-down',from:'caverns',to:'caverns-depths',x:32.5,y:22.5,radius:2.5,arrival:{x:24.5,y:32.5},direction:'down',label:'Down to Depth 2'},
 {id:'crystal-up',from:'caverns-depths',to:'caverns',x:24.5,y:30.5,radius:2.5,arrival:{x:32.5,y:24.5},direction:'up',label:'Up to Depth 1'},
 {id:'woods-down',from:'woods',to:'woods-depths',x:34.5,y:12.5,radius:2.5,arrival:{x:24.5,y:32.5},direction:'down',label:'Down to Root Hollow'},
 {id:'woods-up',from:'woods-depths',to:'woods',x:24.5,y:30.5,radius:2.5,arrival:{x:34.5,y:14.5},direction:'up',label:'Up to Whispering Woods'},
];
export const isLowerFloor=(region:string)=>region==='caverns-depths'||region==='woods-depths';
export const islandForRegion=(region:string)=>region.startsWith('elderwood')?'elderwood':(region==='woods-depths'||region==='woods-upper')?'woods':region==='caverns-depths'?'caverns':region;
export const stairsFor=(region:string)=>floorConnections.filter(s=>s.from===region);
export function availableStair(position:{x:number;y:number},region:RegionId,id:unknown){return typeof id==='string'?stairsFor(region).find(s=>s.id===id&&Math.hypot(position.x-s.x,position.y-s.y)<=s.radius):undefined;}
