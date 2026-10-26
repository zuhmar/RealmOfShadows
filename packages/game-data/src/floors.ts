import type {RegionId} from './index';
export interface StairConnection{id:string;from:RegionId;to:RegionId;x:number;y:number;radius:number;arrival:{x:number;y:number};direction:'up'|'down';label:string}
export const floorConnections:readonly StairConnection[]=[
 {id:'crystal-down',from:'caverns',to:'caverns-depths',x:32,y:1120/48+4/3,radius:2.5,arrival:{x:24,y:32},direction:'down',label:'Down to Depth 2'},
 {id:'crystal-up',from:'caverns-depths',to:'caverns',x:24,y:1420/48,radius:2.5,arrival:{x:32,y:1120/48+4/3+2.3},direction:'up',label:'Up to Depth 1'},
 {id:'woods-down',from:'woods',to:'woods-depths',x:34,y:18,radius:2.5,arrival:{x:24,y:32},direction:'down',label:'Down to Root Hollow'},
 {id:'woods-up',from:'woods-depths',to:'woods',x:24,y:1420/48,radius:2.5,arrival:{x:34,y:20.3},direction:'up',label:'Up to Whispering Woods'},
];
export const isLowerFloor=(region:string)=>region==='caverns-depths'||region==='woods-depths';
export const islandForRegion=(region:string)=>region==='woods-depths'?'woods':region==='caverns-depths'?'caverns':region;
export const stairsFor=(region:string)=>floorConnections.filter(s=>s.from===region);
export function availableStair(position:{x:number;y:number},region:RegionId,id:unknown){return typeof id==='string'?stairsFor(region).find(s=>s.id===id&&Math.hypot(position.x-s.x,position.y-s.y)<=s.radius):undefined;}
