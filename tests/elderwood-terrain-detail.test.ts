import {test} from 'node:test';import assert from 'node:assert/strict';
import {gridMap,elderwoodRimStairs} from '@realm/game-data';
import {cliffStairFlight} from '../apps/client/src/cliff-stair-layout';
import {elderwoodSurface,terrainNoise} from '../apps/client/src/elderwood-terrain-detail';
test('terrain detail planning protects complete stairs and keeps authoritative terrain/collision unchanged',()=>{
 const lower=gridMap('elderwood'),upper=gridMap('elderwood-upper'),before=JSON.stringify([lower.cells,upper.cells,[...lower.blocked],[...upper.blocked]]),plan=elderwoodSurface();
 let stairs=0;for(const s of elderwoodRimStairs)for(const p of cliffStairFlight(s)){assert.equal(plan.cells[Math.floor(p.y)][Math.floor(p.x)],9);stairs++;}assert.equal(stairs,12);
 assert.equal(JSON.stringify([lower.cells,upper.cells,[...lower.blocked],[...upper.blocked]]),before);
 assert.equal(plan.width,lower.width);assert.equal(plan.height,lower.height);assert.ok(plan.cells.flat().includes(4),'floor/bridge material stays protected');
});
test('detail noise is stable for negative/world coordinates and distinct across coordinates and seeds',()=>{
 const samples=[];for(let x=-8;x<16;x++)for(let y=-8;y<16;y++){const a=terrainNoise(x,y,7);assert.equal(a,terrainNoise(x,y,7));assert.ok(a>=0&&a<1);samples.push(a);}assert.ok(new Set(samples).size>500);assert.notEqual(terrainNoise(20,30,7),terrainNoise(20,30,8));
});
