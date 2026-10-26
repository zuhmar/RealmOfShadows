import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,PORTAL,merchant,gridMap} from '@realm/game-data';
import {legal,pathfind,move} from '@realm/shared';
test('new village plaza, trader, building entrances and southern bridge are connected',()=>{
 for(const destination of [PORTAL,PORTAL.arrival,merchant,{x:9.5,y:8.5},{x:25.5,y:8.5},{x:6.5,y:16.5},{x:26.5,y:16.5},{x:16.5,y:21.5}]){assert.ok(legal(destination),JSON.stringify(destination));assert.ok(pathfind(WORLD.spawn,destination).length);}
});
test('standalone building sprites have solid grid footprints; tree canopies can overhang free cells',()=>{
 const map=gridMap('elderwood');for(const object of map.objects.filter(o=>/tavern|blacksmith|bank|workshop|hall/.test(o.key))){const p={x:object.x/48+1.5,y:(object.y+object.h)/48-.5};assert.equal(legal(p),false,object.key);assert.deepEqual(pathfind(WORLD.spawn,p),[]);}
 assert.ok(legal({x:3.5,y:2.5}));assert.equal(legal({x:2.5,y:4.5}),false);
});
test('water blocks grid walking and sprint, while bridge cells connect both banks',()=>{
 assert.equal(legal({x:13.5,y:20.5}),false);for(const sprint of [false,true]){const p={x:13.5,y:18.5,stamina:100};const next=move(p,{x:0,y:1,sprint,seq:1},.05);assert.equal(next.y,p.y);}
 for(let y=18;y<23;y++)assert.ok(legal({x:16.5,y:y+.5}));assert.ok(pathfind(WORLD.spawn,{x:16.5,y:22.5}).length);
});
