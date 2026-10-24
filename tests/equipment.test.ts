import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter,CombatSimulation} from '@realm/shared';
import {readAppearance,emptyEquipment,starterEquipment,combat as C} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy();e.join('p');return {e,p:newFighter(),profile:e.profiles.get('p')!};};
test('equipment checks ownership, slot and combat state; snapshots cannot mutate ownership',()=>{
 const {e,p,profile}=setup();assert.equal(e.snapshot('p',0).armor,0);
 for(const item of ['__proto__','missing','sword'])assert.match(e.act('p',p,{kind:'equip-item',item},0),/do not own/);
 profile.ownedEquipment=profile.ownedEquipment.filter(id=>id!=='woodenShield');assert.match(e.act('p',p,{kind:'equip-item',item:'woodenShield'},0),/do not own/);
 assert.match(e.act('p',p,{kind:'equip-item',item:'clothTunic',slot:'ring',armor:999},0),/equipped/);assert.equal(profile.equipment.chest,'clothTunic');assert.equal(profile.equipment.ring,null);assert.equal(p.armor,1);
 p.auto=true;assert.match(e.act('p',p,{kind:'equip-item',item:'clothHood'},0),/Stop attacking/);assert.match(e.act('p',p,{kind:'unequip-item',slot:'chest'},0),/Stop attacking/);assert.equal(p.armor,1);
 p.auto=false;assert.match(e.act('p',p,{kind:'unequip-item',slot:'__proto__'},0),/Choose/);e.act('p',p,{kind:'unequip-item',slot:'chest'},0);assert.equal(p.armor,0);assert.ok(profile.ownedEquipment.includes('clothTunic'));
 const snapshot=e.snapshot('p',0);snapshot.equipment.chest='clothTunic';snapshot.ownedEquipment.length=0;assert.equal(profile.equipment.chest,null);assert.ok(profile.ownedEquipment.length);
 p.hp=0;assert.match(e.act('p',p,{kind:'equip-item',item:'clothHood'},0),/defeated/);
});
test('armor from equipped items reduces wolf hits; unequipping restores damage',()=>{
 for(const armored of [false,true]){const {e,p}=setup();if(armored)for(const item of starterEquipment)e.act('p',p,{kind:'equip-item',item},0);
 const sim=new CombatSimulation(),wolf=sim.wolves.get('wolf-1')!;sim.wolves.clear();sim.wolves.set(wolf.id,wolf);Object.assign(p,{region:'woods',x:wolf.x,y:wolf.y});wolf.target='p';wolf.mode='attack';
 sim.tick(.05,[['p',p]]);assert.equal(p.hp,C.playerHp-C.wolf.damage+(armored?5:0));assert.equal(sim.events.find(event=>event.kind==='hit')?.damage,C.wolf.damage-(armored?5:0));
 }
});
test('equipment persists, legacy saves migrate, and forged slot saves are rejected',()=>{
 const {e,p,profile}=setup();for(const item of starterEquipment)e.act('p',p,{kind:'equip-item',item},0);
 const saved=writeProgress(profile,0),loaded=readProgress(saved);assert.deepEqual(loaded.profile.equipment,profile.equipment);
 const legacy:any=structuredClone(saved);delete legacy.profile.equipment;delete legacy.profile.ownedEquipment;const migrated=readProgress(legacy);assert.deepEqual(migrated.profile.ownedEquipment,starterEquipment);assert.ok(Object.values(migrated.profile.equipment).every(id=>id===null));
 for(const edit of [(s:any)=>s.profile.equipment.head='woodenShield',(s:any)=>s.profile.equipment.ring='__proto__',(s:any)=>s.profile.ownedEquipment=[],(s:any)=>s.profile.equipment.extra='clothHood',(s:any)=>delete s.profile.equipment.head,(s:any)=>s.profile.ownedEquipment.push('clothHood')]){const invalid=structuredClone(saved);edit(invalid);assert.throws(()=>readProgress(invalid));}
});

test('public appearance accepts only valid equipped slots and ignores private or malformed data',()=>{
 for(const value of [null,'oops','[]','null','x'.repeat(1100)])assert.deepEqual(readAppearance(value),emptyEquipment());
 const valid=readAppearance(JSON.stringify({head:'clothHood',offhand:'woodenShield',chest:'clothTunic',ring:'woodenShield',gold:999,ownedEquipment:['clothHood']}));
 assert.equal(valid.head,'clothHood');assert.equal(valid.offhand,'woodenShield');assert.equal(valid.ring,null);assert.deepEqual(Object.keys(valid).sort(),Object.keys(emptyEquipment()).sort());
});
