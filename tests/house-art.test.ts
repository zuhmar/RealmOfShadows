import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {buildingVisuals,gridMap,insideBuilding,villageBuildings} from '@realm/game-data';
test('full house shells add roofs and upright walls without replacing collision footprints',()=>{
 const grid=gridMap('elderwood'),before=[...grid.blocked],edges=[...grid.edges],objects=buildingVisuals('elderwood',grid.objects);
 assert.equal(objects.filter(o=>o.roofFor).length,5);assert.ok(!objects.some(o=>/^(depot|village)-wall-/.test(o.key)));
 for(const b of villageBuildings){const roof=objects.find(o=>o.roofFor===b.id)!;assert.equal(roof.key,`house-roof-${b.id}`);assert.ok(roof.w>=b.width*48);assert.ok(objects.some(o=>o.wallFor===b.id&&o.wallSide==='s'));assert.ok(insideBuilding({x:b.x+1.5,y:b.y+1.5},b));assert.equal(insideBuilding({x:b.x+b.door+.5,y:b.y+b.height+.5},b),false);}
 assert.deepEqual([...grid.blocked],before);assert.deepEqual([...grid.edges],edges);assert.equal(buildingVisuals('elderwood',grid.objects,false).filter(o=>o.roofFor).length,0);
 for(const o of objects)assert.ok(existsSync(new URL(`../assets/world/objects/${o.key}.png`,import.meta.url)),o.key);
});
test('placed furniture has four purpose-drawn directional views with stable native canvases',()=>{
 for(const name of ['forge','workbench','counter','meeting','bookshelf','bed','table','armor','chest','chair','barrel','well','bench','planter','tools','stairsup','stairsdown'])for(const facing of ['down','left','right','up']){const data=readFileSync(new URL(`../assets/world/objects/furn-${name}-${facing}.png`,import.meta.url));assert.equal(data.readUInt32BE(16),96);assert.equal(data.readUInt32BE(20),96);}
 for(const side of ['n','e','s','w','nw','ne','sw','se']){const data=readFileSync(new URL(`../assets/world/objects/house-wall-${side}.png`,import.meta.url));assert.equal(data.readUInt32BE(16),32);assert.equal(data.readUInt32BE(20),64);}
});
