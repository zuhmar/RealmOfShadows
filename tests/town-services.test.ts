import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftingStations,craftingStation,canUseCraftingStation,gridMap,portalFor} from '@realm/game-data';
import {Economy,newFighter,pathfind,sight} from '@realm/shared';
test('indoor services reserve NPC cells and keep their work areas reachable through the doors',()=>{
 const map=gridMap('elderwood');
 for(const station of craftingStations){
  assert.equal(map.blocked.has(`${Math.floor(station.x)},${Math.floor(station.y)}`),false,station.id+' service point');
  assert.ok(pathfind(portalFor('elderwood').arrival,station,'elderwood').length,station.id+' entrance route');
  assert.ok(canUseCraftingStation({...station,region:'elderwood'},station));
  assert.equal(canUseCraftingStation({...station,region:'elderwood-upper'},station),false);
  if('npc'in station)assert.ok(map.blocked.has(`${Math.floor(station.npc.x)},${Math.floor(station.npc.y)}`));
 }
});
test('server crafting enforces station skills, room, range and sight without consuming rejected materials',()=>{
 const e=new Economy();e.join('a');const p=newFighter(),profile=e.profiles.get('a')!;
 Object.assign(p,{region:'elderwood',x:25.5,y:6.5});profile.inventory=[{id:1,item:'copperOre',quantity:3}];
 assert.ok(sight(p,craftingStation('smithy')!,'elderwood'));
 assert.match(e.act('a',p,{kind:'craft',item:'smelt-copper'},0),/Crafted/);assert.equal(profile.inventory[0].item,'copperBar');
 profile.inventory=[{id:2,item:'log',quantity:2}];const before=structuredClone(profile);
 assert.match(e.act('a',p,{kind:'craft',item:'cut-timber'},0),/matching crafting/);assert.deepEqual(profile,before);
 Object.assign(p,{x:6.5,y:14.5});assert.match(e.act('a',p,{kind:'craft',item:'cut-timber'},0),/Crafted/);assert.equal(profile.inventory[0].item,'timber');
 profile.inventory=[{id:3,item:'herb',quantity:3}];assert.match(e.act('a',p,{kind:'craft',item:'brew-potion'},0),/Crafted/);
 profile.inventory=[{id:4,item:'rawFish',quantity:2}];assert.match(e.act('a',p,{kind:'craft',item:'cook-fish'},0),/Crafted/);
 profile.inventory=[{id:5,item:'copperOre',quantity:3}];const rejected=structuredClone(profile);assert.match(e.act('a',p,{kind:'craft',item:'smelt-copper'},0),/matching crafting/);assert.deepEqual(profile,rejected);
 for(const point of [{x:6.5,y:16.5},{x:25.5,y:8.5},{x:25.5,y:5.5,region:'woods'}]){Object.assign(p,{region:'elderwood'},point);assert.match(e.act('a',p,{kind:'craft',item:'smelt-copper'},0),/matching crafting/);assert.deepEqual(profile,rejected);}
});
