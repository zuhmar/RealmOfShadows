import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {gridMap,buildingVisuals,connectedFenceVisuals,fenceMask,fenceDirections,neighborhoodGardens,playerHouses,elderwoodRimStairs,houseCells} from '@realm/game-data';import {pathfind,legal} from '@realm/shared';
test('every fence part connects reciprocally at native cell size, including the original garden',()=>{
 for(const region of ['elderwood','elderwood-upper']){const map=gridMap(region),parts=connectedFenceVisuals(map.objects),cells=new Set(parts.map(p=>`${p.x/48},${p.y/48}`));assert.ok(parts.length>12);
 for(const p of parts){const x=p.x/48,y=p.y/48,mask=Number(p.key.split('-').at(-1));assert.equal(mask,fenceMask(cells,x,y));assert.equal(p.w,48);assert.equal(p.h,48);assert.ok(map.blocked.has(`${x},${y}`));for(const[dx,dy,bit]of fenceDirections)assert.equal(!!(mask&bit),cells.has(`${x+dx},${y+dy}`));const png=readFileSync(new URL(`../assets/world/objects/${p.key}.png`,import.meta.url));assert.equal(png.readUInt32BE(16),32);assert.equal(png.readUInt32BE(20),32);}
 assert.equal(buildingVisuals(region,map.objects).filter(p=>p.key==='elderwood-fence-h'||p.key==='elderwood-fence-v').length,0,'long fences replaced by joined parts');
 }
});
test('courts, garden gates and all twenty houses remain accessible through the dressed neighborhoods',()=>{
 const map=gridMap('elderwood-upper'),start=elderwoodRimStairs[0].top,fences=new Set(map.objects.filter(o=>o.key.startsWith('map-fence-')).map(o=>`${o.x/48},${o.y/48}`));assert.ok(fences.size>100);
 for(const g of neighborhoodGardens){const installed=fences.has(`${g.x},${g.y}`)||fences.has(`${g.x+1},${g.y}`);if(!installed){assert.notEqual(g.kind,'court');continue;}const gate={x:g.gate.x+.5,y:g.gate.y+.5};assert.ok(!fences.has(`${g.gate.x},${g.gate.y}`));assert.ok(legal(gate,'elderwood-upper'));assert.ok(pathfind(start,gate,'elderwood-upper').length,'open garden gate');assert.ok(pathfind(gate,{x:g.x+1.5,y:g.y+1.5},'elderwood-upper').length,'usable garden interior');}
 for(const h of playerHouses){assert.ok(pathfind(start,{x:h.door.x,y:h.door.y+1},'elderwood-upper').length,h.id+' doorway');for(const key of houseCells(h,0))assert.ok(!fences.has(key),h.id+' fence outside house');}
 assert.ok(map.objects.filter(o=>o.key==='elderwood-oak').length>35);assert.ok(map.objects.filter(o=>o.key==='woods-flowers').length>30);
});
