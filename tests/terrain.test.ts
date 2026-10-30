import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,PORTAL,merchant,gridMap,villageDoors} from '@realm/game-data';
import {legal,pathfind,move} from '@realm/shared';
test('central village plaza, trader and every corner building entrance are connected',()=>{
 for(const destination of [PORTAL,merchant,...villageDoors('elderwood').map(d=>({x:d.x,y:d.y+1})),{x:37.5,y:25.5}]){assert.ok(legal(destination),JSON.stringify(destination));assert.ok(pathfind(WORLD.spawn,destination).length,JSON.stringify(destination));}
});
test('village furniture has solid footprints while interiors and tree canopies remain walkable',()=>{
 const counter={x:6.5,y:30.5};assert.equal(legal(counter),false);assert.deepEqual(pathfind(WORLD.spawn,counter),[]);assert.ok(legal({x:6.5,y:31.5}));
 assert.ok(legal({x:13.5,y:6.5}));assert.equal(legal({x:13.5,y:8.5}),false);assert.ok(legal({x:12.5,y:8.5}));
});
test('fishing ponds block walking and sprint while the eastern timber crossing connects both banks',()=>{
 assert.equal(legal({x:8.5,y:25.5}),false);for(const sprint of [false,true]){const p={x:7.5,y:25.5,stamina:100};const next=move(p,{x:1,y:0,sprint,seq:1},.05);assert.equal(next.x,p.x);}
 for(let y=18;y<26;y++)assert.ok(legal({x:37.5,y:y+.5}));assert.ok(pathfind(WORLD.spawn,{x:37.5,y:25.5}).length);
});
