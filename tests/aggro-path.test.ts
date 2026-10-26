const PORTAL=portalFor('woods');
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CombatSimulation,newFighter,attackPath,inAttackRange,legal,sight} from '@realm/shared';
import {monsterSpawns,weapons,portalFor,woodsMap} from '@realm/game-data';
test('normal monsters ignore passersby, retaliate against their attacker and reset on return',()=>{
 for(const kind of ['wolf','spider'] as const){const sim=new CombatSimulation(),w=[...sim.wolves.values()].find(w=>w.kind===kind)!;sim.wolves.clear();sim.wolves.set(w.id,w);const p:ReturnType<typeof newFighter>={...newFighter(),region:'woods' as const,x:w.x+.5,y:w.y};
 for(let i=0;i<20;i++)sim.tick(.05,[['p',p]]);assert.equal(p.hp,100);assert.equal(w.mode,'idle');assert.equal(w.target,'');
 sim.damage(w,1,'p');for(let i=0;i<20;i++)sim.tick(.05,[['p',p]]);assert.equal(w.target,'p');assert.ok(p.hp<100);
 p.region='elderwood';for(let i=0;i<100;i++)sim.tick(.05,[['p',p]]);assert.equal(w.target,'');assert.equal(w.mode,'idle');}
});
test('high level boars and the boss acquire nearby players without being hit',()=>{
 for(const kind of ['boar','bear'] as const){const sim=new CombatSimulation(),w=[...sim.wolves.values()].find(w=>w.kind===kind)!;const p:ReturnType<typeof newFighter>={...newFighter(),region:'woods' as const,x:w.x+.5,y:w.y};sim.tick(.05,[['p',p]]);assert.equal(w.target,'p');assert.equal(w.mode,'windup');}
});
test('approach paths stop in clear weapon range outside sanctuary for melee and distance weapons',()=>{
 const target=monsterSpawns[0];for(const id of ['dagger','sword','bow','wand'] as const){const range=weapons[id].range,route=attackPath(PORTAL.arrival,target,range),last=route.at(-1)!;assert.ok(last,id);assert.ok(inAttackRange(last,target,range),id);assert.ok(sight(last,target));assert.ok(Math.hypot(last.x-PORTAL.x,last.y-PORTAL.y)>3.5);for(const p of route)assert.ok(legal(p,'woods'));}
 assert.ok(woodsMap.width*woodsMap.height>=2304*1536*1.99);
});
