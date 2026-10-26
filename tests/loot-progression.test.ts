import {test} from 'node:test';
import assert from 'node:assert/strict';
import {equipmentDropChance,compareGear,monsters,gearDefinition,islandEquipmentTiers,type GearInstance} from '@realm/game-data';
import {Economy,newFighter} from '@realm/shared';
const setup=(random:()=>number=Math.random)=>{const economy=new Economy(random);economy.join('p');return {economy,profile:economy.profiles.get('p')!,actor:newFighter()};};
test('harder encounters reward more equipment, with exact server-side chance boundaries and island tiers',()=>{
 for(const kinds of [['wolf','spider','boar','bear'],['bat','crawler','golem','wyrm']] as const){
  let previous=0;for(const kind of kinds){const chance=equipmentDropChance(kind);assert.ok(chance>previous);previous=chance;
   for(const [roll,expected]of [[chance-.00001,true],[chance,false]] as const){const {economy,actor}=setup(()=>roll);const region=kinds[0]==='wolf'?'woods':'caverns';economy.process([{id:1,owner:'p',region,kind,x:5.5,y:5.5}],new Map([['p',actor]]),0);const drop=[...economy.drops.values()][0];assert.equal(!!drop.gear,expected,kind+' '+roll);if(drop.gear){assert.equal(drop.gear.rarity,null);assert.equal(gearDefinition(drop.gear.base).tier,islandEquipmentTiers[region]);}
    economy.process([{id:1,owner:'p',region,kind,x:5.5,y:5.5}],new Map([['p',actor]]),0);assert.equal(economy.drops.size,1,'a repeated kill cannot reroll loot');
   }
  }
 }
 assert.ok(monsters.spider.xp>monsters.wolf.xp);assert.ok(monsters.boar.xp>monsters.spider.xp);
});
test('gear comparison includes lost attributes and replaced-slot stats without mutating the loadout',()=>{
 const {profile}=setup();const old:GearInstance={id:'old',base:'clothTunic',rarity:'legendary'},next:GearInstance={id:'next',base:'copperArmor',rarity:'uncommon'};profile.gear=[old,next];profile.equippedGear.chest=old.id;profile.equipment.chest=old.base as 'clothTunic';const snapshot=structuredClone(profile),result=compareGear(next,profile)!;assert.equal(result.currentName,'Legendary Beginner Tunic');assert.ok(result.armor<0);assert.ok(result.bonuses.vitality<0);assert.ok(result.bonuses.strength<0);assert.deepEqual(profile,snapshot);const same=compareGear(old,profile)!;assert.equal(same.armor,0);assert.deepEqual(Object.values(same.bonuses),[0,0,0,0]);assert.equal(compareGear({...next,rarity:null},profile),null);
});
test('comparison supports empty slots, plain equipped items and different weapon speeds and skills',()=>{
 const {profile}=setup();const ring:GearInstance={id:'ring',base:'beginnerRing',rarity:'rare'};assert.equal(compareGear(ring,profile)!.currentName,'Empty slot');profile.equipment.ring='beginnerRing';assert.equal(compareGear(ring,profile)!.armor,2);
 const result=compareGear({id:'daggers',base:'dagger',rarity:'uncommon'},profile)!;assert.equal(result.weapon!.before.skill,'magic');assert.equal(result.weapon!.after.skill,'melee');assert.ok(result.attack<0);assert.ok(result.weapon!.afterAttack/result.weapon!.after.cooldown>result.weapon!.beforeAttack/result.weapon!.before.cooldown,'lower attack can still be a faster weapon');
});
