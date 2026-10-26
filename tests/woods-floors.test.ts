import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rootsSpawns,rootsChambers,rootsMap,stairsFor,portalFor,canTravel,islandForRegion,terrainPlan,gearDefinition} from '@realm/game-data';
import {legal,pathfind,CombatSimulation,Economy,newFighter} from '@realm/shared';
test('Root Hollow stairs have legal reachable landings on both floors',()=>{
 for(const s of [...stairsFor('woods'),...stairsFor('woods-depths')]){assert.ok(legal(s.arrival,s.to),s.id);assert.ok(legal({x:s.x,y:s.y+1.8},s.from),s.id);assert.ok(pathfind(portalFor(s.from).arrival,{x:s.x,y:s.y+1.8},s.from).length,s.id);}
 assert.equal(islandForRegion('woods-depths'),'woods');assert.equal(canTravel(portalFor('woods'),'woods','woods-depths'),false);assert.equal(canTravel(portalFor('woods-depths'),'woods-depths','elderwood'),false);
});
test('Root Hollow chambers and encounters are reachable; pool banks block movement and bridge permits it',()=>{
 const arrival=stairsFor('woods')[0].arrival,plan=terrainPlan('woods-depths');assert.equal(plan.columns,rootsMap.width/24);assert.equal(plan.rows,rootsMap.height/24);assert.equal(plan.layers.length,5);
 for(const target of [...rootsSpawns,...rootsChambers.map(c=>({x:c.x/48,y:c.y/48}))]){assert.ok(legal(target,'woods-depths'),JSON.stringify(target));assert.ok(pathfind(arrival,target,'woods-depths').length,JSON.stringify(target));}
 assert.equal(legal({x:1000/48,y:950/48},'woods-depths'),false);assert.equal(legal({x:1152/48,y:950/48},'woods-depths'),true);
});
test('Root Hollow combat is isolated from surface and drops Beginner equipment',()=>{
 const sim=new CombatSimulation(),target=sim.wolves.get('roots-wolf-1')!,p=newFighter();Object.assign(p,{region:'woods',x:target.x,y:target.y});assert.equal(sim.action('p',p,'bolt',target.id),false);p.region='woods-depths';assert.ok(sim.action('p',p,'bolt',target.id));p.auto=false;p.region='woods';const hp=target.hp;sim.tick(.5,[['p',p]]);assert.equal(target.hp,hp);
 const e=new Economy(()=>0);e.join('p');e.process([{id:1,owner:'p',region:'woods-depths',kind:'wolf',x:p.x,y:p.y}],new Map([['p',p]]),0);const drop=[...e.drops.values()][0];assert.equal(gearDefinition(drop.gear!.base).tier,'beginner');assert.match(e.act('p',p,{kind:'pickup',drop:drop.id},0),/closer/);p.region='woods-depths';assert.match(e.act('p',p,{kind:'pickup',drop:drop.id},0),/Collected/);
});
