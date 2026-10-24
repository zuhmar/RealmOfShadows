import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {monsters,monsterSpawns,PORTAL,woodsObjects,woodsGeometry} from '@realm/game-data';
import {CombatSimulation,newFighter,Economy,legal,pathfind} from '@realm/shared';
import {woodsSvgFiles} from '../scripts/build-woods-svg';
test('all four woods habitats connect to the portal and spawn on walkable land',()=>{
 assert.deepEqual([...new Set(monsterSpawns.map(s=>s.kind))],['wolf','spider','boar','bear']);
 for(const spawn of monsterSpawns){assert.equal(legal(spawn,'woods'),true,spawn.id);const route=pathfind(PORTAL.arrival,spawn,'woods');assert.ok(route.length,spawn.id);let prev=PORTAL.arrival;for(const p of route){for(let n=1;n<=10;n++)assert.equal(legal({x:prev.x+(p.x-prev.x)*n/10,y:prev.y+(p.y-prev.y)*n/10},'woods'),true,spawn.id);prev=p;}}
 assert.ok(woodsObjects.length>150);assert.equal(legal({x:1.5,y:10},'woods'),false);assert.equal(legal({x:2.2,y:11.9},'woods'),true);
});
test('each monster attacks, credits its own rewards once, and respawns at full health',()=>{
 for(const kind of Object.keys(monsters) as (keyof typeof monsters)[]){const sim=new CombatSimulation(),spawn=monsterSpawns.find(s=>s.kind===kind)!,w=sim.wolves.get(spawn.id)!,stats=monsters[kind];
 for(const [id]of sim.wolves)if(id!==w.id)sim.wolves.delete(id);
 const p={...newFighter(),region:'woods' as const,x:w.x+.4,y:w.y},economy=new Economy();economy.join('a');economy.join('b');
 sim.tick(.05,[['a',p]]);if(kind!=='wolf'){assert.equal(p.hp,100);assert.equal(w.mode,'windup');sim.tick(kind==='bear'?.86:kind==='boar'?.66:.55,[['a',p]]);}assert.equal(p.hp,100-stats.damage);assert.equal(w.mode,'attack');
 sim.damage(w,stats.hp,'a');sim.damage(w,stats.hp,'a');assert.equal(sim.kills.length,1);economy.process(sim.kills,new Map([['a',p]]),sim.time);economy.process(sim.kills,new Map([['a',p]]),sim.time);
 assert.equal(economy.profiles.get('a')!.xp,stats.xp);assert.equal(economy.profiles.get('b')!.xp,0);assert.equal(economy.drops.size,1);
 economy.act('a',p,{kind:'pickup',drop:[...economy.drops.keys()][0]},sim.time);assert.equal(economy.profiles.get('a')!.gold,stats.gold);assert.equal(economy.drops.size,0);assert.equal(economy.profiles.get('a')!.inventory.length,stats.pelts?1:0);
 sim.tick(stats.respawn-.1,[]);assert.equal(w.hp,0);sim.tick(.11,[]);assert.equal(w.hp,stats.hp);assert.equal(w.mode,'idle');assert.equal(w.x,spawn.x);
 }
});
test('woods SVGs are reproducible vectors and include shared bridges and separate portal',()=>{
 for(const [name,content]of Object.entries(woodsSvgFiles())){assert.equal(readFileSync(new URL('../assets/maps/whispering-woods/svg/'+name,import.meta.url),'utf8'),content);assert.ok(!content.includes('<image'));}
 assert.equal(woodsGeometry.bridges.length,2);assert.equal(woodsObjects.filter(o=>o.key==='woods-portal').length,1);
});
test('bear slam hits nearby opponents, respects armor and never reaches portal sanctuary',()=>{
 const sim=new CombatSimulation(),w=sim.wolves.get('bear-1')!;
 for(const [id]of sim.wolves)if(id!==w.id)sim.wolves.delete(id);
 const a={...newFighter(),region:'woods' as const,x:w.x+.5,y:w.y},b={...newFighter(),region:'woods' as const,x:w.x-.5,y:w.y,armor:5},safe={...newFighter(),region:'woods' as const,x:16.5,y:16.9};
 sim.tick(.05,[['a',a],['b',b],['safe',safe]]);assert.equal(a.hp,100);assert.equal(sim.events.filter(e=>e.kind==='warning').length,1);sim.tick(.86,[['a',a],['b',b],['safe',safe]]);assert.equal(a.hp,75);assert.equal(b.hp,80);assert.equal(safe.hp,100);assert.equal(sim.events.filter(e=>e.kind==='nova').length,1);
 sim.tick(.05,[['a',a],['b',b],['safe',safe]]);assert.equal(a.hp,75);assert.equal(b.hp,80);
});
test('warned spider shots and boar charges aim at a fixed point and can be dodged',()=>{
 for(const kind of ['spider','boar'] as const){const sim=new CombatSimulation(),w=[...sim.wolves.values()].find(w=>w.kind===kind)!;for(const [id]of sim.wolves)if(id!==w.id)sim.wolves.delete(id);
 const p={...newFighter(),region:'woods' as const,x:w.x+.5,y:w.y};sim.tick(.05,[['a',p]]);assert.equal(w.mode,'windup');assert.equal(p.hp,100);const warning=sim.events.find(e=>e.kind==='warning')!;assert.equal(warning.toX,p.x);assert.equal(warning.toY,p.y);
 p.y+=1.5;for(let i=0;i<20;i++)sim.tick(.05,[['a',p]]);assert.equal(p.hp,100);assert.ok(sim.events.some(e=>e.kind===(kind==='spider'?'venom':'charge')));
 }
});
test('returning to the portal cancels monster windups',()=>{
 const sim=new CombatSimulation(),w=sim.wolves.get('bear-1')!;const p={...newFighter(),region:'woods' as const,x:w.x+.4,y:w.y};sim.tick(.05,[['a',p]]);assert.equal(w.mode,'windup');p.x=PORTAL.x;p.y=PORTAL.y;sim.tick(1,[['a',p]]);assert.equal(p.hp,100);assert.equal(w.windupUntil,0);assert.equal(w.mode,'idle');assert.equal(sim.events.filter(e=>e.kind==='nova').length,0);
});
