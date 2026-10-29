import {gridCrossesWall,gridCell,gridKey,gridDirections,newAttributes,attributeDamage,maxHealth,maxMana,shieldBlock,type Attributes,combat as C,monsters,monsterAggressive,monsterKind,allMonsterSpawns,combatRegion,monsterRegion,type MonsterKind,PORTAL,portalFor,weapons,weaponDamage,skillRules,spells,isSpell,canLearnSpell,skillLevel,type SpellAccess,type SpellId,type WeaponId,type SkillId,type RegionId,type Facing} from '@realm/game-data';
import {legal,pathfind,move,occupiedCells,freeLanding,type Point} from './index';
export interface Fighter extends Point{stepX?:number;stepY?:number;attributes:Attributes;weaponBonus:number;shieldArmor:number;shieldingXp:number;armor:number;weapon:WeaponId;meleeXp:number;distanceXp:number;magicXp:number;region:RegionId;hp:number;mana:number;deadUntil:number;shotAt:number;spellAt:number;target:string;auto:boolean}
// Retain the existing Wolf/wolves API and wire collection for compatibility;
// kind and region select the definition and its encounter island.
export interface Wolf extends Point{stepX?:number;stepY?:number;region?:RegionId;kind:MonsterKind;id:string;hp:number;mode:string;facing:Facing;target:string;attackAt:number;respawnAt:number;spawnX:number;spawnY:number;windupUntil:number;aimX:number;aimY:number}
export interface Kill {region?:RegionId;kind?:MonsterKind;id:number;owner:string;x:number;y:number}
export interface Projectile extends Point{id:string;owner:string;target:string;region:RegionId;expires:number;weapon:WeaponId;damage:number;speed:number;skill:SkillId}
export interface CombatEvent{kind:'bolt'|'arrow'|'melee'|'nova'|'hit'|'death'|'respawn'|'heal'|'warning'|'venom'|'charge'|'shard'|'block';region:RegionId;x:number;y:number;toX?:number;toY?:number;damage?:number;speed?:number;radius?:number}
export function newFighter():Fighter{return {attributes:newAttributes(),weaponBonus:0,shieldArmor:0,shieldingXp:0,armor:0,weapon:'wand',meleeXp:0,distanceXp:0,magicXp:0,x:16.5,y:14.5,region:'elderwood',hp:C.playerHp,mana:C.mana,deadUntil:0,shotAt:0,spellAt:0,target:'',auto:false};}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const inRange=(a:Point,b:Point,range:number)=>range<=1.5?Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=range+.01:distance(a,b)<=range;
const attack=(kind:MonsterKind)=>{
 if(kind==='bear'||kind==='golem')return {kind:'slam',range:monsters[kind].range,windup:kind==='bear'?.85:1,radius:kind==='bear'?1.8:1.9};
 if(kind==='boar'||kind==='crawler')return {kind:'charge',range:kind==='boar'?3:2.7,windup:kind==='boar'?.65:.55,radius:.65};
 if(kind==='spider'||kind==='wyrm')return {kind:kind==='spider'?'venom':'shard',range:kind==='spider'?3.2:4.5,windup:kind==='spider'?.45:1.1,radius:kind==='spider'?.6:1.2};
 return {kind:'bite',range:monsters[kind].range,windup:0,radius:.5};
};
export function sight(a:Point & {region?:RegionId},b:Point & {region?:RegionId},region:RegionId=a.region??b.region??'woods'):boolean{if(a.region&&b.region&&a.region!==b.region)return false;if(gridCrossesWall(region,a,b))return false;const n=Math.ceil(distance(a,b)*8);for(let i=0;i<=n;i++){if(!legal({x:a.x+(b.x-a.x)*i/Math.max(1,n),y:a.y+(b.y-a.y)*i/Math.max(1,n)},region))return false;}return true;}
export class CombatSimulation{
 enemyShots:{region:RegionId;radius:number;x:number;y:number;toX:number;toY:number;remaining:number;damage:number}[]=[];
 private actors=new Map<string,Fighter>();
 spellCooldowns=new Map<string,Partial<Record<SpellId,number>>>();
 kills:Kill[]=[];time=0;serial=0;wolves=new Map<string,Wolf>();projectiles=new Map<string,Projectile>();events:CombatEvent[]=[];
 constructor(){for(const s of allMonsterSpawns)this.wolves.set(s.id,{...s,hp:monsters[s.kind].hp,mode:'idle',facing:'down',target:'',attackAt:0,respawnAt:0,spawnX:s.x,spawnY:s.y,windupUntil:0,aimX:s.x,aimY:s.y});}
 safe(p:Point & {region?:RegionId}){if(p.region==='woods-upper')return false;return distance(p,portalFor(p.region??'woods'))<C.portalSafeRadius;}
 clear(p:Fighter){p.target='';p.auto=false;}
 damage(w:Wolf,amount:number,attacker?:string){const stats=monsters[monsterKind(w.kind)];if(w.hp<=0||w.mode==='return')return;w.hp=Math.max(0,w.hp-amount);if(w.hp>0&&attacker){w.target=attacker;if(w.mode==='idle')w.mode='chase';}this.events.push({kind:'hit',region:monsterRegion(w),x:w.x,y:w.y,damage:amount});if(!w.hp){if(attacker)this.kills.push({id:++this.serial,owner:attacker,region:monsterRegion(w),kind:w.kind,x:w.x,y:w.y});w.mode='dead';w.target='';w.windupUntil=0;w.respawnAt=this.time+stats.respawn;this.events.push({kind:'death',region:monsterRegion(w),x:w.x,y:w.y});}}
 action(id:string,p:Fighter,kind:unknown,target:unknown):boolean{
 if(kind==='stop'){this.clear(p);return true;}
 if(p.hp<=0||!combatRegion(p.region))return false;
 if(typeof target!=='string')return false;const w=this.wolves.get(target);if(!w||monsterRegion(w)!==p.region||w.hp<=0||w.mode==='return')return false;
 if(kind==='bolt'){p.target=target;p.auto=true;if(!this.safe(p))this.shoot(id,p);return true;}
 return false;
 }
 castSpell(id:string,p:Fighter,spell:unknown,target:unknown,access?:SpellAccess):boolean{
 if(!isSpell(spell)||!access||!access.learnedSpells.includes(spell)||!canLearnSpell(spell,access)||p.hp<=0)return false;
 const s=spells[spell],ready=this.spellCooldowns.get(id)??{};
 if(this.time<(ready[spell]??0)||p.mana<s.cost)return false;
 const w=typeof target==='string'?this.wolves.get(target):undefined;
 if(s.effect==='heal'){if(p.hp>=maxHealth(p.attributes))return false;}
 else if(!combatRegion(p.region)||this.safe(p)||!w||monsterRegion(w)!==p.region||w.hp<=0||w.mode==='return'||distance(p,w)>s.range||!sight(p,w))return false;
 p.mana-=s.cost;ready[spell]=this.time+s.cooldown;this.spellCooldowns.set(id,ready);
 if(s.effect==='heal'){const restored=Math.min(maxHealth(p.attributes)-p.hp,s.power);p.hp+=restored;this.events.push({kind:'heal',region:p.region,x:p.x,y:p.y,damage:restored});return true;}
 if(!w)return false;
 const damage=Math.max(1,Math.floor(s.power+.6*skillLevel(p[`${s.skill}Xp`])+attributeDamage(p.attributes,s.skill)-2));
 this.events.push({kind:s.effect,region:p.region,x:s.effect==='bolt'||s.effect==='arrow'?p.x:w.x,y:s.effect==='bolt'||s.effect==='arrow'?p.y:w.y,toX:w.x,toY:w.y,speed:10,radius:s.radius});
 if(s.effect==='bolt'||s.effect==='arrow'){const shot={id:`spell-${++this.serial}`,owner:id,target:w.id,region:p.region,x:p.x,y:p.y,expires:this.time+2,weapon:p.weapon,damage,speed:10,skill:s.skill};this.projectiles.set(shot.id,shot);}
 else for(const other of this.wolves.values())if(monsterRegion(other)===p.region&&(other===w||(s.radius>0&&distance(other,w)<=s.radius&&sight(w,other))))this.hit(other,damage,id,p,s.skill);
 return true;
 }
 hit(w:Wolf,amount:number,id:string,p:Fighter,skill:SkillId,xp=skillRules.hitXp){if(w.hp<=0||w.mode==='return')return;const actual=Math.min(w.hp,amount);this.damage(w,amount,id);if(actual>0)p[`${skill}Xp`]=Math.min(skillRules.factor*(skillRules.cap-1)**2,p[`${skill}Xp`]+xp);}
 shoot(id:string,p:Fighter){const w=this.wolves.get(p.target);if(!w||monsterRegion(w)!==p.region||!w.hp||w.mode==='return'){this.clear(p);return;}const weapon=weapons[p.weapon];if(this.time<p.shotAt||!inRange(p,w,weapon.range)||!sight(p,w))return;p.shotAt=this.time+weapon.cooldown;const amount=weaponDamage(p.weapon,p[`${weapon.skill}Xp`],1,attributeDamage(p.attributes,weapon.skill)+p.weaponBonus);
 if(weapon.kind==='melee'){this.events.push({kind:'melee',region:p.region,x:w.x,y:w.y});this.hit(w,amount,id,p,weapon.skill);return;}
 const shot={id:`bolt-${++this.serial}`,owner:id,target:w.id,region:p.region,x:p.x,y:p.y,expires:this.time+2,weapon:p.weapon,damage:amount,speed:weapon.speed,skill:weapon.skill};this.projectiles.set(shot.id,shot);this.events.push({kind:weapon.kind,region:p.region,x:p.x,y:p.y,toX:w.x,toY:w.y,speed:weapon.speed});}

