import {test} from 'node:test';
import assert from 'node:assert/strict';
import {woodsCliffs,gridMap,gridSpawns,portalFor,resourceNodes,stairsFor} from '@realm/game-data';
import {pathfind,legal} from '@realm/shared';
test('Woods outcrops are solid and retain routes to encounters, gathering and stairs',()=>{
 const map=gridMap('woods'),start=portalFor('woods').arrival;
 assert.equal(woodsCliffs.length,16);
 for(const c of woodsCliffs)for(let y=c.y;y<c.y+c.size;y++)for(let x=c.x;x<c.x+c.size;x++){
  assert.equal(map.cells[y][x],5);assert.equal(legal({x:x+.5,y:y+.5},'woods'),false);
 }
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(x===0||y===0||x===map.width-1||y===map.height-1)assert.ok(map.blocked.has(`${x},${y}`));
 for(const goal of [...gridSpawns('woods'),...resourceNodes.filter(n=>n.region==='woods'),...stairsFor('woods')])assert.ok(pathfind(start,goal,'woods').length,JSON.stringify(goal));
});
