import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classes,weapons,skillLevel,skillRequirement,weaponDamage,totalXp,type WeaponId} from '@realm/game-data';
import {CombatSimulation,newFighter} from '../packages/shared/src/combat';
import {Economy} from '../packages/shared/src/economy';
test('Citizen unlocks four choices at level 5, gets its weapon, and cannot choose twice',()=>{
 for(const id of Object.keys(classes) as (keyof typeof classes)[]){const e=new Economy(),p=newFighter();e.join('a');const profile=e.profiles.get('a')!;assert.equal(profile.classId,'citizen');e.act('a',p,{kind:'class',classId:id,level:99,xp:9999},0);assert.equal(profile.classId,'citizen');profile.xp=totalXp(5);profile.level=5;e.act('a',p,{kind:'class',classId:'__proto__'},0);assert.equal(profile.classId,'citizen');e.act('a',p,{kind:'class',classId:id},0);assert.equal(profile.classId,id);assert.equal(p.weapon,classes[id].weapon);assert.ok(profile.ownedWeapons.includes(classes[id].weapon));e.act('a',p,{kind:'class',classId:id==='mage'?'knight':'mage'},0);assert.equal(profile.classId,id);p.hp=0;e.act('a',p,{kind:'equip',weapon:'bow'},0);assert.equal(p.weapon,classes[id].weapon);}
});
test('equipment requires ownership, cannot swap during auto attack and preserves cooldowns',()=>{
 const e=new Economy(),p=newFighter();e.join('a');e.act('a',p,{kind:'equip',weapon:'knightSword'},0);assert.equal(p.weapon,'wand');e.act('a',p,{kind:'equip',weapon:'__proto__'},0);assert.equal(p.weapon,'wand');p.auto=true;e.act('a',p,{kind:'equip',weapon:'sword'},0);assert.equal(p.weapon,'wand');p.auto=false;p.shotAt=3;e.act('a',p,{kind:'equip',weapon:'bow'},0);assert.equal(p.weapon,'bow');assert.equal(p.shotAt,3);
});
test('skill thresholds and damage scale by matching skill, with a cap',()=>{assert.equal(skillLevel(0),1);assert.equal(skillLevel(99),1);assert.equal(skillLevel(100),2);assert.equal(skillRequirement(3),400);assert.equal(skillLevel(1e9),100);assert.equal(weaponDamage('wand',0),18);assert.ok(weaponDamage('wand',10000)>weaponDamage('wand',0));});
test('all weapons use their configured range, damage and matching skill',()=>{
 for(const id of Object.keys(weapons) as WeaponId[]){const sim=new CombatSimulation(),p={...newFighter(),weapon:id,region:'woods' as const,x:19.7,y:15.5},w=sim.wolves.get('wolf-1')!;const weapon=weapons[id];assert.equal(sim.action('p',p,'bolt',w.id),true);for(let i=0;i<5;i++)sim.tick(.05,[['p',p]]);assert.equal(w.hp,65-weaponDamage(id,0));assert.equal(p[`${weapon.skill}Xp`],5);for(const skill of ['melee','distance','magic'] as const)if(skill!==weapon.skill)assert.equal(p[`${skill}Xp`],0);}
});
test('melee has no projectile, ranged attacks travel, and non-magic weapons cannot cast nova',()=>{
 const sim=new CombatSimulation(),p={...newFighter(),weapon:'sword' as WeaponId,region:'woods' as const,x:19.7,y:15.5},w=sim.wolves.get('wolf-1')!;assert.equal(sim.action('p',{...p,x:17.5,y:17.5},'bolt',w.id),false);assert.equal(sim.action('p',p,'nova',w.id),false);assert.equal(p.mana,100);sim.action('p',p,'bolt',w.id);assert.equal(sim.projectiles.size,0);assert.ok(w.hp<65);assert.ok(sim.events.some(e=>e.kind==='melee'));
});
test('misses, dead/returning enemies and attack spam do not grant skill EXP',()=>{
 const sim=new CombatSimulation(),p={...newFighter(),region:'woods' as const,x:19.7,y:15.5},w=sim.wolves.get('wolf-1')!;sim.action('p',p,'bolt',w.id);for(let i=0;i<100;i++)sim.action('p',p,'bolt',w.id);assert.equal(p.magicXp,0);assert.equal(sim.projectiles.size,1);sim.tick(.1,[['p',p]]);assert.equal(p.magicXp,5);w.mode='return';sim.hit(w,999,'p',p,'magic');assert.equal(p.magicXp,5);w.mode='dead';w.hp=0;sim.hit(w,999,'p',p,'magic');assert.equal(p.magicXp,5);
});
test('projectile damage and skill credit use the weapon at firing time',()=>{
 const sim=new CombatSimulation(),p={...newFighter(),region:'woods' as const,x:19.7,y:15.5};sim.action('p',p,'bolt','wolf-1');sim.clear(p);p.weapon='sword';sim.tick(.1,[['p',p]]);assert.equal(p.magicXp,5);assert.equal(p.meleeXp,0);assert.equal(sim.wolves.get('wolf-1')!.hp,47);
});
