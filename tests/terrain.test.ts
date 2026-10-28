import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,PORTAL,merchant,gridMap} from '@realm/game-data';
import {legal,pathfind,move} from '@realm/shared';
test('new village plaza, trader, building entrances and southern bridge are connected',()=>{
 for(const destination of [PORTAL,PORTAL.arrival,merchant,{x:9.5,y:8.5},{x:25.5,y:8.5},{x:6.5,y:16.5},{x:26.5,y:16.5},{x:16.5,y:21.5}]){assert.ok(legal(destination),JSON.stringify(destination));assert.ok(pathfind(WORLD.spawn,destination).length);}
});
test('village furniture has solid footprints while interiors and tree canopies remain walkable',()=>{
 const counter={x:25.5,y:13.5};assert.equal(legal(counter),false);assert.deepEqual(pathfind(WORLD.spawn,counter),[]);assert.ok(legal({x:25.5,y:14.5}));
 assert.ok(legal({x:3.5,y:2.5}));assert.equal(legal({x:2.5,y:4.5}),false);
});
test('water blocks grid walking and sprint, while bridge cells connect both banks',()=>{
 assert.equal(legal({x:13.5,y:20.5}),false);for(const sprint of [false,true]){const p={x:13.5,y:18.5,stamina:100};const next=move(p,{x:0,y:1,sprint,seq:1},.05);assert.equal(next.y,p.y);}
 for(let y=18;y<23;y++)assert.ok(legal({x:16.5,y:y+.5}));assert.ok(pathfind(WORLD.spawn,{x:16.5,y:22.5}).length);
});
