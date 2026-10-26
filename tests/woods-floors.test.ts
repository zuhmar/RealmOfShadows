import {gridSpawns,gridMap} from '@realm/game-data';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rootsSpawns,rootsChambers,rootsMap,stairsFor,portalFor,canTravel,islandForRegion,terrainPlan,gearDefinition} from '@realm/game-data';
import {legal,pathfind,CombatSimulation,Economy,newFighter} from '@realm/shared';
test('Root Hollow stairs have legal reachable landings on both floors',()=>{
 for(const s of [...stairsFor('woods'),...stairsFor('woods-depths')]){assert.ok(legal(s.arrival,s.to),s.id);assert.ok(legal({x:s.x,y:s.y+1},s.from),s.id);assert.ok(pathfind(portalFor(s.from).arrival,{x:s.x,y:s.y+1},s.from).length||Math.hypot(portalFor(s.from).arrival.x-s.x,portalFor(s.from).arrival.y-s.y-1)<1.1,s.id);}
 assert.equal(islandForRegion('woods-depths'),'woods');assert.equal(canTravel(portalFor('woods'),'woods','woods-depths'),false);assert.equal(canTravel(portalFor('woods-depths'),'woods-depths','elderwood'),false);
});
test('roots grid spawns, central bridge and all stair landings remain connected',()=>{
 const arrival=portalFor('woods-depths').arrival,map=gridMap('woods-depths');assert.equal(map.width,48);assert.equal(map.height,36);
 for(const target of gridSpawns('woods-depths')){assert.ok(legal(target,'woods-depths'));assert.ok(pathfind(arrival,target,'woods-depths').length);}
 assert.equal(legal({x:22.5,y:21.5},'woods-depths'),false);assert.ok(legal({x:24.5,y:21.5},'woods-depths'));assert.ok(pathfind(arrival,{x:24.5,y:19.5},'woods-depths').length);
});
test('Root Hollow combat is isolated from surface and drops Beginner equipment',()=>{
 const sim=new CombatSimulation(),target=sim.wolves.get('roots-wolf-1')!,p=newFighter();Object.assign(p,{region:'woods',x:target.x,y:target.y});assert.equal(sim.action('p',p,'bolt',target.id),false);p.region='woods-depths';assert.ok(sim.action('p',p,'bolt',target.id));p.auto=false;p.region='woods';const hp=target.hp;sim.tick(.5,[['p',p]]);assert.equal(target.hp,hp);
 const e=new Economy(()=>0);e.join('p');e.process([{id:1,owner:'p',region:'woods-depths',kind:'wolf',x:p.x,y:p.y}],new Map([['p',p]]),0);const drop=[...e.drops.values()][0];assert.equal(gearDefinition(drop.gear!.base).tier,'beginner');assert.match(e.act('p',p,{kind:'pickup',drop:drop.id},0),/closer/);p.region='woods-depths';assert.match(e.act('p',p,{kind:'pickup',drop:drop.id},0),/Collected/);
});
