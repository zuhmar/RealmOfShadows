import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter} from '@realm/shared';
import {defaultCosmetics,cosmeticLook,readCosmeticLook,totalXp} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy();e.join('p');return {e,p:newFighter(),profile:e.profiles.get('p')!};};
test('class outfits unlock with class choice and automatic skin follows the class',()=>{
 for(const classId of ['knight','archer','mage','rogue'] as const){const {e,p,profile}=setup();assert.deepEqual(profile.cosmetics,defaultCosmetics());assert.equal(cosmeticLook(profile.cosmetics,profile.classId).skin,'citizen');assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:{skin:classId,wings:'none',aura:'none'}},0),/Choose/);profile.xp=totalXp(5);profile.level=5;e.act('p',p,{kind:'class',classId},0);assert.equal(cosmeticLook(profile.cosmetics,profile.classId).skin,classId);assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:{skin:classId,wings:'dawn',aura:'arcane'}},0),/updated/);assert.equal(profile.cosmetics.skin,classId);}
});
test('wings and auras equip and clear without altering combat stats, items, gold or skills',()=>{
 const {e,p,profile}=setup(),before=structuredClone(profile),fighter=structuredClone(p);for(const wings of ['dawn','ember','fae','none'])for(const aura of ['radiance','arcane','embers','none'])assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:{skin:'citizen',wings,aura}},0),/updated/);assert.deepEqual({...profile,cosmetics:before.cosmetics},before);assert.deepEqual(p,fighter);assert.equal(profile.cosmetics.wings,'none');
 const snapshot=e.snapshot('p',0);snapshot.cosmetics.wings='ember';assert.equal(profile.cosmetics.wings,'none');
});
test('invalid and forged cosmetics are rejected; old saves migrate and selections survive save/load',()=>{
 const {e,p,profile}=setup();for(const value of [null,[],{},'mage',{skin:'mage',wings:'none',aura:'none'},{skin:'auto',wings:'bad',aura:'none'},{skin:'auto',wings:'none',aura:'bad'},{skin:'auto',wings:'none',aura:'none',attack:999}]){assert.match(e.act('p',p,{kind:'cosmetics',cosmetics:value},0),/Choose/);assert.deepEqual(profile.cosmetics,defaultCosmetics());}
 e.act('p',p,{kind:'cosmetics',cosmetics:{skin:'citizen',wings:'fae',aura:'arcane'}},0);const save=writeProgress(profile,0);assert.deepEqual(readProgress(save).profile.cosmetics,profile.cosmetics);const old=structuredClone(save);delete(old.profile as Partial<typeof profile>).cosmetics;assert.deepEqual(readProgress(old).profile.cosmetics,defaultCosmetics());save.profile.cosmetics.skin='mage';assert.throws(()=>readProgress(save));assert.deepEqual(readCosmeticLook('{"skin":"mage","wings":"fae","aura":"arcane"}'),{skin:'mage',wings:'fae',aura:'arcane'});assert.equal(readCosmeticLook('{"skin":"evil"}').skin,'citizen');
});
