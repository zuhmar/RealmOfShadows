import {regionSize,blocked,woodsFootprintBlocked,cavernsFootprintBlocked,elderwoodFootprintBlocked,WORLD,type RegionId} from '@realm/game-data';
export interface Point {x:number;y:number}
export interface Motion extends Point {stamina:number}
export interface Input {x:number;y:number;sprint:boolean;seq:number}
export function legal(p:Point,region:RegionId='elderwood',r=.20):boolean {
 if(region==='caverns')return p.x-r>=1&&p.y-r>=1&&p.x+r<regionSize(region).width-1&&p.y+r<regionSize(region).height-1&&!cavernsFootprintBlocked(p.x,p.y,r);
 if(region==='woods')return p.x-r>=1&&p.y-r>=1&&p.x+r<regionSize(region).width-1&&p.y+r<regionSize(region).height-1&&!woodsFootprintBlocked(p.x,p.y,r);
 if(region==='elderwood')return p.x-r>=1&&p.y-r>=1&&p.x+r<WORLD.width-1&&p.y+r<WORLD.height-1&&!elderwoodFootprintBlocked(p.x,p.y,r);
 return [-r,0,r].every(dx=>[-r,0,r].every(dy=>!blocked(Math.floor(p.x+dx),Math.floor(p.y+dy),region)));
}
export function move(p:Motion,input:Input,dt:number,region:RegionId='elderwood'):Motion {
 const len=Math.hypot(input.x,input.y);if(!len)return {...p,stamina:Math.min(100,p.stamina+dt*15)};
 const sprint=input.sprint&&p.stamina>0, distance=WORLD.speed*(sprint?WORLD.sprint:1)*dt;
 const dx=input.x/len*distance,dy=input.y/len*distance;
 const next={x:p.x+dx,y:p.y+dy};
 // Both orthogonal passages must be open: no sliding through a diagonal corner.
 const valid=legal(next,region)&&legal({x:next.x,y:p.y},region)&&legal({x:p.x,y:next.y},region);
 return {x:valid?next.x:p.x,y:valid?next.y:p.y,stamina:Math.max(0,Math.min(100,p.stamina+(sprint?-25:15)*dt))};
}
export function pathfind(start:Point,end:Point,region:RegionId='elderwood'):Point[]{
 // Half-tile navigation in the illustrated islands avoids snapping painted
 // path edges to whole tiles. Other regions keep their existing tile layout.
 const scale=(region==='elderwood'||region==='woods'||region==='caverns')?2:1;
 const a={x:Math.floor(start.x*scale),y:Math.floor(start.y*scale)},b={x:Math.floor(end.x*scale),y:Math.floor(end.y*scale)};
 const center=(p:Point)=>({x:(p.x+.5)/scale,y:(p.y+.5)/scale});
 // Leave room for the small arrival tolerance used while following a route.
 const openCell=(p:Point)=>legal(center(p),region,(region==='elderwood'||region==='woods'||region==='caverns')?.32:.20);
 if(!legal(end,region)||!openCell(b))return [];
 const key=(p:Point)=>`${p.x},${p.y}`,open=[a],g=new Map([[key(a),0]]),prev=new Map<string,Point>();let steps=0;
 while(open.length&&steps++<regionSize(region).width*regionSize(region).height*scale*scale){open.sort((p,q)=>(g.get(key(p))!+Math.hypot(p.x-b.x,p.y-b.y))-(g.get(key(q))!+Math.hypot(q.x-b.x,q.y-b.y)));const p=open.shift()!;
 if(key(p)===key(b)){const out:Point[]=[];let c=p;while(key(c)!==key(a)){out.unshift(center(c));c=prev.get(key(c))!;}return out;}
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const n={x:p.x+dx,y:p.y+dy};if(!openCell(n)||!openCell({x:p.x+dx,y:p.y})||!openCell({x:p.x,y:p.y+dy}))continue;const cost=g.get(key(p))!+Math.hypot(dx,dy);if(cost<(g.get(key(n))??Infinity)){g.set(key(n),cost);prev.set(key(n),p);if(!open.some(q=>key(q)===key(n)))open.push(n);}}
 }return [];
}
export {CombatSimulation,newFighter,type Fighter,type Wolf,type CombatEvent} from './combat';
export {Economy,type EconomySnapshot,type Drop} from './economy';

export {attackPath} from './attack-path';

export {sight} from "./combat";
