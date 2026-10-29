import {test} from 'node:test';
import assert from 'node:assert/strict';
import {woodsRidges,ridgeCells,gridSpawns,gridMap,regionSize,stairsFor,portalFor} from '@realm/game-data';
import {legal,pathfind} from '@realm/shared';
test('expanded Woods doubles exploration area and connects every ridge to the old forest',()=>{
 const size=regionSize('woods');assert.ok(size.width*size.height>=68*48*2);assert.deepEqual(regionSize('woods-upper'),size);
 assert.equal(gridSpawns('woods').length,46);assert.equal(gridSpawns('woods-upper').length,9);
 for(const r of woodsRidges){
  const up=stairsFor('woods').find(s=>s.id===`woods-ridge-${r.id}-up`)!,down=stairsFor('woods-upper').find(s=>s.id===`woods-ridge-${r.id}-down`)!;
  assert.ok(pathfind(portalFor('woods').arrival,up,'woods').length,r.id+' ground approach');
  assert.ok(legal(up.arrival,'woods-upper'));assert.ok(legal(down.arrival,'woods'));
  for(const key of ridgeCells(r)){const[x,y]=key.split(',').map(Number),p={x:x+.5,y:y+.5};assert.equal(legal(p,'woods'),false);assert.ok(legal(p,'woods-upper'));assert.ok(pathfind(up.arrival,p,'woods-upper').length||Math.hypot(p.x-up.arrival.x,p.y-up.arrival.y)<.1,r.id+' continuous top');}
  const spawns=gridSpawns('woods-upper').filter(s=>s.id.startsWith(`ridge-${r.id}-`));assert.equal(spawns.length,r.monsters?3:0);
  for(const s of spawns)assert.ok(pathfind(up.arrival,s,'woods-upper').length);
  assert.equal(gridMap('woods-upper').cells[Math.floor(r.stair.y)+1][Math.floor(r.stair.x)],5,'no walking off cliff');
 }
});
