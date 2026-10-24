import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,PORTAL,merchant,blocked} from '@realm/game-data';
import {legal,move,pathfind} from '@realm/shared';
test('illustrated Elderwood keeps spawn, portal, trader and village entrances connected',()=>{
 for(const point of [WORLD.spawn,PORTAL,PORTAL.arrival,merchant,{x:9.5,y:6.5},{x:23.5,y:6.5},{x:4.5,y:12.5},{x:28.5,y:12.5}]){
 assert.equal(legal(point),true,JSON.stringify(point));
 const route=pathfind(WORLD.spawn,point);assert.ok(route.length||point===WORLD.spawn,JSON.stringify(point));
 for(const step of route)assert.equal(legal(step),true);
 }
});
test('river, forest, planting beds and building bases block movement and pathfinding',()=>{
 for(const point of [{x:2.5,y:4.5},{x:29.5,y:20.5},{x:4.5,y:1.5},{x:9.5,y:3.5},{x:22.5,y:3.5},{x:13.5,y:10.5}]){
 assert.equal(blocked(Math.floor(point.x),Math.floor(point.y)),true,JSON.stringify(point));
 assert.equal(legal(point),false);assert.deepEqual(pathfind(WORLD.spawn,point),[]);
 }
 // Eastern river edge: both ordinary movement and sprint stop at the bank.
 const start={x:24.95,y:15.5,stamina:100};assert.equal(legal(start),true);
 for(const sprint of [false,true])assert.deepEqual(move(start,{x:1,y:0,sprint,seq:1},.05).x,start.x);
});

test('painted river bank no longer blocks the open ground at the old whole-tile boundary',()=>{
 assert.equal(legal({x:24.9,y:15.5}),true);
 assert.equal(legal({x:25.3,y:15.5}),false);
 const route=pathfind(WORLD.spawn,merchant);assert.ok(route.length);
 for(let i=1;i<route.length;i++)assert.ok(Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y)<=Math.SQRT1_2+.001);
});
