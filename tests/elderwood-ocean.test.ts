import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,onElderwoodLand,elderwoodRimStairs,elderwoodStairTile,stairsFor} from '@realm/game-data';
test('Elderwood ocean surrounds the complete island on both floors and stays blocked',()=>{
 for(const region of ['elderwood','elderwood-upper'] as const){const map=gridMap(region);let water=0;
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(!onElderwoodLand(x,y)){assert.equal(map.cells[y][x],3);assert.ok(map.blocked.has(`${x},${y}`));water++;}
  assert.ok(water>500);
 }
});
test('all upper down stairs use the same physical cell as the ascending flight and remain walkable',()=>{
 const map=gridMap('elderwood-upper');for(const stair of elderwoodRimStairs){const p=elderwoodStairTile(stair),down=stairsFor('elderwood-upper').find(s=>s.id===`elderwood-rim-${stair.id}-down`)!;assert.equal(down.x,p.x);assert.equal(down.y,p.y);assert.ok(!map.blocked.has(`${Math.floor(p.x)},${Math.floor(p.y)}`));}
});
