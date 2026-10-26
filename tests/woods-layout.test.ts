import {test} from 'node:test';
import assert from 'node:assert/strict';
import {monsterSpawns,portalFor,gridMap,weapons} from '@realm/game-data';
import {pathfind,legal,sight,attackPath} from '@realm/shared';
test('equal normal populations have connected habitats on the new grid',()=>{
 for(const kind of ['wolf','spider','boar']){const group=monsterSpawns.filter(s=>s.kind===kind);assert.equal(group.length,9);for(const s of group)assert.ok(pathfind(portalFor('woods').arrival,s,'woods').length);}
});
test('boss grove walls block sight and entry except at its south gate',()=>{
 for(const p of [{x:49.5,y:35.5},{x:62.5,y:35.5},{x:56.5,y:30.5},{x:52.5,y:41.5}])assert.equal(legal(p,'woods'),false);
 assert.ok(legal({x:56.5,y:41.5},'woods'));assert.equal(sight({x:48.5,y:35.5},{x:55.5,y:35.5},'woods'),false);
 const route=pathfind(portalFor('woods').arrival,{x:55.5,y:35.5},'woods');assert.ok(route.some(p=>Math.floor(p.y)===41&&p.x>54&&p.x<58));
});
test('ranged approach finds a legal firing cell inside the boss grove',()=>{
 const boss=monsterSpawns.find(s=>s.kind==='bear')!,route=attackPath({x:56.5,y:43.5},boss,4.5,'woods'),last=route.at(-1)!;assert.ok(last);assert.ok(sight(last,boss));assert.ok(last.y<41);assert.ok(Math.hypot(last.x-boss.x,last.y-boss.y)<=4.5);
});
