import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftingStations,craftingStation,canUseCraftingStation,gridMap,portalFor,villageBuildings} from '@realm/game-data';
import {Economy,newFighter,pathfind,sight} from '@realm/shared';
test('four dedicated crafters stand behind distinct solid benches in one reachable crafting hall',()=>{
 const map=gridMap('elderwood'),npcs=craftingStations.filter(s=>'npc'in s),hall=villageBuildings.find(b=>b.id==='workshop')!;
 assert.equal(hall.name,'Crafting Hall');assert.equal(npcs.length,4);assert.equal(new Set(npcs.flatMap(s=>s.skills)).size,4);
 assert.equal(new Set(npcs.map(s=>s.bench.key)).size,4);
 assert.deepEqual(npcs.map(s=>[s.npc.x,s.npc.y]),[[2.5,12.5],[12.5,12.5],[2.5,17.5],[12.5,17.5]]);
 for(const x of [6,7,8])for(let y=13;y<18;y++)assert.equal(map.blocked.has(`${x},${y}`),false,'clear central aisle');
 for(const station of craftingStations){
  assert.equal(map.blocked.has(`${Math.floor(station.x)},${Math.floor(station.y)}`),false,station.id+' service point');
  assert.ok(pathfind(portalFor('elderwood').arrival,station,'elderwood').length,station.id+' entrance route');
  assert.ok(canUseCraftingStation({...station,region:'elderwood'},station));
  assert.equal(canUseCraftingStation({...station,region:'elderwood-upper'},station),false);
  if('npc'in station){
   assert.equal(station.building,'workshop');assert.equal(station.skills.length,1);
   assert.ok(map.blocked.has(`${Math.floor(station.npc.x)},${Math.floor(station.npc.y)}`));
   assert.equal(station.bench.cells.length,3);
   const nx=Math.floor(station.npc.x),ny=Math.floor(station.npc.y);
   const dx=nx<7?1:-1,dy=ny<15?1:-1;
   assert.deepEqual(new Set(station.bench.cells.map(([x,y])=>`${x},${y}`)),new Set([`${nx+dx},${ny}`,`${nx+dx},${ny+dy}`,`${nx},${ny+dy}`]));
   for(const [x,y]of station.bench.cells)assert.ok(map.blocked.has(`${x},${y}`),'three solid cells enclose corner NPC');
   assert.equal(map.objects.filter(o=>o.key===station.bench.key).length,1);
  }
 }
});
test('server crafting enforces each counter skill, room, range and sight without consuming rejected materials',()=>{
 const e=new Economy();e.join('a');const p=newFighter(),profile=e.profiles.get('a')!;
 const at=(id:string)=>Object.assign(p,{region:'elderwood',x:craftingStation(id)!.x,y:craftingStation(id)!.y});
 at('smithy');profile.inventory=[{id:1,item:'copperOre',quantity:3}];
 assert.ok(sight(p,craftingStation('smithy')!,'elderwood'));
 assert.match(e.act('a',p,{kind:'craft',item:'smelt-copper'},0),/Crafted/);assert.equal(profile.inventory[0].item,'copperBar');
 profile.inventory=[{id:2,item:'log',quantity:2}];const before=structuredClone(profile);
 assert.match(e.act('a',p,{kind:'craft',item:'cut-timber'},0),/matching crafting/);assert.deepEqual(profile,before);
 at('workshop');assert.match(e.act('a',p,{kind:'craft',item:'cut-timber'},0),/Crafted/);assert.equal(profile.inventory[0].item,'timber');
 profile.inventory=[{id:3,item:'rawFish',quantity:2}];const wrong=structuredClone(profile);assert.match(e.act('a',p,{kind:'craft',item:'cook-fish'},0),/matching crafting/);assert.deepEqual(profile,wrong);
 at('alchemy');profile.inventory=[{id:6,item:'herb',quantity:3}];assert.match(e.act('a',p,{kind:'craft',item:'brew-potion'},0),/Crafted/);
 at('cooking');profile.inventory=[{id:4,item:'rawFish',quantity:2}];assert.match(e.act('a',p,{kind:'craft',item:'cook-fish'},0),/Crafted/);
 profile.inventory=[{id:5,item:'log',quantity:2}];const rejected=structuredClone(profile);assert.match(e.act('a',p,{kind:'craft',item:'cut-timber'},0),/matching crafting/);assert.deepEqual(profile,rejected);
 for(const point of [{x:6.5,y:18.5},{x:25.5,y:6.5},{x:4.5,y:15.5,region:'woods'}]){Object.assign(p,{region:'elderwood'},point);assert.match(e.act('a',p,{kind:'craft',item:'smelt-copper'},0),/matching crafting/);assert.deepEqual(profile,rejected);}
});