 tick(dt:number,players:Iterable<[string,Fighter]>){this.time+=dt;const actors=new Map(players);this.actors=actors;
 for(const [id,p] of actors){if(p.hp<=0){if(this.time>=p.deadUntil){p.hp=maxHealth(p.attributes);p.mana=maxMana(p.attributes);p.region='elderwood';p.x=PORTAL.arrival.x;p.y=PORTAL.arrival.y;Object.assign(p,freeLanding(p,p.region,occupiedCells(actors.values(),p.region,p)));p.stepX=p.x;p.stepY=p.y;this.clear(p);this.events.push({kind:'respawn',region:'elderwood',x:p.x,y:p.y});}continue;}p.mana=Math.min(maxMana(p.attributes),p.mana+dt*5);if(!combatRegion(p.region)||this.safe(p)){if(p.region==='elderwood'||p.region==='elderwood-upper')p.hp=Math.min(maxHealth(p.attributes),p.hp+dt*10);if(!combatRegion(p.region))this.clear(p);continue;}if(p.auto)this.shoot(id,p);}
 for(const w of this.wolves.values()){
 const stats=monsters[monsterKind(w.kind)];
 if(w.hp<=0){if(this.time>=w.respawnAt&&!occupiedCells([...actors.values(),...this.wolves.values()],monsterRegion(w),w).has(gridKey({x:w.spawnX,y:w.spawnY}))){w.stepX=w.spawnX;w.stepY=w.spawnY;w.hp=stats.hp;w.x=w.spawnX;w.y=w.spawnY;w.mode='idle';w.target='';w.windupUntil=0;}continue;}
 const spawn={x:w.spawnX,y:w.spawnY};let victim=actors.get(w.target);
 if(distance(w,spawn)>stats.leash||(w.target&&(!victim||victim.hp<=0||victim.region!==monsterRegion(w)||this.safe(victim)||distance(victim,spawn)>stats.leash))) {w.mode='return';w.target='';w.windupUntil=0;victim=undefined;}
 if(w.mode==='return'){if(distance(w,spawn)<.15){w.x=spawn.x;w.y=spawn.y;w.hp=stats.hp;w.mode='idle';}else this.step(w,spawn,dt);continue;}
 if(!victim&&monsterAggressive(monsterKind(w.kind))){let best:number=stats.detect;for(const [id,p] of actors){const d=distance(w,p);if(p.hp>0&&p.region===monsterRegion(w)&&!this.safe(p)&&d<best&&sight(w,p)){best=d;w.target=id;victim=p;}}}
 if(victim){
 const pattern=attack(w.kind),range=pattern.range;
 if(w.windupUntil){
  w.mode='windup';
  if(this.time>=w.windupUntil){
   w.windupUntil=0;w.mode='attack';w.attackAt=this.time+stats.cooldown;
   if(pattern.kind==='slam'){
    this.events.push({kind:'nova',region:monsterRegion(w),x:w.aimX,y:w.aimY,radius:pattern.radius});
    for(const actor of actors.values())if(actor.hp>0&&actor.region===monsterRegion(w)&&!this.safe(actor)&&distance(actor,{x:w.aimX,y:w.aimY})<=pattern.radius&&sight(w,actor))this.strike(actor,stats.damage);
   }else if(pattern.kind==='venom'||pattern.kind==='shard'){
    this.events.push({kind:pattern.kind,region:monsterRegion(w),x:w.x,y:w.y,toX:w.aimX,toY:w.aimY,speed:7});
    this.enemyShots.push({region:monsterRegion(w),radius:pattern.radius,x:w.x,y:w.y,toX:w.aimX,toY:w.aimY,remaining:distance(w,{x:w.aimX,y:w.aimY})/7+.05,damage:stats.damage});
   }else if(pattern.kind==='charge'){
    // Charge follows the warned line in collision-tested substeps and can be dodged.
    this.events.push({kind:'charge',region:monsterRegion(w),x:w.x,y:w.y,toX:w.aimX,toY:w.aimY});
    const start=gridCell(w),end=gridCell({x:w.aimX,y:w.aimY}),length=Math.max(Math.abs(end.x-start.x),Math.abs(end.y-start.y));
    const occupied=occupiedCells([...actors.values(),...this.wolves.values()],monsterRegion(w),w);
    for(let i=1;i<=length;i++){const next={x:start.x+Math.round((end.x-start.x)*i/length),y:start.y+Math.round((end.y-start.y)*i/length)};
     if(gridCrossesWall(monsterRegion(w),w,next)||!legal(next,monsterRegion(w))||occupied.has(gridKey(next))||!legal({x:next.x,y:w.y},monsterRegion(w))||!legal({x:w.x,y:next.y},monsterRegion(w)))break;w.x=next.x;w.y=next.y;}
    w.stepX=w.x;w.stepY=w.y;
    for(const actor of actors.values())if(actor.hp>0&&actor.region===monsterRegion(w)&&!this.safe(actor)&&distance(actor,{x:w.aimX,y:w.aimY})<.8&&inRange(w,actor,1.5)&&sight(w,actor))this.strike(actor,stats.damage);
   }
  }
 }else if(inRange(w,victim,range)&&sight(w,victim)&&this.atCenter(w)){
  w.mode='attack';
  if(this.time>=w.attackAt){
   if(pattern.kind==='bite'){w.attackAt=this.time+stats.cooldown;this.strike(victim,stats.damage);}
   else{const dx=victim.x-w.x,dy=victim.y-w.y;w.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');w.mode='windup';w.aimX=pattern.kind==='slam'?w.x:victim.x;w.aimY=pattern.kind==='slam'?w.y:victim.y;w.windupUntil=this.time+pattern.windup;
    this.events.push({kind:'warning',region:monsterRegion(w),x:w.x,y:w.y,toX:w.aimX,toY:w.aimY,radius:pattern.radius,speed:w.windupUntil-this.time});}
  }
 }else{w.mode='chase';this.step(w,victim,dt);}
 }
 else{w.mode='idle';}
 }
 for(const shot of this.enemyShots)shot.remaining-=dt;
 for(const shot of this.enemyShots.filter(s=>s.remaining<=0)){for(const actor of actors.values())if(actor.hp>0&&actor.region===shot.region&&!this.safe(actor)&&distance(actor,{x:shot.toX,y:shot.toY})<=shot.radius&&sight(shot,actor,shot.region))this.strike(actor,shot.damage,false);}
 this.enemyShots=this.enemyShots.filter(s=>s.remaining>0);
 for(const [id,shot] of this.projectiles){const p=actors.get(shot.owner),w=this.wolves.get(shot.target);if(!p||p.hp<=0||p.region!==shot.region||!w||monsterRegion(w)!==shot.region||!w.hp||w.mode==='return'||this.time>=shot.expires){this.projectiles.delete(id);continue;}const d=distance(shot,w),step=shot.speed*dt;const next={x:shot.x+(w.x-shot.x)/Math.max(d,.001)*Math.min(d,step),y:shot.y+(w.y-shot.y)/Math.max(d,.001)*Math.min(d,step)};if(!sight(shot,next,shot.region)){this.projectiles.delete(id);continue;}Object.assign(shot,next);if(d<=step+.2){this.hit(w,shot.damage,shot.owner,p,shot.skill);this.projectiles.delete(id);}}
 }
 strike(actor:Fighter,power:number,physical=true){if(actor.hp<=0)return;const incoming=Math.max(1,power-actor.armor),blocked=physical?shieldBlock(incoming,actor.shieldArmor,actor.shieldingXp):0,damage=incoming-blocked;
 if(blocked>0){actor.shieldingXp=Math.min(skillRules.factor*(skillRules.cap-1)**2,actor.shieldingXp+skillRules.hitXp);this.events.push({kind:'block',region:actor.region,x:actor.x,y:actor.y,damage:blocked});}
 actor.hp=Math.max(0,actor.hp-damage);this.events.push({kind:'hit',region:actor.region,x:actor.x,y:actor.y,damage});if(!actor.hp){actor.deadUntil=this.time+C.playerRespawn;this.clear(actor);}}

