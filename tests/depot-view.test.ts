import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildingVisuals,gridMap,villageBuildings,townView,depotView,townDoorVisual,villageDoors} from '@realm/game-data';
test('Depot benchmark projects each story from unchanged ground anchors and keeps native part scales',()=>{
 const map=gridMap('elderwood'),blocked=[...map.blocked],visuals=buildingVisuals('elderwood',map.objects),b=villageBuildings.find(b=>b.id==='depot')!;
 for(const v of visuals.filter(v=>v.wallFor==='depot')){assert.ok(v.key.startsWith('house-depot-wall-'));const png=readFileSync(new URL(`../assets/world/objects/${v.key}.png`,import.meta.url));assert.ok(Math.abs(v.w/png.readUInt32BE(16)-.75)<1e-6,v.key+' native horizontal scale');assert.ok(Math.abs(v.h/png.readUInt32BE(20)-.75)<1e-6,v.key+' native vertical scale');}
 const lower=visuals.find(v=>v.wallFor==='depot'&&v.wallSide==='sw'&&!v.upperFor)!,upper=visuals.find(v=>v.wallFor==='depot'&&v.wallSide==='sw'&&v.upperFor)!;
 assert.equal(lower.x-upper.x,depotView.storyShift*48);assert.equal(lower.y-upper.y,townView.wallHeight*48);
 const roof=visuals.find(v=>v.roofFor==='depot'&&v.key.endsWith('back-nw'))!;assert.equal(roof.x,(b.x-townView.roofOverhang-2*depotView.storyShift)*48);
 assert.deepEqual([...map.blocked],blocked);assert.ok(visuals.some(v=>v.key.startsWith('house-depot-furniture-')));
 for(const v of visuals.filter(v=>v.wallFor&&v.wallFor!=='depot'))assert.ok(v.key.startsWith('house-depot-'));
});
test('projected Depot doors keep the physical opening and use the same shear as front walls',()=>{
 const door=villageDoors('elderwood').find(d=>d.id.endsWith('/depot'))!;for(const open of [false,true]){const v=townDoorVisual(door,open),png=readFileSync(new URL(`../assets/world/objects/${v.key}.png`,import.meta.url));assert.equal(v.x+depotView.frontGutter*48,(door.x-door.width/2)*48);assert.equal(v.w/png.readUInt32BE(16),v.h/png.readUInt32BE(20));assert.ok(v.key.startsWith('house-depot-door-'));}
});
