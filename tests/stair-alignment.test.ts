import {test} from 'node:test';import assert from 'node:assert/strict';
import {elderwoodRimStairs,elderwoodStairTile,stairsFor,availableStair,gridMap} from '@realm/game-data';import {legal,pathfind} from '@realm/shared';
test('all four cliff stairs arrive and descend on their physical tile with a reachable upper recess',()=>{
 for(const s of elderwoodRimStairs){const tile=elderwoodStairTile(s),up=stairsFor('elderwood').find(c=>c.id===`elderwood-rim-${s.id}-up`)!,down=stairsFor('elderwood-upper').find(c=>c.id===`elderwood-rim-${s.id}-down`)!;
  assert.deepEqual(up.arrival,tile);assert.equal(down.x,tile.x);assert.equal(down.y,tile.y);assert.ok(availableStair(tile,'elderwood-upper',down.id));assert.equal(availableStair(s.top,'elderwood-upper',down.id),undefined,'old offset tile is not the descent trigger');assert.ok(legal(tile,'elderwood-upper'));assert.ok(pathfind(s.top,tile,'elderwood-upper').length);assert.ok(pathfind(tile,s.top,'elderwood-upper').length);assert.ok(legal(down.arrival,'elderwood'));assert.ok(gridMap('elderwood').blocked.has(`${Math.floor(tile.x)},${Math.floor(tile.y)}`),'ground cannot walk through the cliff');
 }
});
