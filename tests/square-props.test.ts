import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {gridMap,buildingVisuals,isBuildingFloor} from '@realm/game-data';
test('every rendered map prop has a square runtime PNG and square world canvas',()=>{
 for(const region of ['elderwood','elderwood-upper','woods','caverns','swamp','woods-depths','caverns-depths'])for(const p of buildingVisuals(region,gridMap(region).objects)){
 if(p.roofFor||p.wallFor||p.signFor||isBuildingFloor(p.key))continue;
 assert.equal(p.w,p.h,`${region}/${p.key} square display`);
 const padded=new URL(`../assets/world/square-props/${p.key}.png`,import.meta.url),file=existsSync(padded)?padded:new URL(`../assets/world/objects/${p.key}.png`,import.meta.url),png=readFileSync(file);
 assert.equal(png.readUInt32BE(16),png.readUInt32BE(20),p.key+' square PNG');
 }
});
