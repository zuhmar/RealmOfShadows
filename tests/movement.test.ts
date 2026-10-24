import {test} from 'node:test';
import assert from 'node:assert/strict';
import {move,pathfind,legal} from '@realm/shared';
import {WORLD,blocked} from '@realm/game-data';
test('speed is normalized for diagonal and oversized input',()=>{for(const [x,y] of [[1,0],[1,1],[100,100]]){const p=move({...WORLD.spawn,stamina:100},{x,y,sprint:false,seq:1},.05);assert.ok(Math.abs(Math.hypot(p.x-WORLD.spawn.x,p.y-WORLD.spawn.y)-.2)<1e-9);}});
test('walls and building collisions stop movement',()=>{const p={x:5.7,y:7,stamina:100};assert.deepEqual(move(p,{x:1,y:0,sprint:false,seq:1},.05,'woods'),p);assert.equal(legal({x:0,y:5}),false);});
test('diagonal movement cannot clip building corner',()=>{const p={x:5.7,y:5.8,stamina:100};const q=move(p,{x:1,y:1,sprint:false,seq:1},.05,'woods');assert.equal(q.x,p.x);assert.equal(q.y,p.y);});
test('A* routes through the illustrated woods without cutting corners',()=>{const start={x:16.5,y:15.5},end={x:6.5,y:11};const path=pathfind(start,end,'woods');assert.ok(path.length>7);let prev=start;for(const p of path){assert.equal(legal(p,'woods'),true);for(let i=1;i<=10;i++)assert.equal(legal({x:prev.x+(p.x-prev.x)*i/10,y:prev.y+(p.y-prev.y)*i/10},'woods'),true);prev=p;}assert.ok(Math.hypot(prev.x-end.x,prev.y-end.y)<.36);assert.deepEqual(pathfind(start,{x:1.5,y:7},'woods'),[]);});
test('sprint consumes stamina and idle regenerates',()=>{const p=move({...WORLD.spawn,stamina:100},{x:1,y:0,sprint:true,seq:1},.05);assert.equal(p.stamina,98.75);assert.ok(Math.abs(p.x-WORLD.spawn.x-.3)<1e-9);assert.equal(move(p,{x:0,y:0,sprint:false,seq:2},.05).stamina,99.5);});
