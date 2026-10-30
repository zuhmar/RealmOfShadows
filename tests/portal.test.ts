import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isRaisedFloor,isLowerFloor,regions,PORTAL,portalFor,canTravel,isRegion,type RegionId} from '@realm/game-data';
import {legal,pathfind,move,CombatSimulation} from '@realm/shared';
test('portal accepts known destinations only within interaction range',()=>{
 assert.equal(canTravel(PORTAL,'elderwood','woods'),true);
 assert.equal(canTravel(PORTAL,'elderwood','elderwood'),false);
 for(const value of ['unknown','__proto__',null,{},1])assert.equal(isRegion(value),false);
 assert.equal(canTravel({x:2,y:2},'elderwood','woods'),false);
});
test('all portal arrivals are walkable and can return home',()=>{
 for(const region of (Object.keys(regions) as RegionId[]).filter(r=>!isLowerFloor(r)&&!isRaisedFloor(r)&&r!=='elderwood-upper')){const portal=portalFor(region);assert.equal(legal(portal.arrival,region),true);assert.ok(pathfind(portal.arrival,portal,region).length);if(region!=='elderwood')assert.equal(canTravel(portal.arrival,region,'elderwood'),true);}
});
test('selected island determines water and solid cell collision',()=>{
 assert.equal(legal({x:11.5,y:3.5},'elderwood'),false);assert.equal(legal({x:11.5,y:3.5},'woods'),true);
 assert.equal(legal({x:5.5,y:5.5},'swamp'),false);assert.ok(pathfind(portalFor('woods').arrival,{x:8.5,y:6.5},'woods').length);
});
test('Woods portal is centered independently of Elderwood, including travel validation',()=>{const portal=portalFor('woods');assert.equal(portal.x,34.5);assert.ok(Math.abs(portal.y-24)<3);assert.equal(PORTAL.x,24.5);assert.ok(canTravel(portal,'woods','elderwood'));assert.ok(!canTravel(PORTAL,'woods','elderwood'));const sim=new CombatSimulation();assert.ok(sim.safe({...portal,region:'woods'}));assert.ok(!sim.safe({...PORTAL,region:'woods'}));});
