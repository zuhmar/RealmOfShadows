import {blocked,WORLD} from '@realm/game-data';
export interface Point {x:number;y:number}
export interface Motion extends Point {stamina:number}
export interface Input {x:number;y:number;sprint:boolean;seq:number}
export function legal(p:Point):boolean {const r=.20;return [-r,r].every(dx=>[-r,r].every(dy=>!blocked(Math.floor(p.x+dx),Math.floor(p.y+dy))));}
export function move(p:Motion,input:Input,dt:number):Motion {
 const len=Math.hypot(input.x,input.y);if(!len)return {...p,stamina:Math.min(100,p.stamina+dt*15)};
 const sprint=input.sprint&&p.stamina>0, distance=WORLD.speed*(sprint?WORLD.sprint:1)*dt;
 const dx=input.x/len*distance,dy=input.y/len*distance;
 const next={x:p.x+dx,y:p.y+dy};
 // Both orthogonal passages must be open: no sliding through a diagonal corner.
 const valid=legal(next)&&legal({x:next.x,y:p.y})&&legal({x:p.x,y:next.y});
 return {x:valid?next.x:p.x,y:valid?next.y:p.y,stamina:Math.max(0,Math.min(100,p.stamina+(sprint?-25:15)*dt))};
}
export function pathfind(start:Point,end:Point):Point[]{
 const a={x:Math.floor(start.x),y:Math.floor(start.y)},b={x:Math.floor(end.x),y:Math.floor(end.y)};
 if(blocked(b.x,b.y))return [];
 const key=(p:Point)=>`${p.x},${p.y}`,open=[a],g=new Map([[key(a),0]]),prev=new Map<string,Point>();let steps=0;
 while(open.length&&steps++<WORLD.width*WORLD.height){open.sort((p,q)=>(g.get(key(p))!+Math.hypot(p.x-b.x,p.y-b.y))-(g.get(key(q))!+Math.hypot(q.x-b.x,q.y-b.y)));const p=open.shift()!;
 if(key(p)===key(b)){const out:Point[]=[];let c=p;while(key(c)!==key(a)){out.unshift({x:c.x+.5,y:c.y+.5});c=prev.get(key(c))!;}return out;}
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const n={x:p.x+dx,y:p.y+dy};if(blocked(n.x,n.y)||blocked(p.x+dx,p.y)||blocked(p.x,p.y+dy))continue;const cost=g.get(key(p))!+Math.hypot(dx,dy);if(cost<(g.get(key(n))??Infinity)){g.set(key(n),cost);prev.set(key(n),p);if(!open.some(q=>key(q)===key(n)))open.push(n);}}
 }return [];
}
