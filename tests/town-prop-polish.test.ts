import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,buildingVisuals,buildingsFor,craftingStations} from '@realm/game-data';
import {legal,pathfind,move} from '@realm/shared';
test('Elderwood physical props have integral solid footprints and cannot be walked through',()=>{
 for(const region of ['elderwood','elderwood-upper'] as const){const map=gridMap(region);
 for(const object of map.objects){const f=object.footprint;if(!f)continue;
 for(const value of [f.x,f.y,f.width,f.height])assert.ok(Number.isInteger(value),object.key+' grid alignment');
 for(let y:number=f.y;y<f.y+f.height;y++)for(let x:number=f.x;x<f.x+f.width;x++){
 assert.ok(map.blocked.has(`${x},${y}`),object.key+' solid base');assert.equal(legal({x:x+.5,y:y+.5},region),false);
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const p={x:x+.5+dx,y:y+.5+dy,stamina:100};if(!legal(p,region))continue;const next=move(p,{x:-dx,y:-dy,sprint:false,seq:1},.05,region);assert.equal(next.x,p.x);assert.equal(next.y,p.y);}
 }
 }
 }
});
test('all unoccupied floor cells in every Elderwood room remain connected',()=>{
 for(const region of ['elderwood','elderwood-upper'] as const)for(const b of buildingsFor(region)){
 const start={x:b.x+b.door+.5,y:b.y+b.height-1.5};assert.ok(legal(start,region),b.id+' entrance');
 for(let y:number=b.y;y<b.y+b.height;y++)for(let x:number=b.x;x<b.x+b.width;x++){
 const goal={x:x+.5,y:y+.5};if(!legal(goal,region)||goal.x===start.x&&goal.y===start.y)continue;
 assert.ok(pathfind(start,goal,region).length,`${region}/${b.id} isolated floor ${x},${y}`);
 }
 }
});
test('side-facing furniture retains directional art and trees use a centered trunk footprint',()=>{
 for(const region of ['elderwood','elderwood-upper']){const map=gridMap(region),visuals=buildingVisuals(region,map.objects,false);
 for(const object of map.objects.filter(o=>/^furn-.*-(left|right|up)$/.test(o.key))){const visual=visuals.find(o=>o.key===object.key&&o.footY===object.footY);assert.ok(visual,object.key);assert.equal(visual.w,visual.h);}
 for(const object of map.objects.filter(o=>o.key==='elderwood-oak')){assert.equal(object.w,object.h);assert.equal(object.footprint!.x,object.x/48+1);assert.equal(object.footprint!.width,1);}
 }
 const map=gridMap('elderwood');for(const s of craftingStations)if('bench'in s)for(const [x,y]of s.bench.cells)assert.ok(map.blocked.has(`${x},${y}`),'corner counters preserved');
});

test('independent prop images preserve native PNG proportions across all current maps',()=>{
 for(const region of ['elderwood','elderwood-upper','woods','caverns','swamp','woods-depths','caverns-depths']){
 const map=gridMap(region),visuals=buildingVisuals(region,map.objects,false);
 for(const object of map.objects){if(/sign|wall|floor|window|craft-bench|furn-tools/.test(object.key))continue;
 const visual=visuals.find(v=>v.key===object.key&&v.footY===object.footY);if(!visual)continue;
 const png=readFileSync(new URL(`../assets/world/objects/${object.key}.png`,import.meta.url));
 assert.ok(Math.abs(visual.w/png.readUInt32BE(16)-visual.h/png.readUInt32BE(20))<1e-8,object.key+' uniform native scale');
 assert.ok(Math.abs(visual.y+visual.h-object.y-object.h)<1e-8,object.key+' baseline');
 }
 }
});
