import {test} from 'node:test';
import assert from 'node:assert/strict';
import {move,pathfind,legal} from '@realm/shared';
import {WORLD,blocked} from '@realm/game-data';
test('speed is normalized for diagonal and oversized input',()=>{for(const [x,y] of [[1,0],[1,1],[100,100]]){const p=move({...WORLD.spawn,stamina:100},{x,y,sprint:false,seq:1},.05);assert.ok(Math.abs(Math.hypot(p.x-WORLD.spawn.x,p.y-WORLD.spawn.y)-.2)<1e-9);}});
test('walls and buildings stop grid movement',()=>{const p={x:4.5,y:6.5,stamina:100};const next=move(p,{x:1,y:0,sprint:false,seq:1},.05);assert.equal(next.x,p.x);assert.equal(next.y,p.y);assert.equal(legal({x:0,y:5}),false);});
test('diagonal movement cannot clip a building corner',()=>{const p={x:4.5,y:1.5,stamina:100},q=move(p,{x:1,y:1,sprint:false,seq:1},.05);assert.equal(q.x,p.x);assert.equal(q.y,p.y);});
test('A* routes on centered full cells without cutting corners',()=>{const start={x:34.5,y:27.5},end={x:8.5,y:6.5},route=pathfind(start,end,'woods');assert.ok(route.length>7);let prev=start;for(const p of route){assert.ok(legal(p,'woods'));assert.ok(legal({x:p.x,y:prev.y},'woods'));assert.ok(legal({x:prev.x,y:p.y},'woods'));prev=p;}assert.deepEqual(prev,end);assert.deepEqual(pathfind(start,{x:.5,y:7.5},'woods'),[]);});
test('sprint consumes stamina and idle regenerates',()=>{const p=move({...WORLD.spawn,stamina:100},{x:1,y:0,sprint:true,seq:1},.05);assert.equal(p.stamina,98.75);assert.ok(Math.abs(p.x-WORLD.spawn.x-.3)<1e-9);assert.equal(move(p,{x:0,y:0,sprint:false,seq:2},.05).stamina,99.5);});
