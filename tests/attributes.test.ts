import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,CombatSimulation,newFighter} from '@realm/shared';
import {attributePoints,newAttributes,maxHealth,maxMana,totalXp,skillRequirement,skillLevel,monsters} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const economy=new Economy();economy.join('p');return {economy,p:newFighter(),profile:economy.profiles.get('p')!};};
test('level-up points are derived, spent one at a time, capped and never forged',()=>{
 const {economy,p,profile}=setup();assert.match(economy.act('p',p,{kind:'attribute',attribute:'strength',points:99},0),/No attribute/);
 profile.xp=totalXp(2);profile.level=2;assert.equal(economy.snapshot('p',0).attributePoints,3);
 for(const attribute of ['strength','dexterity','intelligence'])assert.match(economy.act('p',p,{kind:'attribute',attribute},0),/increased/);
 assert.equal(attributePoints(profile.level,profile.attributes),0);assert.equal(profile.attributes.strength,11);assert.equal(p.attributes.intelligence,11);
 assert.match(economy.act('p',p,{kind:'attribute',attribute:'__proto__'},0),/valid attribute/);assert.match(economy.act('p',p,{kind:'attribute',attribute:'vitality'},0),/No attribute/);
 profile.level=100;profile.xp=totalXp(100);profile.attributes.strength=100;assert.match(economy.act('p',p,{kind:'attribute',attribute:'strength'},0),/maximum/);
 const snapshot=economy.snapshot('p',0);snapshot.attributes.strength=50;assert.equal(profile.attributes.strength,100);
});
test('legacy saves receive base attributes and retroactive points; invested points and shielding persist',()=>{
 const {profile}=setup();profile.xp=totalXp(10);profile.level=10;profile.attributes.vitality=13;profile.skillXp.shielding=400;
 const save=writeProgress(profile,0),loaded=readProgress(save);assert.equal(loaded.profile.skills.shielding,3);assert.equal(attributePoints(10,loaded.profile.attributes),24);
 const legacy:any=structuredClone(save);delete legacy.profile.attributes;delete legacy.profile.skillXp.shielding;delete legacy.profile.skills.shielding;const migrated=readProgress(legacy);assert.deepEqual(migrated.profile.attributes,newAttributes());assert.equal(attributePoints(10,migrated.profile.attributes),27);assert.equal(migrated.profile.skillXp.shielding,0);
 for(const edit of [(s:any)=>s.profile.attributes.strength=101,(s:any)=>s.profile.attributes.vitality=9,(s:any)=>s.profile.attributes.strength=99,(s:any)=>s.profile.attributes.extra=10,(s:any)=>s.profile.skillXp.shielding=-1]){const invalid=structuredClone(save);edit(invalid);assert.throws(()=>readProgress(invalid));}
});
test('attributes boost only the matching weapon skill and preserve damage on in-flight shots',()=>{
 for(const [weapon,attribute]of [['sword','strength'],['bow','dexterity'],['wand','intelligence']] as const){const damages=[];for(const boosted of [false,true]){const sim=new CombatSimulation(),p=newFighter(),wolf=sim.wolves.get('wolf-1')!;Object.assign(p,{weapon,region:'woods',x:wolf.x-.8,y:wolf.y});if(boosted)p.attributes[attribute]=20;sim.action('p',p,'bolt',wolf.id);p.attributes[attribute]=100;p.auto=false;sim.tick(.1,[['p',p]]);damages.push(monsters.wolf.hp-wolf.hp);}assert.ok(damages[1]>damages[0]);}
});
test('vitality and intelligence extend healing, potion, regeneration and respawn limits',()=>{
 const {economy,p,profile}=setup();Object.assign(p.attributes,{vitality:12,intelligence:12});profile.attributes={...p.attributes};assert.equal(maxHealth(p.attributes),110);assert.equal(maxMana(p.attributes),106);
 p.hp=105;profile.inventory=[{id:1,item:'potion',quantity:1}];economy.act('p',p,{kind:'potion'},0);assert.equal(p.hp,110);
 profile.learnedSpells=['mend'];p.hp=105;p.mana=106;const sim=new CombatSimulation();assert.ok(sim.castSpell('p',p,'mend',null,profile));assert.equal(p.hp,110);
 p.hp=109;p.mana=105;sim.tick(.5,[['p',p]]);assert.equal(p.hp,110);assert.equal(p.mana,106);
 p.hp=0;p.deadUntil=0;sim.tick(.1,[['p',p]]);assert.equal(p.hp,110);assert.equal(p.mana,106);
});
test('shields prevent physical damage and earn training; stronger skill blocks more',()=>{
 const damages=[];for(const shieldingXp of [0,skillRequirement(21)]){const sim=new CombatSimulation(),p=newFighter();p.shieldArmor=1;p.shieldingXp=shieldingXp;sim.strike(p,20);damages.push(100-p.hp);assert.equal(p.shieldingXp,shieldingXp+5);assert.equal(sim.events[0].kind,'block');}assert.ok(damages[1]<damages[0]);
 const {economy,p,profile}=setup();economy.act('p',p,{kind:'equip-item',item:'woodenShield'},0);const sim=new CombatSimulation();sim.strike(p,10);economy.sync('p',p);assert.equal(profile.skillXp.shielding,5);economy.act('p',p,{kind:'unequip-item',slot:'offhand'},0);sim.strike(p,10);assert.equal(p.shieldingXp,5);assert.equal(p.shieldArmor,0);
});
test('elemental attacks, fully armored hits and defeated actors cannot train shielding',()=>{
 const sim=new CombatSimulation(),p=newFighter();p.shieldArmor=18;sim.strike(p,20,false);assert.equal(p.hp,80);assert.equal(p.shieldingXp,0);p.armor=100;sim.strike(p,20);assert.equal(p.hp,79);assert.equal(p.shieldingXp,0);p.hp=0;sim.strike(p,20);assert.equal(p.shieldingXp,0);
 p.hp=100;p.armor=0;p.shieldingXp=skillRequirement(100);sim.strike(p,100);assert.equal(skillLevel(p.shieldingXp),100);assert.equal(p.shieldingXp,skillRequirement(100));
});

test('learned spells use attribute bonuses captured at casting and never grant free spells',()=>{
 const damages=[];for(const intelligence of [10,20]){const {economy,p,profile}=setup(),sim=new CombatSimulation(),wolf=sim.wolves.get('wolf-1')!;Object.assign(p,{region:'woods',x:wolf.x-.8,y:wolf.y});p.attributes.intelligence=intelligence;assert.equal(sim.castSpell('p',p,'spark',wolf.id,profile),false);profile.learnedSpells=['spark'];assert.equal(sim.castSpell('p',p,'spark',wolf.id,profile),true);p.attributes.intelligence=100;sim.tick(.1,[['p',p]]);damages.push(monsters.wolf.hp-wolf.hp);}assert.ok(damages[1]>damages[0]);
});
