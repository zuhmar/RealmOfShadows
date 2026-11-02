import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CombatSimulation,newFighter,legal} from '@realm/shared';
import {monsterRegion,monsters,gridKey,stairsFor} from '@realm/game-data';

test('idle monsters stroll, pause, and stay on legal cells near their authored spawn',()=>{
 const sim=new CombatSimulation(),moved=new Set<string>(),paused=new Set<string>();
 for(let i=0;i<600;i++){
  sim.tick(.1,[]);
  for(const w of sim.wolves.values()){
   assert.ok(legal(w,monsterRegion(w)),w.id);
   assert.ok(Math.hypot(w.x-w.spawnX,w.y-w.spawnY)<=(monsters[w.kind].boss?1:2)+.01,w.id);
   assert.equal(w.target,'');
   if(w.mode==='wander')moved.add(w.id);
   if(moved.has(w.id)&&w.mode==='idle')paused.add(w.id);
   if(w.mode==='wander')assert.ok(stairsFor(monsterRegion(w)).every(s=>Math.hypot(w.stepX!-s.x,w.stepY!-s.y)>=1.5),w.id);
  }
 }
 assert.ok(moved.size>sim.wolves.size*.8,`${moved.size}/${sim.wolves.size} roam`);
 assert.ok(paused.size>sim.wolves.size*.8,'monsters pause between steps');
});

test('passive wandering monsters ignore players but retaliate and respawn at home',()=>{
 const sim=new CombatSimulation(),w=sim.wolves.get('wolf-1')!;
 sim.wolves.clear();sim.wolves.set(w.id,w);
 const p={...newFighter(),region:monsterRegion(w),x:w.x+1,y:w.y};
 for(let i=0;i<150;i++)sim.tick(.1,[['p',p]]);
 assert.equal(p.hp,100);assert.equal(w.target,'');
 sim.damage(w,1,'p');assert.equal(w.target,'p');assert.equal(w.mode,'chase');
 sim.damage(w,9999,'p');assert.equal(w.mode,'dead');
 sim.tick(monsters[w.kind].respawn+.1,[]);
 assert.deepEqual([w.x,w.y,w.mode],[w.spawnX,w.spawnY,'idle']);
 sim.tick(.1,[]);assert.equal(w.mode,'idle');
});

test('wandering respects occupied cells and is deterministic',()=>{
 const a=new CombatSimulation(),b=new CombatSimulation();
 const w=a.wolves.get('wolf-1')!,v=b.wolves.get('wolf-1')!;
 a.wolves.clear();a.wolves.set(w.id,w);b.wolves.clear();b.wolves.set(v.id,v);
 const blockers=Array.from({length:9},(_,i)=>({...newFighter(),region:monsterRegion(w),x:w.x+i%3-1,y:w.y+Math.floor(i/3)-1})).filter(p=>gridKey(p)!==gridKey(w));
 for(let i=0;i<150;i++)a.tick(.1,blockers.map((p,i)=>[String(i),p]));
 assert.deepEqual([w.x,w.y,w.mode],[w.spawnX,w.spawnY,'idle']);
 // Once freed, both simulations follow the same deterministic schedule.
 const c=new CombatSimulation();c.wolves.clear();const u={...v};c.wolves.set(u.id,u);
 for(let i=0;i<300;i++){b.tick(.1,[]);c.tick(.1,[]);assert.deepEqual([v.x,v.y,v.mode],[u.x,u.y,u.mode]);}
});
