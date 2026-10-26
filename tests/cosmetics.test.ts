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
  const other=setup();assert.match(other.e.act('p',other.p,{kind:'cosmetics',cosmetics:{skin:'royal-guardian-female',wings:'divine',aura:'shadow'}},0),/updated/);other.profile.xp=totalXp(5);other.profile.level=5;other.e.act('p',other.p,{kind:'class',classId},0);assert.equal(cosmeticLook(other.profile.cosmetics,classId).skin,'royal-guardian-female');
 }
});
test('every themed outfit is available to every class without changing combat or belongings',()=>{
 for(const classId of ['citizen','knight','archer','mage','rogue'] as const){
  const {e,p,profile}=setup();if(classId!=='citizen'){profile.xp=totalXp(5);profile.level=5;e.act('p',p,{kind:'class',classId},0);}
  const before=structuredClone(profile),fighter=structuredClone(p);
  for(const skin of Object.keys(skinDefinitions) as SkinId[]){
   assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:{skin,wings:'divine',aura:'shadow'}},0),/updated/);assert.equal(cosmeticLook(profile.cosmetics,profile.classId).skin,skin);
   assert.deepEqual({...profile,cosmetics:before.cosmetics},before);assert.deepEqual(p,fighter);
   assert.deepEqual(readProgress(writeProgress(profile,0)).profile.cosmetics,profile.cosmetics);
   assert.deepEqual(readCosmeticLook(JSON.stringify(cosmeticLook(profile.cosmetics,profile.classId))),{skin,wings:'divine',aura:'shadow'});
  }
 }
});
test('wings and auras equip and clear without altering combat stats, items, gold or skills',()=>{
 const {e,p,profile}=setup(),before=structuredClone(profile),fighter=structuredClone(p);for(const wings of ['divine','dragon','forest','none'])for(const aura of ['divine','shadow','inferno','none'])assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:{skin:'citizen',wings,aura}},0),/updated/);assert.deepEqual({...profile,cosmetics:before.cosmetics},before);assert.deepEqual(p,fighter);assert.equal(profile.cosmetics.wings,'none');
 const snapshot=e.snapshot('p',0);snapshot.cosmetics.wings='dragon';assert.equal(profile.cosmetics.wings,'none');
});
test('invalid and forged cosmetics are rejected; old saves migrate and selections survive save/load',()=>{
 const {e,p,profile}=setup();for(const value of [null,[],{},'mage',{skin:'unknown',wings:'none',aura:'none'},{skin:'auto',wings:'bad',aura:'none'},{skin:'auto',wings:'none',aura:'bad'},{skin:'auto',wings:'none',aura:'none',attack:999}]){assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:value},0),/Choose/);assert.deepEqual(profile.cosmetics,defaultCosmetics());}
 e.act('p',p,{kind:'cosmetics',cosmetics:{skin:'celestial-knight',wings:'forest',aura:'shadow'}},0);const save=writeProgress(profile,0);assert.deepEqual(readProgress(save).profile.cosmetics,profile.cosmetics);const old=structuredClone(save);delete(old.profile as Partial<typeof profile>).cosmetics;assert.deepEqual(readProgress(old).profile.cosmetics,defaultCosmetics());(save.profile.cosmetics as {skin:string}).skin='invalid';assert.throws(()=>readProgress(save));assert.deepEqual(readCosmeticLook('{"skin":"mage","wings":"forest","aura":"shadow"}'),{skin:'mage',wings:'forest',aura:'shadow'});assert.equal(readCosmeticLook('{"skin":"evil"}').skin,'citizen');
});
test('retired cosmetic IDs migrate without invalidating saves, classes or belongings',()=>{
 const {e,profile}=setup();const save=writeProgress(profile,0);
 for(const [old,skin] of Object.entries({noble:'royal-guardian',adventurer:'citizen',merchant:'citizen',pirate:'blood-moon',nomad:'sand-nomad'})){
  const legacy=structuredClone(save);(legacy.profile as any).cosmetics={skin:old,wings:'dawn',aura:'radiance'};
  const restored=readProgress(legacy).profile;assert.deepEqual(restored.cosmetics,{skin,wings:'divine',aura:'divine'});assert.deepEqual({...restored,cosmetics:save.profile.cosmetics},save.profile);
 }
 assert.deepEqual(readCosmeticLook('{"skin":"nomad","wings":"fae","aura":"arcane"}'),{skin:'sand-nomad',wings:'forest',aura:'shadow'});
 assert.equal(Object.keys(skinDefinitions).length,30);assert.equal(Object.values(skinDefinitions).filter(d=>d.variant==='female').length,15);
 e.act('p',newFighter(),{kind:'cosmetics',cosmetics:{skin:'royal-guardian-female',wings:'crystal',aura:'blood'}},0);assert.deepEqual(profile.cosmetics,{skin:'royal-guardian-female',wings:'crystal',aura:'blood'});
});
