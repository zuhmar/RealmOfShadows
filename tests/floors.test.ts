import {gridSpawns,gridMap} from '@realm/game-data';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CombatSimulation,Economy,newFighter,pathfind,legal} from '@realm/shared';
import {depthsSpawns,depthsChambers,floorConnections,availableStair,canTravel,portalFor,monsterRegion,terrainPlan,gearDefinition} from '@realm/game-data';
test('both stairs connect legal landings and require the right floor and proximity',()=>{
 for(const s of floorConnections){assert.ok(legal(s.arrival,s.to));assert.equal(availableStair(s,s.from,s.id),s);assert.equal(availableStair({x:1,y:1},s.from,s.id),undefined);assert.equal(availableStair(s,s.to,s.id),undefined);assert.equal(availableStair(s,s.from,'__proto__'),undefined);}
 assert.equal(canTravel(portalFor('caverns'),'caverns','caverns-depths'),false);assert.equal(canTravel(portalFor('caverns-depths'),'caverns-depths','elderwood'),false);
});
test('depths grid spawns, central bridge and all stair landings remain connected',()=>{
 const arrival=portalFor('caverns-depths').arrival,map=gridMap('caverns-depths');assert.equal(map.width,48);assert.equal(map.height,36);
 for(const target of gridSpawns('caverns-depths')){assert.ok(legal(target,'caverns-depths'));assert.ok(pathfind(arrival,target,'caverns-depths').length);}
 assert.equal(legal({x:22.5,y:21.5},'caverns-depths'),false);assert.ok(legal({x:24.5,y:21.5},'caverns-depths'));assert.ok(pathfind(arrival,{x:24.5,y:19.5},'caverns-depths').length);
});
test('attacks, spells, projectiles and loot cannot cross between depths',()=>{
 const sim=new CombatSimulation(),lower=sim.wolves.get('depths-bat-1')!,p=newFighter();Object.assign(p,{region:'caverns',x:lower.x,y:lower.y});assert.equal(monsterRegion(lower),'caverns-depths');assert.equal(sim.action('p',p,'bolt',lower.id),false);assert.equal(sim.castSpell('p',p,'spark',lower.id,{classId:'citizen',level:100,learnedSpells:['spark']}),false);
 p.region='caverns-depths';assert.ok(sim.action('p',p,'bolt',lower.id));p.auto=false;p.region='caverns';const hp=lower.hp;sim.tick(.5,[['p',p]]);assert.equal(lower.hp,hp);assert.equal(sim.projectiles.size,0);
 const e=new Economy(()=>0);e.join('p');e.process([{id:1,owner:'p',region:'caverns-depths',kind:'bat',x:p.x,y:p.y}],new Map([['p',p]]),0);const drop=[...e.drops.values()][0];assert.equal(gearDefinition(drop.gear!.base).tier,'copper');assert.match(e.act('p',p,{kind:'pickup',drop:drop.id},0),/closer/);p.region='caverns-depths';assert.match(e.act('p',p,{kind:'pickup',drop:drop.id},0),/Collected/);
});
