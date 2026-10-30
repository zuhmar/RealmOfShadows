import {townPoint} from '@realm/game-data';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isHousingFloor,gridMap,gridKey,gridSpawns,gridDirections,portalFor,stairsFor,regions,monsters} from '@realm/game-data';
import {move,legal,pathfind,occupiedCells,freeLanding,CombatSimulation,newFighter,inAttackRange} from '@realm/shared';
test('new grid maps connect all entrances, encounters and stairs on passable cells',()=>{
 for(const region of (Object.keys(regions) as (keyof typeof regions)[]).filter(r=>!isHousingFloor(r)&&r!=='woods-upper')){const map=gridMap(region),arrival=portalFor(region).arrival;assert.ok(legal(arrival,region),region+' arrival');assert.equal(map.cells.length,map.height);
  const targets=[...stairsFor(region).map(s=>({x:s.x,y:s.y+(s.id.startsWith('elderwood-rim-')?0:1)})),...(['woods','caverns','woods-depths','caverns-depths'].includes(region)?gridSpawns(region):[])];
  for(const target of targets){assert.ok(legal(target,region),region+JSON.stringify(target));assert.ok(pathfind(arrival,target,region).length||gridKey(arrival)===gridKey(target),region+JSON.stringify(target));}
 }
 for(const region of ['woods','caverns','woods-depths','caverns-depths'] as const){const spawns=gridSpawns(region);assert.equal(new Set(spawns.map(gridKey)).size,spawns.length);}
});
test('walking commits to neighboring cell centers, finishes on release, and rejects occupied cells and diagonal corners',()=>{
 let p={x:10.5,y:15.5,stamina:100};const input={x:1,y:0,sprint:false,seq:1};p=move(p,input,.05,'woods');assert.ok(p.x>10.5&&p.x<11.5);for(let i=0;i<8;i++)p=move(p,{...input,x:0},.05,'woods');assert.equal(p.x,11.5);assert.equal(p.y,15.5);
 assert.equal(move(p,input,.05,'woods',new Set(['12,15'])).x,p.x);
 const start={x:10.5,y:15.5,stamina:100},walls=new Set(['11,15']);assert.ok(move(start,{...input,y:1},.05,'woods',walls).y>start.y,'creatures block destinations, not diagonal side cells');
 const route=pathfind(start,{x:13.2,y:17.8},'woods',new Set(['11,15']));assert.ok(route.length);for(const point of route){assert.equal(point.x%1,.5);assert.equal(point.y%1,.5);assert.notEqual(gridKey(point),'11,15');}
});
test('eight monsters claim separate surrounding cells, can attack diagonally, and box a player until a cell opens',()=>{
 const sim=new CombatSimulation();sim.wolves.clear();const p=Object.assign(newFighter(),{region:'woods' as const,x:10.5,y:16.5,hp:100000});
 gridDirections.forEach(([dx,dy],i)=>{const x=p.x+dx*3,y=p.y+dy*3;sim.wolves.set('box-'+i,{id:'box-'+i,kind:'wolf',region:'woods',x,y,spawnX:x,spawnY:y,hp:65,mode:'chase',target:'p',facing:'down',attackAt:0,respawnAt:0,windupUntil:0,aimX:x,aimY:y});});
 for(let i=0;i<300;i++){sim.tick(.05,[['p',p]]);const reserved=[...sim.wolves.values()].map(w=>gridKey({x:w.stepX??w.x,y:w.stepY??w.y}));assert.equal(new Set(reserved).size,8,'no overlapping destinations');}
 assert.equal(new Set([...sim.wolves.values()].map(gridKey)).size,8);for(const w of sim.wolves.values()){assert.equal(Math.max(Math.abs(w.x-p.x),Math.abs(w.y-p.y)),1);assert.equal(w.mode,'attack');}assert.ok(p.hp<100000);
 const occupied=occupiedCells(sim.wolves.values(),'woods');for(const [x,y]of gridDirections){const next=move({...p,stamina:100},{x,y,sprint:false,seq:1},.05,'woods',occupied);assert.equal(next.x,p.x);assert.equal(next.y,p.y);}
 const east=[...sim.wolves.values()].find(w=>w.x===p.x+1&&w.y===p.y)!;sim.damage(east,1000);assert.ok(move({...p,stamina:100},{x:1,y:0,sprint:false,seq:2},.05,'woods',occupiedCells(sim.wolves.values(),'woods')).x>p.x);assert.ok(inAttackRange(p,{x:p.x+1,y:p.y+1},1));
});
test('four cardinal monsters leave diagonal escapes; all eight cells are needed for a full box',()=>{
 const p={x:10.5,y:16.5,stamina:100},occupied=new Set(['9,16','11,16','10,15','10,17']);
 const next=move(p,{x:1,y:1,sprint:false,seq:1},.05,'woods',occupied);assert.ok(next.x>p.x&&next.y>p.y);assert.ok(pathfind(p,{x:11.5,y:17.5},'woods',occupied).length);
});
test('arrivals choose a nearby free center and dead monsters do not reserve cells',()=>{
 const p=townPoint({x:16.5,y:15.5}),occupied=new Set([gridKey(p)]),landing=freeLanding(p,'elderwood',occupied);assert.notEqual(gridKey(landing),gridKey(p));assert.ok(legal(landing,'elderwood'));
 assert.equal(occupiedCells([{x:1.5,y:1.5,hp:0,region:'woods'}],'woods').size,0);
});
test('every placed prop has a standalone PNG and all eight island sets contain distinct native 32px materials',async()=>{
 const {readFileSync,existsSync}=await import('node:fs'),{createHash}=await import('node:crypto');
 for(const region of Object.keys(regions)){for(const prop of gridMap(region).objects)assert.ok(existsSync(new URL('../assets/world/objects/'+prop.key+'.png',import.meta.url)),prop.key);}
 const hashes=new Set<string>();for(const biome of ['elderwood','woods','caverns','swamp','tundra','celestial','peaks','fortress'])for(const material of ['ground','path','stone','water','bridge','wall']){const png=readFileSync(new URL(`../assets/world/terrain/${biome}/${material}.png`,import.meta.url));assert.equal(png.readUInt32BE(16),32);assert.equal(png.readUInt32BE(20),32);hashes.add(createHash('sha256').update(png).digest('hex'));}assert.equal(hashes.size,48);
});
