import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onElderwoodLand,gridMap,playerHouses,houseCells,elderwoodRimStairs} from '@realm/game-data';
test('stepped Elderwood outline keeps homes and stairs inland and its cutouts impassable',()=>{
 const map=gridMap('elderwood-upper'),widths=new Set<number>();
 for(let y=0;y<map.height;y++){let count=0;for(let x=0;x<map.width;x++){
  if(onElderwoodLand(x,y))count++;
  else assert.ok(map.blocked.has(`${x},${y}`),`outside land ${x},${y}`);
 }widths.add(count);}
 assert.ok(widths.size>3,'irregular outline');
 for(const h of playerHouses)for(const cell of houseCells(h,0)){const[x,y]=cell.split(',').map(Number);assert.ok(onElderwoodLand(x,y),h.id);}
 for(const s of elderwoodRimStairs)assert.ok(onElderwoodLand(Math.floor(s.top.x),Math.floor(s.top.y)));
});
