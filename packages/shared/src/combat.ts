import {combat as C,wolfSpawns,PORTAL,type RegionId,type Facing} from '@realm/game-data';
import {legal,pathfind,type Point} from './index';
export interface Fighter extends Point{region:RegionId;hp:number;mana:number;deadUntil:number;shotAt:number;spellAt:number;target:string;auto:boolean}
export interface Wolf extends Point{id:string;hp:number;mode:string;facing:Facing;target:string;attackAt:number;respawnAt:number;spawnX:number;spawnY:number}
export interface Projectile extends Point{id:string;owner:string;target:string;region:RegionId;expires:number}
export interface CombatEvent{kind:'bolt'|'nova'|'hit'|'death'|'respawn';region:RegionId;x:number;y:number;toX?:number;toY?:number;damage?:number}
export function newFighter():Fighter{return {x:16.5,y:14.5,region:'elderwood',hp:C.playerHp,mana:C.mana,deadUntil:0,shotAt:0,spellAt:0,target:'',auto:false};}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function sight(a:Point,b:Point):boolean{const n=Math.ceil(distance(a,b)*8);for(let i=0;i<=n;i++){if(!legal({x:a.x+(b.x-a.x)*i/Math.max(1,n),y:a.y+(b.y-a.y)*i/Math.max(1,n)},'woods'))return false;}return true;}
export class CombatSimulation{
 time=0;serial=0;wolves=new Map<string,Wolf>();projectiles=new Map<string,Projectile>();events:CombatEvent[]=[];
 constructor(){for(const s of wolfSpawns)this.wolves.set(s.id,{...s,hp:C.wolf.hp,mode:'idle',facing:'down',target:'',attackAt:0,respawnAt:0,spawnX:s.x,spawnY:s.y});}
 safe(p:Point){return distance(p,PORTAL)<C.portalSafeRadius;}
 clear(p:Fighter){p.target='';p.auto=false;}
 damage(w:Wolf,amount:number,attacker?:string){if(w.hp<=0||w.mode==='return')return;w.hp=Math.max(0,w.hp-amount);if(w.hp>0&&attacker){w.target=attacker;if(w.mode==='idle')w.mode='chase';}this.events.push({kind:'hit',region:'woods',x:w.x,y:w.y,damage:amount});if(!w.hp){w.mode='dead';w.target='';w.respawnAt=this.time+C.wolf.respawn;this.events.push({kind:'death',region:'woods',x:w.x,y:w.y});}}
 action(id:string,p:Fighter,kind:unknown,target:unknown):boolean{
 if(p.hp<=0||p.region!=='woods'||this.safe(p))return false;
 if(kind==='stop'){this.clear(p);return true;}
 if(typeof target!=='string')return false;const w=this.wolves.get(target);if(!w||w.hp<=0||w.mode==='return'||!sight(p,w))return false;
 if(kind==='bolt'){if(distance(p,w)>C.bolt.range)return false;p.target=target;p.auto=true;this.shoot(id,p);return true;}
 if(kind==='nova'){if(this.time<p.spellAt||p.mana<C.nova.cost||distance(p,w)>C.nova.range)return false;p.mana-=C.nova.cost;p.spellAt=this.time+C.nova.cooldown;this.events.push({kind:'nova',region:'woods',x:w.x,y:w.y});for(const other of this.wolves.values())if(other.hp>0&&distance(other,w)<=C.nova.radius&&sight(w,other))this.damage(other,C.nova.damage,id);return true;}
 return false;
 }
 shoot(id:string,p:Fighter){const w=this.wolves.get(p.target);if(!w||!w.hp||w.mode==='return'){this.clear(p);return;}if(this.time<p.shotAt||distance(p,w)>C.bolt.range||!sight(p,w))return;p.shotAt=this.time+C.bolt.cooldown;const shot={id:`bolt-${++this.serial}`,owner:id,target:w.id,region:p.region,x:p.x,y:p.y,expires:this.time+2};this.projectiles.set(shot.id,shot);this.events.push({kind:'bolt',region:p.region,x:p.x,y:p.y,toX:w.x,toY:w.y});}
 tick(dt:number,players:Iterable<[string,Fighter]>){this.time+=dt;const actors=new Map(players);
 for(const [id,p] of actors){if(p.hp<=0){if(this.time>=p.deadUntil){p.hp=C.playerHp;p.mana=C.mana;p.region='elderwood';p.x=PORTAL.arrival.x;p.y=PORTAL.arrival.y;this.clear(p);this.events.push({kind:'respawn',region:'elderwood',x:p.x,y:p.y});}continue;}p.mana=Math.min(C.mana,p.mana+dt*5);if(p.region!=='woods'||this.safe(p)){if(p.region==='elderwood')p.hp=Math.min(C.playerHp,p.hp+dt*10);this.clear(p);continue;}if(p.auto)this.shoot(id,p);}
 for(const w of this.wolves.values()){
 if(w.hp<=0){if(this.time>=w.respawnAt){w.hp=C.wolf.hp;w.x=w.spawnX;w.y=w.spawnY;w.mode='idle';w.target='';}continue;}
 const spawn={x:w.spawnX,y:w.spawnY};let victim=actors.get(w.target);
 if(distance(w,spawn)>C.wolf.leash||(w.target&&(!victim||victim.hp<=0||victim.region!=='woods'||this.safe(victim)||distance(victim,spawn)>C.wolf.leash))) {w.mode='return';w.target='';victim=undefined;}
 if(w.mode==='return'){if(distance(w,spawn)<.15){w.x=spawn.x;w.y=spawn.y;w.hp=C.wolf.hp;w.mode='idle';}else this.step(w,spawn,dt);continue;}
 if(!victim){let best=C.wolf.detect;for(const [id,p] of actors){const d=distance(w,p);if(p.hp>0&&p.region==='woods'&&!this.safe(p)&&d<best&&sight(w,p)){best=d;w.target=id;victim=p;}}}
 if(victim){if(distance(w,victim)<=C.wolf.range&&sight(w,victim)){w.mode='attack';if(this.time>=w.attackAt){w.attackAt=this.time+C.wolf.cooldown;victim.hp=Math.max(0,victim.hp-C.wolf.damage);this.events.push({kind:'hit',region:'woods',x:victim.x,y:victim.y,damage:C.wolf.damage});if(!victim.hp){victim.deadUntil=this.time+C.playerRespawn;this.clear(victim);}}}else{w.mode='chase';this.step(w,victim,dt);}}
 else{w.mode='idle';}
 }
 for(const [id,shot] of this.projectiles){const p=actors.get(shot.owner),w=this.wolves.get(shot.target);if(!p||p.hp<=0||p.region!==shot.region||!w||!w.hp||w.mode==='return'||this.time>=shot.expires){this.projectiles.delete(id);continue;}const d=distance(shot,w),step=C.bolt.speed*dt;const next={x:shot.x+(w.x-shot.x)/Math.max(d,.001)*Math.min(d,step),y:shot.y+(w.y-shot.y)/Math.max(d,.001)*Math.min(d,step)};if(!sight(shot,next)){this.projectiles.delete(id);continue;}Object.assign(shot,next);if(d<=step+.2){this.damage(w,C.bolt.damage,shot.owner);this.projectiles.delete(id);}}
 }
 step(w:Wolf,to:Point,dt:number){const route=pathfind(w,to,'woods');const point=route[0]??to;const dx=point.x-w.x,dy=point.y-w.y,d=Math.hypot(dx,dy);if(d<.001)return;const amount=Math.min(d,C.wolf.speed*dt),next={x:w.x+dx/d*amount,y:w.y+dy/d*amount};if(legal(next,'woods')&&legal({x:next.x,y:w.y},'woods')&&legal({x:w.x,y:next.y},'woods')){w.x=next.x;w.y=next.y;w.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}}
}
