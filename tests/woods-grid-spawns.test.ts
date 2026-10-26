import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,gridKey,gridSpawns,portalFor,monsters} from '@realm/game-data';
import {legal,pathfind} from '@realm/shared';
import {woodsGridEncounters} from '../packages/game-data/src/woods-grid-spawns';

test('Woods encounters cover separate habitats and approach paths with room between monsters',()=>{
 const spawns=gridSpawns('woods'),map=gridMap('woods'),portal=portalFor('woods');
 assert.equal(spawns.length,28);assert.equal(new Set(spawns.map(gridKey)).size,28);
 for(const [kind,area]of Object.entries(woodsGridEncounters)){
  const group=spawns.filter(s=>s.kind===kind);assert.equal(group.length,kind==='bear'?1:9);
  for(const s of group){
   assert.ok(legal(s,'woods'),s.id);assert.ok(pathfind(portal.arrival,s,'woods').length,s.id+' reachable');
   assert.ok(Math.hypot(s.x-portal.x,s.y-portal.y)>8,s.id+' clear of sanctuary');
   if(kind==='wolf')assert.ok(s.x<28&&s.y<22);
   if(kind==='spider')assert.ok(s.x<28&&s.y>24);
   if(kind==='boar')assert.ok(s.x>42&&s.y<24);
   if(kind==='bear')assert.ok(s.x>49&&s.x<62&&s.y>30&&s.y<41,'boss stays enclosed');
  }
  for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)assert.ok(Math.hypot(group[i].x-group[j].x,group[i].y-group[j].y)>=3,group[i].id+' / '+group[j].id);
  if(!monsters[group[0].kind].boss){
   assert.ok(area.habitat.length>=4);assert.ok(area.approach.length>=4);
   for(const [x,y]of area.approach)assert.equal(map.cells[y][x],1,kind+' approach uses the local path');
   assert.ok(Math.max(...group.map(s=>s.x))-Math.min(...group.map(s=>s.x))>=14);
   assert.ok(Math.max(...group.map(s=>s.y))-Math.min(...group.map(s=>s.y))>=12);
  }
 }
});
