import {test} from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
import{buildingVisuals,gridMap,resourceNodes}from'@realm/game-data';import{elderwoodPropTexture}from'../packages/game-data/src/elderwood-prop-art';
test('all twenty-four cardinal prop views are native square RGBA frames with distinct purpose-drawn directions',()=>{
 for(const family of ['chest','bed','bench','tools','table','armor']){const hashes=new Set();for(const facing of ['down','left','right','up']){const png=readFileSync(new URL(`../assets/world/objects/elderwood-prop-${family}-${facing}.png`,import.meta.url));assert.equal(png.readUInt32BE(16),96);assert.equal(png.readUInt32BE(20),96);assert.equal(png[25],6);hashes.add(createHash('sha256').update(png).digest('hex'));}assert.equal(hashes.size,4,family+' has four real views');}
});
test('regional prop replacement keeps original floor anchors, scale and collision, including complete bench sprites',()=>{
 for(const region of ['elderwood','elderwood-upper','elderwood-homes-upper','elderwood-homes-attic']){const map=gridMap(region),blocked=[...map.blocked],visuals=buildingVisuals(region,map.objects,false);
  for(const o of map.objects.filter(o=>/^furn-(chest|bed|bench|tools|table|armor)-/.test(o.key))){const v=visuals.find(v=>v.sourceKey===o.key&&v.footY===o.footY)!;assert.ok(v,o.key);assert.equal(v.key,elderwoodPropTexture(o.key,region));assert.equal(v.w,v.h);assert.equal(v.y+v.h,o.y+o.h);}
  assert.deepEqual([...map.blocked],blocked);
 }
 for(const key of ['furn-bed-down','furn-chest-left','furn-bench-up','furn-tools-right','furn-table-left','furn-armor-left'])assert.equal(elderwoodPropTexture(key,'woods'),key);
 assert.equal(resourceNodes.some(n=>n.region==='elderwood'),false,'Elderwood remains fishing-only');
});
