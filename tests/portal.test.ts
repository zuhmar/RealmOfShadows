import {test} from 'node:test';
import assert from 'node:assert/strict';
import {regions,PORTAL,canTravel,isRegion,type RegionId} from '@realm/game-data';
import {legal,pathfind,move} from '@realm/shared';
test('portal accepts known destinations only within interaction range',()=>{
 assert.equal(canTravel(PORTAL,'elderwood','woods'),true);
 assert.equal(canTravel(PORTAL,'elderwood','elderwood'),false);
 for(const value of ['unknown','__proto__',null,{},1])assert.equal(isRegion(value),false);
 assert.equal(canTravel({x:2,y:2},'elderwood','woods'),false);
});
test('all portal arrivals are walkable and can return home',()=>{
 for(const region of Object.keys(regions) as RegionId[]){assert.equal(legal(PORTAL.arrival,region),true);assert.ok(pathfind(PORTAL.arrival,PORTAL,region).length);if(region!=='elderwood')assert.equal(canTravel(PORTAL.arrival,region,'elderwood'),true);}
});
test('movement and pathfinding use the selected destination collision map',()=>{
 const position={x:3,y:4.5,stamina:100},input={x:1,y:0,sprint:false,seq:1};
 assert.equal(move(position,input,.05,'woods').x,position.x);
 assert.ok(move({x:5.7,y:7.5,stamina:100},input,.05,'swamp').x===5.7);
 assert.ok(pathfind({x:5.5,y:7.5},{x:11.5,y:7.5},'woods').every(p=>legal(p,'woods')));
 // The northern wolf clearing overlaps a village obstruction.
 assert.equal(legal({x:4,y:4},'elderwood'),false);assert.equal(legal({x:4,y:4},'woods'),true);
});
