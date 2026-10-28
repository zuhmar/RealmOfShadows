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
 for(const side of ['n','e','s','w','nw','ne','sw','se']){const data=readFileSync(new URL(`../assets/world/objects/house-wall-${side}.png`,import.meta.url));assert.equal(data.readUInt32BE(16),side==='n'||side==='s'?64:32);assert.equal(data.readUInt32BE(20),64);}
});
test('elevated furniture keeps uniform scale and its floor anchor, and wall runs leave doors open',()=>{
 for(const region of ['elderwood','elderwood-upper']){
  const map=gridMap(region),visuals=buildingVisuals(region,map.objects);
  for(const object of map.objects.filter(o=>o.key.startsWith('furn-'))){const visual=visuals.find(v=>v.key===object.key&&v.footY===object.footY&&Math.abs((v.x+v.w/2)-(object.x+object.w/2))<1e-6)!;assert.ok(visual,object.key);assert.equal(visual.w,visual.h,object.key+' cannot stretch one axis');if(object.key!=='furn-tools-down')assert.ok(Math.abs(visual.y+visual.h-object.y-object.h)<1e-6,object.key+' stays planted');}
 }
 const visuals=buildingVisuals('elderwood',gridMap('elderwood').objects);
 for(const b of villageBuildings)for(let x=b.x+1;x<b.x+b.width-1;x++)for(const side of ['n','s']){const center=(x+.5)*48,count=visuals.filter(v=>v.wallFor===b.id&&v.wallSide===side&&v.key.startsWith('house-wall-')&&center>v.x&&center<v.x+v.w).length;assert.equal(count,side==='s'&&x>=b.x+b.door&&x<b.x+b.door+b.doorWidth?0:1,b.id+' wall coverage');}
});
