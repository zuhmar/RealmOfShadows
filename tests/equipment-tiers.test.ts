import {test} from 'node:test';
import assert from 'node:assert/strict';
import {equipmentTiers,equipmentItems,weapons,equipmentSlots,merchant,totalXp,type EquipmentTier} from '@realm/game-data';
import {Economy,newFighter} from '@realm/shared';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
test('seven shared tiers each supply seven slots and four weapon styles',()=>{
 for(const tier of Object.keys(equipmentTiers) as EquipmentTier[]){
 const armor=Object.values(equipmentItems).filter(i=>i.tier===tier),arms=Object.values(weapons).filter(i=>i.tier===tier);
 assert.equal(armor.length,7);assert.deepEqual(armor.map(i=>i.slot).sort(),Object.keys(equipmentSlots).sort());assert.equal(arms.length,4);assert.deepEqual(arms.map(i=>i.skill).sort(),['distance','magic','melee','melee']);
 }
});
test('merchant purchases require proximity, level, gold and unique ownership',()=>{
 const e=new Economy();e.join('p');const profile=e.profiles.get('p')!,p=newFighter();
 assert.match(e.act('p',p,{kind:'buy-equipment',item:'ironArmor'},0),/Visit Mara/);
 Object.assign(p,{region:'elderwood',x:merchant.x,y:merchant.y});
 assert.match(e.act('p',p,{kind:'buy-equipment',item:'ironArmor'},0),/Reach level 11/);
 profile.xp=totalXp(11);profile.level=11;
 assert.match(e.act('p',p,{kind:'buy-equipment',item:'ironArmor'},0),/costs/);
 profile.gold=1000;e.act('p',p,{kind:'buy-equipment',item:'ironArmor'},0);assert.equal(profile.gold,820);
 e.act('p',p,{kind:'buy-equipment',item:'ironArmor'},0);assert.equal(profile.gold,820);assert.equal(profile.ownedEquipment.filter(i=>i==='ironArmor').length,1);
 e.act('p',p,{kind:'equip-item',item:'ironArmor'},0);assert.equal(profile.equipment.chest,'ironArmor');assert.equal(p.armor,4);
 assert.match(e.act('p',p,{kind:'buy-equipment',item:'__proto__'},0),/valid equipment/);
});
test('all classes can buy, equip and save every tier without changing learned spells',()=>{
 for(const classId of ['knight','archer','mage','rogue'] as const){
 const e=new Economy();e.join('p');const profile=e.profiles.get('p')!,p=newFighter();profile.xp=totalXp(100);profile.level=100;profile.gold=1000000;Object.assign(p,{x:merchant.x,y:merchant.y});
 e.act('p',p,{kind:'class',classId},0);
 for(const [id,item]of Object.entries({...equipmentItems,...weapons})){
 e.act('p',p,{kind:'buy-equipment',item:id},0);
 e.act('p',p,'armor'in item?{kind:'equip-item',item:id}:{kind:'equip',weapon:id},0);
 }
 const loaded=readProgress(writeProgress(profile,0)).profile;assert.equal(loaded.ownedEquipment.length,49);assert.equal(loaded.ownedWeapons.length,28);assert.equal(loaded.weapon,'shadowDaggers');assert.equal(loaded.equipment.chest,'shadowArmor');assert.deepEqual(loaded.learnedSpells,[]);
 }
});
