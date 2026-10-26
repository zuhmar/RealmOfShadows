import {portalFor,combat as C,gridCell,gridKey,type RegionId} from '@realm/game-data';
import {pathfind,legal,type Point} from './index';
import {sight} from './combat';
export const inAttackRange=(a:Point,b:Point,range:number)=>range<=1.5?Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=range+.01:Math.hypot(a.x-b.x,a.y-b.y)<=range;
export function attackPath(start:Point,target:Point,range:number,region:RegionId='woods',occupied:ReadonlySet<string>=new Set()):Point[]{
 const portal=portalFor(region),center=gridCell(target),candidates:Point[]=[],radius=Math.ceil(range);
 for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){if(!x&&!y)continue;const p={x:center.x+x,y:center.y+y};if(legal(p,region)&&inAttackRange(p,target,range)&&!occupied.has(gridKey(p))&&Math.hypot(p.x-portal.x,p.y-portal.y)>C.portalSafeRadius+.1&&sight(p,target,region))candidates.push(p);}
 candidates.sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y));
 for(const p of candidates){const route=pathfind(start,p,region,occupied);if(route.length)return route;}return [];
}
