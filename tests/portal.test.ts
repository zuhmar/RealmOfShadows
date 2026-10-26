import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isLowerFloor,regions,PORTAL,portalFor,canTravel,isRegion,type RegionId} from '@realm/game-data';
import {legal,pathfind,move,CombatSimulation} from '@realm/shared';
test('portal accepts known destinations only within interaction range',()=>{
 assert.equal(canTravel(PORTAL,'elderwood','woods'),true);
 assert.equal(canTravel(PORTAL,'elderwood','elderwood'),false);
 for(const value of ['unknown','__proto__',null,{},1])assert.equal(isRegion(value),false);
 assert.equal(canTravel({x:2,y:2},'elderwood','woods'),false);
});
test('all portal arrivals are walkable and can return home',()=>{
 for(const region of (Object.keys(regions) as RegionId[]).filter(r=>!isLowerFloor(r))){const portal=portalFor(region);assert.equal(legal(portal.arrival,region),true);assert.ok(pathfind(portal.arrival,portal,region).length);if(region!=='elderwood')assert.equal(canTravel(portal.arrival,region,'elderwood'),true);}
});
test('movement and pathfinding use the selected destination collision map',()=>{
 const position={x:4.3,y:4,stamina:100},input={x:1,y:0,sprint:false,seq:1};
 assert.equal(move(position,input,.05,'woods').x,position.x);
 assert.ok(move({x:5.7,y:7.5,stamina:100},input,.05,'swamp').x===5.7);
 assert.ok(pathfind({x:5.5,y:7.5},{x:11.5,y:7.5},'woods').every(p=>legal(p,'woods')));
 // The northern wolf clearing overlaps a village obstruction.
 assert.equal(legal({x:4,y:4},'elderwood'),false);assert.equal(legal({x:4,y:4},'woods'),true);
});

test('Woods portal is centered independently of Elderwood, including travel validation',()=>{const portal=portalFor('woods');assert.equal(portal.x,34);assert.ok(Math.abs(portal.y-24)<3);assert.equal(PORTAL.x,16.5);assert.ok(canTravel(portal,'woods','elderwood'));assert.ok(!canTravel(PORTAL,'woods','elderwood'));const sim=new CombatSimulation();assert.ok(sim.safe({...portal,region:'woods'}));assert.ok(!sim.safe({...PORTAL,region:'woods'}));});
