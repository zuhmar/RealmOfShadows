import {test} from 'node:test';
import assert from 'node:assert/strict';
import {move,pathfind,legal} from '@realm/shared';
import {WORLD,blocked} from '@realm/game-data';
test('speed is normalized for diagonal and oversized input',()=>{for(const [x,y] of [[1,0],[1,1],[100,100]]){const p=move({...WORLD.spawn,stamina:100},{x,y,sprint:false,seq:1},.05);assert.ok(Math.abs(Math.hypot(p.x-WORLD.spawn.x,p.y-WORLD.spawn.y)-.2)<1e-9);}});
test('walls and building collisions stop movement',()=>{const p={x:4.7,y:6,stamina:100};assert.deepEqual(move(p,{x:1,y:0,sprint:false,seq:1},.05),p);assert.equal(legal({x:0,y:5}),false);});
test('diagonal movement cannot clip building corner',()=>{const p={x:4.7,y:4.8,stamina:100};const q=move(p,{x:1,y:1,sprint:false,seq:1},.05);assert.equal(q.x,p.x);assert.equal(q.y,p.y);});
test('A* routes around bank without cutting corners',()=>{const path=pathfind({x:4.5,y:6.5},{x:10.5,y:6.5});assert.ok(path.length>7);let prev={x:4.5,y:6.5};for(const p of path){assert.equal(blocked(Math.floor(p.x),Math.floor(p.y)),false);assert.equal(blocked(Math.floor(prev.x),Math.floor(p.y)),false);assert.equal(blocked(Math.floor(p.x),Math.floor(prev.y)),false);prev=p;}assert.deepEqual(path.at(-1),{x:10.5,y:6.5});assert.deepEqual(pathfind(WORLD.spawn,{x:6,y:6}),[]);});
test('sprint consumes stamina and idle regenerates',()=>{const p=move({...WORLD.spawn,stamina:100},{x:1,y:0,sprint:true,seq:1},.05);assert.equal(p.stamina,98.75);assert.ok(Math.abs(p.x-WORLD.spawn.x-.3)<1e-9);assert.equal(move(p,{x:0,y:0,sprint:false,seq:2},.05).stamina,99.5);});
