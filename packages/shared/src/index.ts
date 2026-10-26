import {gridCrossesWall,gridBlocked,gridCell,gridKey,gridDirections,regionSize,WORLD,type RegionId} from '@realm/game-data';
export interface Point{x:number;y:number}
export interface Motion extends Point{stamina:number;stepX?:number;stepY?:number}
export interface Input{x:number;y:number;sprint:boolean;seq:number}
export const cellKey=gridKey;
export function legal(p:Point,region:RegionId='elderwood',r=.20):boolean{
 return [-r,0,r].every(dx=>[-r,0,r].every(dy=>!gridBlocked(region,p.x+dx,p.y+dy)&&!gridCrossesWall(region,p,{x:p.x+dx,y:p.y+dy})));
}
export function occupiedCells(actors:Iterable<Point & {stepX?:number;stepY?:number;region?:string;hp?:number}>,region:string,except?:Point){
 const result=new Set<string>();for(const actor of actors){if(actor===except||actor.region!==region||(actor.hp??1)<=0)continue;result.add(gridKey(actor));if(Number.isFinite(actor.stepX)&&Number.isFinite(actor.stepY))result.add(gridKey({x:actor.stepX!,y:actor.stepY!}));}return result;
}
export function freeLanding(position:Point,region:RegionId,occupied:ReadonlySet<string>):Point{
 const c=gridCell(position);for(let radius=0;radius<10;radius++)for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){if(Math.max(Math.abs(x),Math.abs(y))!==radius)continue;const p={x:c.x+x,y:c.y+y};if(legal(p,region)&&!occupied.has(gridKey(p)))return p;}throw Error('No free landing cell');
}
export function move(p:Motion,input:Input,dt:number,region:RegionId='elderwood',occupied:ReadonlySet<string>=new Set()):Motion{
 let tx=p.stepX??gridCell(p).x,ty=p.stepY??gridCell(p).y;
 const sprint=input.sprint&&p.stamina>0,stamina=Math.max(0,Math.min(100,p.stamina+(sprint?-25:15)*dt));
 if(Math.hypot(tx-p.x,ty-p.y)<.00001){
  const dx=Math.abs(input.x)>.01?Math.sign(input.x):0,dy=Math.abs(input.y)>.01?Math.sign(input.y):0;
  if(!dx&&!dy)return {...p,x:tx,y:ty,stepX:tx,stepY:ty,stamina:Math.min(100,p.stamina+dt*15)};
  const next={x:tx+dx,y:ty+dy},open=(q:Point)=>legal(q,region)&&!occupied.has(gridKey(q));
  if(gridCrossesWall(region,p,next)||!open(next)||!legal({x:next.x,y:ty},region)||!legal({x:tx,y:next.y},region))return {...p,x:tx,y:ty,stepX:tx,stepY:ty,stamina};
  tx=next.x;ty=next.y;
 }
 // A committed step finishes even when input is released or changes direction.
 // Only cell centers can initiate a turn; x/y interpolate for smooth rendering.
 const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),amount=Math.min(d,WORLD.speed*(sprint?WORLD.sprint:1)*Math.min(dt,.25));
 return {x:d<=amount?tx:p.x+dx/d*amount,y:d<=amount?ty:p.y+dy/d*amount,stepX:tx,stepY:ty,stamina};
}
export function pathfind(start:Point,end:Point,region:RegionId='elderwood',occupied:ReadonlySet<string>=new Set()):Point[]{
 const a=gridCell(start),b=gridCell(end),key=gridKey,openCell=(p:Point)=>legal(p,region)&&(!occupied.has(key(p))||key(p)===key(a));
 if(!openCell(b))return [];
 if(key(a)===key(b))return Math.hypot(start.x-b.x,start.y-b.y)>.001?[b]:[];
 const open=[a],cost=new Map([[key(a),0]]),prev=new Map<string,Point>(),closed=new Set<string>();let steps=0;
 while(open.length&&steps++<regionSize(region).width*regionSize(region).height){
  open.sort((p,q)=>(cost.get(key(p))!+Math.hypot(p.x-b.x,p.y-b.y))-(cost.get(key(q))!+Math.hypot(q.x-b.x,q.y-b.y)));const p=open.shift()!,pk=key(p);if(closed.has(pk))continue;closed.add(pk);
  if(pk===key(b)){const route:Point[]=[];let c=p;while(key(c)!==key(a)){route.unshift(c);c=prev.get(key(c))!;}return route;}
  for(const [dx,dy]of gridDirections){const n={x:p.x+dx,y:p.y+dy},nk=key(n);if(gridCrossesWall(region,p,n)||closed.has(nk)||!openCell(n)||!legal({x:p.x+dx,y:p.y},region)||!legal({x:p.x,y:p.y+dy},region))continue;
   const g=cost.get(pk)!+Math.hypot(dx,dy);if(g<(cost.get(nk)??Infinity)){cost.set(nk,g);prev.set(nk,p);if(!open.some(q=>key(q)===nk))open.push(n);}
  }
 }return [];
}
export {CombatSimulation,newFighter,type Fighter,type Wolf,type CombatEvent} from './combat';
export {Economy,type EconomySnapshot,type Drop} from './economy';

export {attackPath,inAttackRange} from './attack-path';

export {sight} from "./combat";

export {applyEquipment,effectiveAttributes,profileArmor} from './gear';
