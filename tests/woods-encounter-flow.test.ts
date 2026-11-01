import {test} from 'node:test';import assert from 'node:assert/strict';
import {gridSpawns,portalFor,monsters,questById,woodsRidges} from '@realm/game-data';
import {pathfind,legal} from '@realm/shared';
import {bearApproachGuards} from '../packages/game-data/src/woods-cliffs';
const spawns=gridSpawns('woods'),distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
test('opening junction provides a passive encounter while aggressive monsters stay away from arrival',()=>{
 const arrival=portalFor('woods').arrival;assert.ok(spawns.some(s=>s.kind==='wolf'&&distance(s,arrival)<14));
 for(const s of spawns.filter(s=>monsters[s.kind].level>=6))assert.ok(distance(s,arrival)>14,s.id+' outside beginner arrival');
 assert.equal(spawns.length,46,'redistribute existing monsters rather than increasing density');assert.equal(new Set(spawns.map(s=>s.id)).size,46);
});
test('three quest boars guard the outer boss route without camping its entrance or waking the bear',()=>{
 const boss=spawns.find(s=>s.kind==='bear')!,gate={x:56.5,y:41.5},guards=spawns.filter(s=>bearApproachGuards.some(([x,y])=>s.x===x+.5&&s.y===y+.5));
 assert.equal(guards.length,questById('woods-main-2')!.objectives.find(o=>o.target==='boar')!.count);
 let previous=portalFor('woods').arrival;
 for(const guard of guards){assert.equal(guard.kind,'boar');assert.ok(guard.y>41.5,'outside the enclosed grove');assert.ok(distance(guard,boss)>monsters.bear.detect+2,'no forced boss engagement');assert.ok(distance(guard,gate)>monsters.boar.detect,'entrance remains a recovery space');assert.ok(pathfind(previous,guard,'woods').length,'connected approach');previous=guard;}
 assert.ok(pathfind(previous,gate,'woods').length);assert.ok(pathfind(gate,boss,'woods').length);
});
test('outer hunting pockets mix nearby pairs with long quiet stretches and reachable respawns',()=>{
 for(const prefix of ['east-wolf-','south-spider-']){
  const group=spawns.filter(s=>s.id.startsWith(prefix));assert.equal(group.length,6);
  assert.ok(group.filter(s=>group.some(o=>o!==s&&distance(s,o)<=5)).length>=4,'at least two small pockets');
  assert.ok(group.some(s=>group.every(o=>o===s||distance(s,o)>8)),'an isolated encounter between quiet stretches');
  for(const s of group){assert.ok(legal(s,'woods'));assert.ok(pathfind(portalFor('woods').arrival,s,'woods').length,s.id+' reachable');}
 }
 const quiet=woodsRidges.find(r=>r.id==='quiet')!;assert.equal(gridSpawns('woods-upper').filter(s=>s.id.startsWith(`ridge-${quiet.id}-`)).length,0);assert.ok(spawns.every(s=>distance(s,quiet.stair)>8),'quiet overlook approach remains clear');
});
