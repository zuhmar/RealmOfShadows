import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter} from '@realm/shared';
import {skinDefinitions,defaultCosmetics,cosmeticLook,readCosmeticLook,totalXp,type SkinId} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy();e.join('p');return {e,p:newFighter(),profile:e.profiles.get('p')!};};
test('automatic follows class choice while explicitly selected outfits stay independent',()=>{
 for(const classId of ['knight','archer','mage','rogue'] as const){
  const {e,p,profile}=setup();assert.deepEqual(profile.cosmetics,defaultCosmetics());assert.equal(cosmeticLook(profile.cosmetics,profile.classId).skin,'citizen');
  profile.xp=totalXp(5);profile.level=5;e.act('p',p,{kind:'class',classId},0);assert.equal(cosmeticLook(profile.cosmetics,profile.classId).skin,classId);
  const other=setup();assert.match(other.e.act('p',other.p,{kind:'cosmetics',cosmetics:{skin:'noble',wings:'dawn',aura:'arcane'}},0),/updated/);other.profile.xp=totalXp(5);other.profile.level=5;other.e.act('p',other.p,{kind:'class',classId},0);assert.equal(cosmeticLook(other.profile.cosmetics,classId).skin,'noble');
 }
});
test('every themed outfit is available to every class without changing combat or belongings',()=>{
 for(const classId of ['citizen','knight','archer','mage','rogue'] as const){
  const {e,p,profile}=setup();if(classId!=='citizen'){profile.xp=totalXp(5);profile.level=5;e.act('p',p,{kind:'class',classId},0);}
  const before=structuredClone(profile),fighter=structuredClone(p);
  for(const skin of Object.keys(skinDefinitions) as SkinId[]){
   assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:{skin,wings:'dawn',aura:'arcane'}},0),/updated/);assert.equal(cosmeticLook(profile.cosmetics,profile.classId).skin,skin);
   assert.deepEqual({...profile,cosmetics:before.cosmetics},before);assert.deepEqual(p,fighter);
   assert.deepEqual(readProgress(writeProgress(profile,0)).profile.cosmetics,profile.cosmetics);
   assert.deepEqual(readCosmeticLook(JSON.stringify(cosmeticLook(profile.cosmetics,profile.classId))),{skin,wings:'dawn',aura:'arcane'});
  }
 }
});
test('wings and auras equip and clear without altering combat stats, items, gold or skills',()=>{
 const {e,p,profile}=setup(),before=structuredClone(profile),fighter=structuredClone(p);for(const wings of ['dawn','ember','fae','none'])for(const aura of ['radiance','arcane','embers','none'])assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:{skin:'citizen',wings,aura}},0),/updated/);assert.deepEqual({...profile,cosmetics:before.cosmetics},before);assert.deepEqual(p,fighter);assert.equal(profile.cosmetics.wings,'none');
 const snapshot=e.snapshot('p',0);snapshot.cosmetics.wings='ember';assert.equal(profile.cosmetics.wings,'none');
});
test('invalid and forged cosmetics are rejected; old saves migrate and selections survive save/load',()=>{
 const {e,p,profile}=setup();for(const value of [null,[],{},'mage',{skin:'unknown',wings:'none',aura:'none'},{skin:'auto',wings:'bad',aura:'none'},{skin:'auto',wings:'none',aura:'bad'},{skin:'auto',wings:'none',aura:'none',attack:999}]){assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:value},0),/Choose/);assert.deepEqual(profile.cosmetics,defaultCosmetics());}
 e.act('p',p,{kind:'cosmetics',cosmetics:{skin:'merchant',wings:'fae',aura:'arcane'}},0);const save=writeProgress(profile,0);assert.deepEqual(readProgress(save).profile.cosmetics,profile.cosmetics);const old=structuredClone(save);delete(old.profile as Partial<typeof profile>).cosmetics;assert.deepEqual(readProgress(old).profile.cosmetics,defaultCosmetics());(save.profile.cosmetics as {skin:string}).skin='invalid';assert.throws(()=>readProgress(save));assert.deepEqual(readCosmeticLook('{"skin":"mage","wings":"fae","aura":"arcane"}'),{skin:'mage',wings:'fae',aura:'arcane'});assert.equal(readCosmeticLook('{"skin":"evil"}').skin,'citizen');
});
