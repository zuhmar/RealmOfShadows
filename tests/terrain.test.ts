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
test('rivers, cliffs and placed building bases block movement and pathfinding',()=>{
 for(const point of [{x:2.5,y:6.5},{x:29.5,y:20.5},{x:12.5,y:3.5},{x:9.5,y:4.5},{x:22.5,y:4.5}]){
 assert.equal(blocked(Math.floor(point.x),Math.floor(point.y)),true,JSON.stringify(point));
 assert.equal(legal(point),false);assert.deepEqual(pathfind(WORLD.spawn,point),[]);
 }
 // Eastern river bank stops ordinary movement and sprint.
 const start={x:24.6,y:15.5,stamina:100};assert.equal(legal(start),true);
 for(const sprint of [false,true])assert.deepEqual(move(start,{x:1,y:0,sprint,seq:1},.05).x,start.x);
});

test('updated river bank keeps dry ground open and water blocked',()=>{
 assert.equal(legal({x:24.5,y:15.5}),true);
 assert.equal(legal({x:26,y:15.5}),false);
 const route=pathfind(WORLD.spawn,merchant);assert.ok(route.length);
 for(let i=1;i<route.length;i++)assert.ok(Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y)<=Math.SQRT1_2+.001);
});

test('removed trees, boulders and planting beds leave their ground walkable',()=>{
 const point=(x:number,y:number)=>({x:x/48,y:y/48+4/3});
 for(const position of [point(650,250),point(1060,800),point(670,740),point(875,750),point(650,445),point(880,445)]){
  assert.equal(legal(position),true,JSON.stringify(position));
  const route=pathfind(WORLD.spawn,position);assert.ok(route.length,JSON.stringify(position));
  for(const step of route)assert.equal(legal(step),true);
 }
});
test('bridge decks remain walkable while adjacent river stays blocked',()=>{
 for(const [x,y] of [[150,155],[205,248],[260,372],[120,752],[1365,750]]){
  assert.equal(legal({x:x/48,y:y/48+4/3}),true,`${x},${y}`);
 }
 assert.equal(legal({x:205/48,y:205/48+4/3}),false);
});
