import {portalFor,combat as C,type RegionId} from '@realm/game-data';
import {pathfind,type Point} from './index';
import {sight} from './combat';
// Plan toward a clear firing/melee position, never toward a monster's center.
export function attackPath(start:Point,target:Point,range:number,region:RegionId='woods'):Point[]{
 const PORTAL=portalFor(region);
 const angle=Math.atan2(start.y-target.y,start.x-target.x),candidates:Point[]=[];
 for(const radius of [Math.max(.5,range-.5),Math.min(.6,range-.5)])for(let i=0;i<16;i++){const a=angle+i*Math.PI/8;candidates.push({x:target.x+Math.cos(a)*radius,y:target.y+Math.sin(a)*radius});}
 candidates.sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y));
 for(const point of candidates){if(Math.hypot(point.x-PORTAL.x,point.y-PORTAL.y)<=C.portalSafeRadius+.2||!sight(point,target,region))continue;const route=pathfind(start,point,region),last=route.at(-1);if(last&&Math.hypot(last.x-target.x,last.y-target.y)<range-.08&&Math.hypot(last.x-PORTAL.x,last.y-PORTAL.y)>C.portalSafeRadius+.1&&sight(last,target,region))return route;}
 return [];
}
