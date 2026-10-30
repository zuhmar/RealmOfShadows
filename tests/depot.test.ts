import {townPoint,elderwoodTown} from '@realm/game-data';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter,legal,pathfind} from '@realm/shared';
import {depotBoxes,depotRules,depotUsage,inventoryUsage,gridMap,gearStats,portalFor} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy();e.join('p');return {e,profile:e.profiles.get('p')!,p:Object.assign(newFighter(),townPoint({x:20.5,y:17.5}))};};
const gear=()=>({id:crypto.randomUUID(),base:'clothTunic' as const,rarity:'legendary' as const});
test('Depot is a visible walk-in village room with solid walls and accessible personal boxes',()=>{
 const map=gridMap('elderwood');assert.ok(!map.objects.some(o=>o.key==='elderwood-tavern'));assert.ok(map.objects.some(o=>o.key==='depot-sign'));assert.ok(map.objects.filter(o=>o.key==='depot-floor').length>=30);
 for(const box of depotBoxes){assert.equal(legal(box),false);assert.ok(pathfind(portalFor('elderwood').arrival,{x:box.x,y:box.y+1}).length);}
 assert.ok(legal(townPoint({x:24.5,y:23.5})));assert.ok(legal(townPoint({x:24.5,y:19.5})));assert.equal(legal(townPoint({x:17.5,y:18.5})),true);
});
test('all item categories deposit and withdraw atomically; rolled gear retains identity and bonuses',()=>{
 const {e,p,profile}=setup(),g=gear(),stats=gearStats(g);profile.gear.push(g);profile.inventory=[{id:10,item:'pelt',quantity:5}];e.serial=10;
 for(const [category,item]of [['supply','10'],['gear',g.id],['equipment','clothTunic'],['weapon','sword']])assert.match(e.act('p',p,{kind:'depot-deposit',category,item},0),/deposited/);
 assert.equal(depotUsage(profile.depot),4);assert.equal(profile.inventory.length,0);assert.equal(profile.gear.length,0);assert.deepEqual(gearStats(profile.depot.gear[0]),stats);
 for(const [category,item]of [['supply',String(profile.depot.supplies[0].id)],['gear',g.id],['equipment','clothTunic'],['weapon','sword']])assert.match(e.act('p',p,{kind:'depot-withdraw',category,item},0),/withdrawn/);
 assert.equal(depotUsage(profile.depot),0);assert.equal(profile.inventory[0].quantity,5);assert.equal(profile.gear[0].id,g.id);assert.deepEqual(gearStats(profile.gear[0]),stats);
});
test('requests require proximity and ownership; equipped gear and repeated or forged transfers cannot duplicate items',()=>{
 const {e,p,profile}=setup();assert.match(e.act('p',p,{kind:'depot-deposit',category:'weapon',item:'wand'},0),/Unequip/);
 e.act('p',p,{kind:'equip-item',item:'clothTunic'},0);assert.match(e.act('p',p,{kind:'depot-deposit',category:'equipment',item:'clothTunic'},0),/Unequip/);
 const g=gear();profile.gear.push(g);e.act('p',p,{kind:'equip-gear',item:g.id},0);assert.match(e.act('p',p,{kind:'depot-deposit',category:'gear',item:g.id},0),/Unequip/);e.act('p',p,{kind:'unequip-gear',item:g.id},0);
 p.region='woods';assert.match(e.act('p',p,{kind:'depot-deposit',category:'gear',item:g.id},0),/Walk inside/);p.region='elderwood';p.x=16.5+elderwoodTown.x;assert.match(e.act('p',p,{kind:'depot-deposit',category:'gear',item:g.id},0),/Walk inside/);p.x=20.5+elderwoodTown.x;
 assert.match(e.act('p',p,{kind:'depot-deposit',category:'gear',item:g.id,box:'fake'},0),/Walk inside/);assert.match(e.act('p',p,{kind:'depot-deposit',category:'gear',item:g.id},0),/deposited/);assert.match(e.act('p',p,{kind:'depot-deposit',category:'gear',item:g.id},0),/do not own/);
 e.act('p',p,{kind:'depot-withdraw',category:'gear',item:g.id},0);e.act('p',p,{kind:'depot-withdraw',category:'gear',item:g.id},0);assert.equal(profile.gear.filter(i=>i.id===g.id).length,1);
});
test('full bag and full storage reject transfers without losing items, and existing stacks can still merge',()=>{
 const {e,p,profile}=setup();profile.depot.gear.push(gear());while(inventoryUsage(profile)<32)profile.gear.push(gear());const before=writeProgress(profile,0);assert.match(e.act('p',p,{kind:'depot-withdraw',category:'gear',item:profile.depot.gear[0].id},0),/bag is full/);assert.deepEqual(writeProgress(profile,0),before);
 profile.depot.gear=Array.from({length:depotRules.capacity},gear);assert.match(e.act('p',p,{kind:'depot-deposit',category:'gear',item:profile.gear[0].id},0),/storage is full/);assert.equal(depotUsage(profile.depot),100);
 profile.depot.gear.pop();profile.depot.supplies=[{id:500,item:'pelt',quantity:19}];profile.inventory=[{id:501,item:'pelt',quantity:1}];e.serial=501;assert.match(e.act('p',p,{kind:'depot-deposit',category:'supply',item:'501'},0),/deposited/);assert.equal(depotUsage(profile.depot),100);assert.equal(profile.depot.supplies[0].quantity,20);
});
test('private storage survives save/load; old saves migrate and duplicate or forged ownership is rejected',()=>{
 const {profile}=setup();profile.depot.gear=[gear()];profile.depot.supplies=[{id:50,item:'potion',quantity:3}];profile.depot.equipment=['clothHood'];profile.depot.weapons=['sword'];const saved=writeProgress(profile,0);assert.deepEqual(readProgress(saved).profile.depot,profile.depot);
 const old=structuredClone(saved);delete (old.profile as Partial<typeof profile>).depot;assert.equal(depotUsage(readProgress(old).profile.depot),0);
 for(const change of [(s:typeof saved)=>s.profile.gear.push(s.profile.depot.gear[0]),(s:typeof saved)=>s.profile.inventory.push(s.profile.depot.supplies[0]),(s:typeof saved)=>(s.profile.depot.gear[0] as any).attack=999,(s:typeof saved)=>s.profile.depot.gear=Array.from({length:101},gear)]){const corrupt=structuredClone(saved);change(corrupt);assert.throws(()=>readProgress(corrupt));}
});
