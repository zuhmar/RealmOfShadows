import {test} from 'node:test';
import assert from 'node:assert/strict';
import {regions,gridMap,portalFor,stairsFor,type RegionId} from '@realm/game-data';
import {minimapLayout,minimapMarkers,minimapFloor} from '../apps/client/src/minimap';

test('every map and floor fits the minimap without stretching or clipping',()=>{
 for(const region of Object.keys(regions) as RegionId[]){
  const m=gridMap(region),l=minimapLayout(region);
  assert.ok(l.scale>0);assert.ok(l.left>=8&&l.top>=8,region);
  assert.ok(l.left+l.width<=352.001&&l.top+l.height<=262.001,region);
  assert.ok(Math.abs(l.width/l.height-m.width/m.height)<.000001,region);
 }
});
test('minimap stairs belong to the current floor and portals appear only on surface maps',()=>{
 for(const region of Object.keys(regions) as RegionId[]){
  const markers=minimapMarkers(region),stairs=markers.filter(m=>m.kind==='stairs');
  assert.deepEqual(stairs.map(s=>[s.x,s.y]),stairsFor(region).map(s=>[s.x,s.y]));
  const portals=markers.filter(m=>m.kind==='portal');
  if(['elderwood','woods','caverns','swamp'].includes(region)){
   assert.equal(portals.length,1);assert.deepEqual([portals[0].x,portals[0].y],[portalFor(region).x,portalFor(region).y]);
  }else assert.equal(portals.length,0,region);
  for(const n of markers.filter(m=>m.kind==='npc'))assert.equal(n.region??'elderwood',region);
 }
});
test('floor indicators distinguish surface, cliffs, house stories and underground maps',()=>{
 assert.equal(minimapFloor('elderwood'),'G');assert.equal(minimapFloor('woods'),'G');
 assert.equal(minimapFloor('woods-upper'),'F1');assert.equal(minimapFloor('elderwood-upper'),'F1');
 assert.equal(minimapFloor('elderwood-homes-upper'),'F2');assert.equal(minimapFloor('elderwood-homes-attic'),'F3');
 assert.equal(minimapFloor('woods-depths'),'B1');assert.equal(minimapFloor('caverns-depths'),'B1');
});
test('following view keeps the player visible and preserves readable scale on large maps',()=>{
 for(const region of Object.keys(regions) as RegionId[]){
  const map=gridMap(region);
  for(const p of [{x:.5,y:.5},{x:map.width/2,y:map.height/2},{x:map.width-.5,y:map.height-.5}]){
   const l=minimapLayout(region,360,270,p),x=l.left+p.x*l.scale,y=l.top+p.y*l.scale;
   assert.ok(x>=8&&x<=352&&y>=8&&y<=262,region);
   assert.ok(l.scale>=Math.min(344/48,254/36),region);
  }
 }
 const a=minimapLayout('woods',360,270,{x:40,y:30}),b=minimapLayout('woods',360,270,{x:50,y:40});
 assert.ok(b.left<a.left&&b.top<a.top,'view scrolls with movement');
});
