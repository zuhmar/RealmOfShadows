import test from 'node:test';
import assert from 'node:assert/strict';
import {merchant,gridSpawns,monsters,portalFor} from '@realm/game-data';
import {CombatSimulation,newFighter,Economy,legal,pathfind,attackPath,sight} from '@realm/shared';
import {writeProgress,readProgress} from '../packages/shared/src/saves';

const cavernsSpawns=gridSpawns('caverns'),cavernsPortal=portalFor('caverns');
test('every cave chamber and all 28 encounters connect to a safe portal through legal routes',()=>{
 assert.equal(cavernsSpawns.length,28);assert.equal(legal(cavernsPortal.arrival,'caverns'),true);
 for(const target of [...cavernsSpawns,...[{id:'crossing',x:32.5,y:22.5},{id:'vault',x:50.5,y:10.5}]]){assert.equal(legal(target,'caverns'),true,target.id);const route=pathfind(cavernsPortal.arrival,target,'caverns');assert.ok(route.length,target.id);let previous=cavernsPortal.arrival;for(const p of route){for(let i=1;i<=4;i++)assert.equal(legal({x:previous.x+(p.x-previous.x)*i/4,y:previous.y+(p.y-previous.y)*i/4},'caverns'),true,target.id);previous=p;}}
 for(const s of cavernsSpawns)assert.ok(Math.hypot(s.x-cavernsPortal.x,s.y-cavernsPortal.y)>3.5,s.id);
});
test('lake banks block movement while the mine bridge and boss entrance remain open',()=>{
 assert.equal(legal({x:30.5,y:28.5},'caverns'),false);assert.ok(legal({x:32.5,y:28.5},'caverns'));
 assert.equal(sight({x:30.5,y:27.5},{x:30.5,y:30.5},'caverns'),false);
 const boss=cavernsSpawns.find(s=>s.kind==='wyrm')!,route=attackPath({x:50.5,y:19.5},boss,6,'caverns');assert.ok(route.length);assert.ok(sight(route.at(-1)!,boss,'caverns'));
});
test('cave monsters attack, grant their own rewards once, and respawn in their island',()=>{
 for(const kind of ['bat','crawler','golem','wyrm'] as const){const sim=new CombatSimulation(),s=cavernsSpawns.find(s=>s.kind===kind)!,monster=sim.wolves.get(s.id)!,p={...newFighter(),region:'caverns' as const,x:s.x+.8,y:s.y};for(const [id]of sim.wolves)if(id!==s.id)sim.wolves.delete(id);
  for(let i=0;i<80;i++)sim.tick(.05,[['p',p]]);assert.ok(p.hp<100,kind);assert.ok(sim.events.some(e=>e.region==='caverns'),kind);
  const economy=new Economy();economy.join('p');sim.damage(monster,10000,'p');economy.process(sim.kills,new Map([['p',p]]),sim.time);economy.process(sim.kills,new Map([['p',p]]),sim.time);assert.equal(economy.profiles.get('p')!.xp,monsters[kind].xp);const drop=[...economy.drops.values()][0];assert.equal(drop.region,'caverns');assert.equal(drop.shards,monsters[kind].shards);
  sim.tick(monsters[kind].respawn+.1,[]);assert.equal(monster.hp,monsters[kind].hp);assert.equal(monster.region,'caverns');assert.equal(monster.x,s.x);
 }
});
test('cross-island targeting and loot are rejected, and crystal shards can be collected and sold',()=>{
 const sim=new CombatSimulation(),s=cavernsSpawns[0],p={...newFighter(),x:s.x+.5,y:s.y};assert.equal(sim.action('p',p,'bolt',s.id),false);assert.equal(sim.castSpell('p',p,'spark',s.id,{classId:'citizen',level:1,learnedSpells:['spark']}),false);assert.equal(p.mana,100);
 p.region='caverns';assert.equal(sim.action('p',p,'bolt','wolf-1'),false);assert.equal(sim.action('p',p,'bolt',s.id),true);
 const economy=new Economy();economy.join('p');sim.damage(sim.wolves.get(s.id)!,10000,'p');economy.process(sim.kills,new Map([['p',p]]),0);const drop=[...economy.drops.values()][0];p.region='woods';economy.act('p',p,{kind:'pickup',drop:drop.id},0);assert.equal(economy.drops.size,1);p.region='caverns';economy.act('p',p,{kind:'pickup',drop:drop.id},0);assert.equal(economy.drops.size,0);assert.equal(economy.profiles.get('p')!.inventory[0].item,'crystalShard');
 assert.equal(readProgress(writeProgress(economy.profiles.get('p')!,0)).profile.inventory[0].item,'crystalShard');
 p.region='elderwood';p.x=merchant.x;p.y=merchant.y;assert.match(economy.act('p',p,{kind:'sell'},0),/Sold/);assert.equal(economy.profiles.get('p')!.gold,monsters.bat.gold+8);
});
test('cave sanctuary and island travel cancel pursuit and incoming damage',()=>{
 const sim=new CombatSimulation(),s=cavernsSpawns.find(s=>s.kind==='wyrm')!,w=sim.wolves.get(s.id)!,p={...newFighter(),region:'caverns' as const,x:s.x+2,y:s.y};sim.wolves.clear();sim.wolves.set(w.id,w);sim.tick(.05,[['p',p]]);assert.equal(w.mode,'windup');Object.assign(p,{region:'elderwood',...portalFor('elderwood').arrival});for(let i=0;i<60;i++)sim.tick(.05,[['p',p]]);assert.equal(p.hp,100);assert.equal(w.target,'');
 const guest={...newFighter(),region:'caverns' as const,...cavernsPortal.arrival};for(let i=0;i<60;i++)sim.tick(.05,[['guest',guest]]);assert.equal(guest.hp,100);
 Object.assign(p,{region:'caverns',x:s.x+2,y:s.y,hp:100});for(let i=0;i<40&&!sim.enemyShots.length;i++)sim.tick(.05,[['p',p]]);assert.ok(sim.enemyShots.length);Object.assign(p,{region:'elderwood'});sim.tick(.5,[['p',p]]);assert.equal(p.hp,100,'an already launched breath cannot hit a player in another island');
});
