import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildingVisuals,housingVisuals,gridMap,playerHouses,houseBaseRegion,townDoorVisual,villageDoors} from '@realm/game-data';
test('all Elderwood buildings and thirty houses use projected parts at native scale on every floor',()=>{
 const houses=new Set<string>();
 for(const region of ['elderwood','elderwood-upper','elderwood-homes-upper','elderwood-homes-attic']){
  const map=gridMap(region),blocked=[...map.blocked],edges=[...map.edges],visuals=buildingVisuals(region,map.objects);
  for(const v of visuals.filter(v=>v.wallFor||v.houseWallSide||v.houseDoor)){
   assert.ok(v.key.startsWith('house-depot-'),v.key);const png=readFileSync(new URL(`../assets/world/objects/${v.key}.png`,import.meta.url));
   assert.ok(Math.abs(v.w/png.readUInt32BE(16)-.75)<1e-6,v.key+' horizontal scale');assert.ok(Math.abs(v.h/png.readUInt32BE(20)-.75)<1e-6,v.key+' vertical scale');
   if(v.houseFor)houses.add(v.houseFor);
  }
  assert.deepEqual([...map.blocked],blocked);assert.deepEqual([...map.edges],edges);
 }
 assert.equal(houses.size,30);
 for(const h of playerHouses){const door=housingVisuals(houseBaseRegion(h)).find(v=>v.houseDoor===h.id)!;assert.equal(door.x+12,(h.door.x-.5)*48);assert.equal(door.w,60);}
});
test('every village door shares its front wall projection and every house retains window and ownership metadata',()=>{
 for(const door of villageDoors('elderwood'))for(const open of [false,true])assert.ok(townDoorVisual(door,open).key.startsWith('house-depot-door-'));
 for(const region of ['elderwood','elderwood-upper'])for(const v of housingVisuals(region).filter(v=>v.windowAt)){
  assert.ok(v.houseFor&&v.houseWallSide);assert.ok(v.key.endsWith('-window'));assert.equal(v.windowAt!.building,v.houseFor);
 }
});
