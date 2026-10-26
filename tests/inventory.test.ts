import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter} from '@realm/shared';
import {inventoryUsage,inventoryRules,merchant,totalXp,catalogueSellPrice,droppedSellPrice,type GearInstance} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy(()=>0);e.join('p');const p=newFighter(),profile=e.profiles.get('p')!;return {e,p,profile};};
const item=():GearInstance=>({id:crypto.randomUUID(),base:'clothTunic',rarity:'uncommon'});
const fill=(profile:ReturnType<typeof setup>['profile'])=>{while(inventoryUsage(profile)<inventoryRules.capacity)profile.gear.push(item());};
test('one 32-slot bag counts catalogue gear, monster items and supply stacks, excluding equipped items',()=>{
 const {e,p,profile}=setup();assert.equal(inventoryUsage(profile),8);profile.inventory=[{id:1,item:'pelt',quantity:20}];profile.gear.push(item());assert.equal(inventoryUsage(profile),10);
 e.act('p',p,{kind:'equip-item',item:'clothTunic'},0);assert.equal(inventoryUsage(profile),9);e.act('p',p,{kind:'equip-gear',item:profile.gear[0].id},0);assert.equal(inventoryUsage(profile),9);assert.equal(e.snapshot('p',0).usedSlots,9);assert.equal(e.snapshot('p',0).capacity,32);
});
test('full bags reject pickups atomically but permit filling an existing stack',()=>{
 const {e,p,profile}=setup();Object.assign(p,{region:'woods',x:5,y:5});profile.inventory=[{id:1,item:'pelt',quantity:19}];fill(profile);e.drops.set('loot',{id:'loot',owner:'p',region:'woods',x:5,y:5,gold:5,pelts:1,gear:item(),expires:90});
 assert.match(e.act('p',p,{kind:'pickup',drop:'loot'},0),/Inventory full/);assert.equal(profile.gold,0);assert.equal(profile.inventory[0].quantity,19);assert.ok(e.drops.has('loot'));delete e.drops.get('loot')!.gear;e.act('p',p,{kind:'pickup',drop:'loot'},0);assert.equal(profile.gold,5);assert.equal(profile.inventory[0].quantity,20);assert.equal(inventoryUsage(profile),32);
});
test('full bags block purchases, unequipping and class rewards without charging or changing state',()=>{
 const {e,p,profile}=setup();Object.assign(p,merchant);profile.level=5;profile.xp=totalXp(5);profile.gold=10000;e.act('p',p,{kind:'equip-item',item:'clothTunic'},0);fill(profile);const before=writeProgress(profile,0);
 for(const action of [{kind:'buy'},{kind:'buy-equipment',item:'copperArmor'},{kind:'unequip-item',slot:'chest'},{kind:'class',classId:'knight'}])assert.match(e.act('p',p,action,0),/Inventory full/);
 assert.deepEqual(writeProgress(profile,0),before);e.act('p',p,{kind:'discard-gear',item:profile.gear[0].id},0);assert.match(e.act('p',p,{kind:'class',classId:'knight'},0),/chose Knight/);assert.equal(inventoryUsage(profile),32);
});
test('equipment sells only to Mara, cannot sell equipped/foreign items, and sale credits once',()=>{
 const {e,p,profile}=setup();const gear=item();profile.gear.push(gear);assert.match(e.act('p',p,{kind:'sell-gear',item:gear.id},0),/Visit Mara/);Object.assign(p,merchant);const price=droppedSellPrice(gear);e.act('p',p,{kind:'sell-gear',item:gear.id,price:9999},0);e.act('p',p,{kind:'sell-gear',item:gear.id},0);assert.equal(profile.gold,price);assert.equal(profile.gear.length,0);
 assert.match(e.act('p',p,{kind:'sell-equipment',item:'wand'},0),/Unequip/);e.act('p',p,{kind:'sell-equipment',item:'sword'},0);assert.equal(profile.gold,price);assert.equal(catalogueSellPrice('sword'),0);assert.ok(!profile.ownedWeapons.includes('sword'));
 e.act('p',p,{kind:'buy-equipment',item:'sword'},0);e.act('p',p,{kind:'sell-equipment',item:'sword'},0);assert.equal(profile.gold,price);assert.match(e.act('p',p,{kind:'sell-equipment',item:'__proto__'},0),/valid/);
});
test('legacy overflowing saves retain every item, cannot increase occupancy, and selling recovers room',()=>{
 const {e,p,profile}=setup();Object.assign(p,merchant);profile.gear=Array.from({length:32},item);profile.gold=10000;const loaded=readProgress(writeProgress(profile,0));assert.equal(loaded.profile.gear.length,32);assert.equal(inventoryUsage(loaded.profile),40);
 assert.match(e.act('p',p,{kind:'buy'},0),/Inventory full/);const id=profile.gear[0].id;e.act('p',p,{kind:'sell-gear',item:id},0);assert.equal(inventoryUsage(profile),39);assert.equal(readProgress(writeProgress(profile,0)).profile.gear.length,31);
});

test('Mara buys supply stacks including potions once at server prices',()=>{
 const {e,p,profile}=setup();profile.inventory=[{id:1,item:'potion',quantity:10}];assert.match(e.act('p',p,{kind:'sell-supply',item:'1'},0),/Visit Mara/);Object.assign(p,merchant);e.act('p',p,{kind:'sell-supply',item:'1',quantity:999,price:999},0);e.act('p',p,{kind:'sell-supply',item:'1'},0);assert.equal(profile.gold,30);assert.equal(profile.inventory.length,0);
});
