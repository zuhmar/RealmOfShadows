import {gridMap,gridDirections,gridCrossesWall} from './grid-world';
import {resourceRegions} from './resource-spawns';
import {fishForIsland} from './resource-varieties';
import {resourceNodes,type ResourceNode} from './professions';
import type {RegionId} from './index';
export function fishingCastClear(actor:{x:number;y:number},water:{x:number;y:number},region:RegionId){
 const map=gridMap(region),d=Math.hypot(actor.x-water.x,actor.y-water.y);if(d>1.8||map.blocked.has(`${Math.floor(actor.x)},${Math.floor(actor.y)}`)||gridCrossesWall(region,actor,water))return false;
 for(let i=0;i<=Math.ceil(d*8);i++){const t=i/Math.max(1,Math.ceil(d*8)),x=Math.floor(actor.x+(water.x-actor.x)*t),y=Math.floor(actor.y+(water.y-actor.y)*t);if(map.blocked.has(`${x},${y}`)&&map.cells[y]?.[x]!==3)return false;}return true;
}
export function fishingShores(node:{x:number;y:number;region:string}){
 const region=node.region as RegionId,map=gridMap(region);return gridDirections.map(([dx,dy])=>({x:node.x+dx,y:node.y+dy})).filter(p=>p.x>0&&p.y>0&&p.x<map.width&&p.y<map.height&&!map.blocked.has(`${Math.floor(p.x)},${Math.floor(p.y)}`)&&fishingCastClear(p,node,region));
}
export function fishingTarget(id:string):ResourceNode|undefined{
 const match=/^fish:([a-z-]+):(\d+):(\d+)$/.exec(id);if(!match||!resourceRegions.some(r=>r===match[1]))return;
 const region=match[1] as RegionId,x=Number(match[2]),y=Number(match[3]),map=gridMap(region);if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||map.cells[y]?.[x]!==3)return;
 const fish=fishForIsland(region)[0];if(!fish)return;const node:ResourceNode={id,region,x:x+.5,y:y+.5,skill:'fishing',item:fish.item,level:fish.level,name:'Fishing water',xp:fish.xp,water:true};return fishingShores(node).length?node:undefined;
}
/** Deep-water clicks select the nearest fishable edge of that same water body. */
export function resolveFishingWater(region:RegionId,x:number,y:number):ResourceNode|undefined{
 const map=gridMap(region);if(!Number.isInteger(x)||!Number.isInteger(y)||map.cells[y]?.[x]!==3)return;
 const queue=[{x,y}],seen=new Set([`${x},${y}`]);for(let i=0;i<queue.length;i++){const p=queue[i],target=fishingTarget(`fish:${region}:${p.x}:${p.y}`);if(target)return target;
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=p.x+dx,ny=p.y+dy,key=`${nx},${ny}`;if(!seen.has(key)&&map.cells[ny]?.[nx]===3){seen.add(key);queue.push({x:nx,y:ny});}}
 }
}
export function resourceTarget(id:string){return resourceNodes.find(n=>n.id===id)??fishingTarget(id);}