 atCenter(w:Wolf){return Math.abs(w.x-(Math.floor(w.x)+.5))<.00001&&Math.abs(w.y-(Math.floor(w.y)+.5))<.00001;}
 step(w:Wolf,to:Point,dt:number){
  const region=monsterRegion(w),occupied=occupiedCells([...this.actors.values(),...this.wolves.values()],region,w);
  let target:Point|undefined;
  if(!this.atCenter(w)&&w.stepX!==undefined&&w.stepY!==undefined){target={x:w.stepX,y:w.stepY};}
  else{
   const center=gridCell(to),goals=w.target?gridDirections.map(([dx,dy])=>({x:center.x+dx,y:center.y+dy})):[center];
   goals.sort((a,b)=>distance(w,a)-distance(w,b));
   for(const goal of goals){if(occupied.has(gridKey(goal)))continue;const route=pathfind(w,goal,region,occupied);if(route.length){target=route[0];break;}}
  }
  if(!target)return;const dx=target.x-w.x,dy=target.y-w.y;
  const next=move({...w,stamina:100},{x:dx,y:dy,sprint:false,seq:0},dt*monsters[monsterKind(w.kind)].speed/4,region,occupied);
  w.x=next.x;w.y=next.y;w.stepX=next.stepX;w.stepY=next.stepY;
  if(dx||dy)w.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
 }
}
