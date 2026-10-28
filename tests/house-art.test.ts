import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {buildingVisuals,gridMap,insideBuilding,villageBuildings,townView,townDoorTexture} from '@realm/game-data';
test('full house shells add roofs and upright walls without replacing collision footprints',()=>{
 const grid=gridMap('elderwood'),before=[...grid.blocked],edges=[...grid.edges],objects=buildingVisuals('elderwood',grid.objects);
 assert.equal(objects.filter(o=>o.roofFor).length,5);assert.ok(!objects.some(o=>/^(depot|village)-wall-/.test(o.key)));
 for(const b of villageBuildings){const roof=objects.find(o=>o.roofFor===b.id)!;assert.equal(roof.key,`house-roof-${b.id}`);assert.ok(roof.w>=b.width*48);assert.ok(objects.some(o=>o.wallFor===b.id&&o.wallSide==='s'));assert.ok(insideBuilding({x:b.x+1.5,y:b.y+1.5},b));assert.equal(insideBuilding({x:b.x+b.door+.5,y:b.y+b.height+.5},b),false);}
 assert.deepEqual([...grid.blocked],before);assert.deepEqual([...grid.edges],edges);assert.equal(buildingVisuals('elderwood',grid.objects,false).filter(o=>o.roofFor).length,0);
 for(const o of objects)assert.ok(existsSync(new URL(`../assets/world/objects/${o.key}.png`,import.meta.url)),o.key);
});
test('placed furniture has four purpose-drawn directional views with stable native canvases',()=>{
 for(const name of ['forge','workbench','counter','meeting','bookshelf','bed','table','armor','chest','chair','barrel','well','bench','planter','tools','stairsup','stairsdown'])for(const facing of ['down','left','right','up']){const data=readFileSync(new URL(`../assets/world/objects/furn-${name}-${facing}.png`,import.meta.url));assert.equal(data.readUInt32BE(16),96);assert.equal(data.readUInt32BE(20),96);}
 for(const side of ['n','e','s','w','nw','ne','sw','se']){const data=readFileSync(new URL(`../assets/world/objects/house-wall-${side}.png`,import.meta.url));assert.equal(data.readUInt32BE(16),side==='n'||side==='s'?128:64);assert.equal(data.readUInt32BE(20),side==='e'||side==='w'?64:80);}
});
test('elevated furniture keeps uniform scale and its floor anchor, and wall runs leave doors open',()=>{
 for(const region of ['elderwood','elderwood-upper']){
  const map=gridMap(region),visuals=buildingVisuals(region,map.objects);
  for(const object of map.objects.filter(o=>o.key.startsWith('furn-'))){const visual=visuals.find(v=>v.key===object.key&&v.footY===object.footY&&Math.abs((v.x+v.w/2)-(object.x+object.w/2))<1e-6)!;assert.ok(visual,object.key);assert.equal(visual.w,visual.h,object.key+' cannot stretch one axis');if(object.key!=='furn-tools-down')assert.ok(Math.abs(visual.y+visual.h-object.y-object.h)<1e-6,object.key+' stays planted');}
 }
 const visuals=buildingVisuals('elderwood',gridMap('elderwood').objects);
 for(const b of villageBuildings)for(let x=b.x+1;x<b.x+b.width-1;x++)for(const side of ['n','s']){const center=(x+.5)*48,count=visuals.filter(v=>v.wallFor===b.id&&!v.upperFor&&v.wallSide===side&&v.key.startsWith('house-wall-')&&center>v.x&&center<v.x+v.w).length;assert.equal(count,side==='s'&&x>=b.x+b.door&&x<b.x+b.door+b.doorWidth?0:1,b.id+' wall coverage');}
});

test('wall caps meet flush and upper-story shells support the Depot and Hall roofs',()=>{
 const ground=buildingVisuals('elderwood',gridMap('elderwood').objects);
 for(const b of villageBuildings){
  const upper=ground.filter(v=>v.upperFor===b.id),roof=ground.find(v=>v.roofFor===b.id)!;
  const stories=b.id==='depot'||b.id==='hall'?2:1;
  assert.equal(upper.length>0,stories===2,b.id+' upper shell');
  assert.equal(roof.y,(b.y-stories*townView.wallHeight)*48);
  for(let story=0;story<stories;story++){
   const shell=ground.filter(v=>v.wallFor===b.id&&!!v.upperFor===!!story);
   const nw=shell.find(v=>v.wallSide==='nw')!,sw=shell.find(v=>v.wallSide==='sw')!;
   const sides=shell.filter(v=>v.wallSide==='w').sort((a,b)=>a.y-b.y);
   assert.ok(Math.abs(sides[0].y-nw.y-townView.wallThickness*48)<1e-6);
   assert.ok(Math.abs(sides.at(-1)!.y+sides.at(-1)!.h-sw.y)<1e-6);
   for(let i=1;i<sides.length;i++)assert.ok(Math.abs(sides[i-1].y+sides[i-1].h-sides[i].y)<1e-6);
   for(const v of shell.filter(v=>v.key.startsWith('house-wall-')&&!['e','w'].includes(v.wallSide!))){
    const native=readFileSync(new URL(`../assets/world/objects/${v.key}.png`,import.meta.url));
    assert.equal(v.w/native.readUInt32BE(16),v.h/native.readUInt32BE(20),'wall artwork uses equal X/Y scale');
   }
  }
 }
 assert.equal(buildingVisuals('elderwood',gridMap('elderwood').objects,false).some(v=>v.upperFor),false,'editor cutaway exposes ground-floor furnishings');
 const upstairs=buildingVisuals('elderwood-upper',gridMap('elderwood-upper').objects);
 assert.equal(upstairs.some(v=>v.upperFor),false,'upstairs shows its own walls instead of a duplicate ground-floor shell');
 assert.equal(upstairs.filter(v=>v.roofFor).length,2);
});

test('windows belong to wall panels and fitted doors retain the exact grid opening',()=>{
 for(const region of ['elderwood','elderwood-upper']){
  const objects=buildingVisuals(region,gridMap(region).objects);
  assert.equal(objects.some(o=>o.key==='town-window'),false);
  for(const b of region==='elderwood'?villageBuildings:villageBuildings.filter(b=>b.id==='depot'||b.id==='hall')){
   for(const side of ['n','s'])assert.ok(objects.some(o=>o.wallFor===b.id&&o.wallSide===side&&o.key.endsWith('-window')),b.id+' integrated windows');
  }
 }
 for(const width of [2,3])for(const open of [true,false]){
  const png=readFileSync(new URL(`../assets/world/objects/${townDoorTexture(width,open)}.png`,import.meta.url));
  assert.equal(png.readUInt32BE(16),width*64);assert.equal(png.readUInt32BE(20),townView.wallHeight*64);
 }
});
