import {woodsRidges} from './woods-cliffs';
import type {RegionId} from './index';
export interface StairConnection{id:string;from:RegionId;to:RegionId;x:number;y:number;radius:number;arrival:{x:number;y:number};direction:'up'|'down';label:string}
export const floorConnections:readonly StairConnection[]=[
 ...woodsRidges.flatMap(r=>[
  {id:`woods-ridge-${r.id}-up`,from:'woods' as const,to:'woods-upper' as const,x:r.stair.x,y:r.stair.y+3,radius:1.2,arrival:r.stair,direction:'up' as const,label:`Up to ${r.name}`},
  {id:`woods-ridge-${r.id}-down`,from:'woods-upper' as const,to:'woods' as const,...r.stair,radius:1.2,arrival:{x:r.stair.x,y:r.stair.y+4},direction:'down' as const,label:'Down to the forest trail'},
 ]),
 {id:'woods-ledge-up',from:'woods',to:'woods-upper',x:40.5,y:9.5,radius:1.2,arrival:{x:40.5,y:6.5},direction:'up',label:'Up to Lookout Ledge'},
 {id:'woods-ledge-down',from:'woods-upper',to:'woods',x:40.5,y:5.5,radius:1.2,arrival:{x:40.5,y:10.5},direction:'down',label:'Down to the forest trail'},
 {id:'depot-loft-up',from:'elderwood',to:'elderwood-upper',x:11.5,y:6.5,radius:1.6,arrival:{x:11.5,y:7.5},direction:'up',label:'Depot loft'},
 {id:'depot-loft-down',from:'elderwood-upper',to:'elderwood',x:11.5,y:6.5,radius:1.6,arrival:{x:11.5,y:7.5},direction:'down',label:'Down to Depot'},
 {id:'hall-library-up',from:'elderwood',to:'elderwood-upper',x:24.5,y:20.5,radius:1.6,arrival:{x:24.5,y:20.5},direction:'up',label:'Hall library'},
 {id:'hall-library-down',from:'elderwood-upper',to:'elderwood',x:24.5,y:20.5,radius:1.6,arrival:{x:24.5,y:20.5},direction:'down',label:'Down to Hall'},
 {id:'crystal-down',from:'caverns',to:'caverns-depths',x:32.5,y:22.5,radius:2.5,arrival:{x:24.5,y:32.5},direction:'down',label:'Down to Depth 2'},
 {id:'crystal-up',from:'caverns-depths',to:'caverns',x:24.5,y:30.5,radius:2.5,arrival:{x:32.5,y:24.5},direction:'up',label:'Up to Depth 1'},
 {id:'woods-down',from:'woods',to:'woods-depths',x:34.5,y:12.5,radius:2.5,arrival:{x:24.5,y:32.5},direction:'down',label:'Down to Root Hollow'},
 {id:'woods-up',from:'woods-depths',to:'woods',x:24.5,y:30.5,radius:2.5,arrival:{x:34.5,y:14.5},direction:'up',label:'Up to Whispering Woods'},
];
export const isLowerFloor=(region:string)=>region==='caverns-depths'||region==='woods-depths';
export const islandForRegion=(region:string)=>region==='elderwood-upper'?'elderwood':(region==='woods-depths'||region==='woods-upper')?'woods':region==='caverns-depths'?'caverns':region;
export const stairsFor=(region:string)=>floorConnections.filter(s=>s.from===region);
export function availableStair(position:{x:number;y:number},region:RegionId,id:unknown){return typeof id==='string'?stairsFor(region).find(s=>s.id===id&&Math.hypot(position.x-s.x,position.y-s.y)<=s.radius):undefined;}
