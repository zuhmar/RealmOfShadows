import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter,applyEquipment} from '@realm/shared';
import {gearStats,gearDefinition,gearSlot,rollRarity,islandEquipmentTiers,monsters,totalXp,maxHealth,attributePoints,type GearInstance,type Rarity} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const uuid=()=>globalThis.crypto.randomUUID();
const setup=(random:()=>number=()=>0)=>{const e=new Economy(random);e.join('p');const p=newFighter(),profile=e.profiles.get('p')!;return {e,p,profile};};
function level(profile:ReturnType<typeof setup>['profile'],n=100){profile.level=n;profile.xp=totalXp(n);}
test('every monster can drop only its island tier, with a higher boss chance and no guaranteed normal drops',()=>{
 for(const [kind,stats]of Object.entries(monsters)){const {e,p}=setup();const region=['bat','crawler','golem','wyrm'].includes(kind)?'caverns':'woods';e.process([{id:1,owner:'p',x:5,y:5,region,kind:kind as keyof typeof monsters}],new Map([['p',p]]),0);const drop=[...e.drops.values()][0];assert.ok(drop.gear);assert.equal(drop.gear.rarity,null);assert.equal(gearDefinition(drop.gear.base).tier,islandEquipmentTiers[region]);}
 for(const [kind,expected]of [['wolf',false],['bear',true]] as const){const {e,p}=setup(()=>.5);e.process([{id:1,owner:'p',x:5,y:5,region:'woods',kind}],new Map([['p',p]]),0);assert.equal(!![...e.drops.values()][0].gear,expected);}
 assert.deepEqual(Object.values(islandEquipmentTiers),['beginner','copper','iron','gold','mythril','dragon','shadow']);
});
test('unidentified equipment pickups are private, atomic, capacity limited and cannot duplicate',()=>{
 const {e,p,profile}=setup();Object.assign(p,{region:'woods',x:5,y:5});const gear:GearInstance={id:uuid(),base:'copperArmor',rarity:null};e.drops.set('loot',{id:'loot',owner:'p',region:'woods',x:5,y:5,gold:10,pelts:1,gear,expires:90});
 e.join('other');assert.match(e.act('other',p,{kind:'pickup',drop:'loot'},0),/closer/);profile.gear=Array.from({length:32},()=>({...gear,id:uuid()}));assert.match(e.act('p',p,{kind:'pickup',drop:'loot'},0),/Inventory full/);assert.equal(profile.gold,0);assert.equal(profile.inventory.length,0);assert.ok(e.drops.has('loot'));
 profile.gear=[];e.act('p',p,{kind:'pickup',drop:'loot'},0);e.act('p',p,{kind:'pickup',drop:'loot'},0);assert.equal(profile.gear.length,1);assert.equal(profile.gold,10);assert.notEqual(profile.gear[0],gear);
});
test('identification rolls once server-side, rejects foreign IDs, and equipment cannot be worn before identification or its level',()=>{
 let rolls=0;const {e,p,profile}=setup(()=>{rolls++;return .99;});const gear:GearInstance={id:uuid(),base:'knightSword',rarity:null};profile.gear.push(gear);
 assert.match(e.act('p',p,{kind:'equip-gear',item:gear.id},0),/Identify/);assert.match(e.act('p',p,{kind:'identify',item:uuid(),rarity:'legendary'},0),/do not own/);assert.equal(rolls,0);
 e.act('p',p,{kind:'identify',item:gear.id,rarity:'uncommon'},0);assert.equal(gear.rarity,'legendary');e.act('p',p,{kind:'identify',item:gear.id},0);assert.equal(rolls,1);assert.match(e.act('p',p,{kind:'equip-gear',item:gear.id},0),/level 5/);
 level(profile,5);e.act('p',p,{kind:'equip-gear',item:gear.id},0);assert.equal(profile.weapon,'knightSword');assert.ok(p.weaponBonus>0);assert.match(e.act('p',p,{kind:'discard-gear',item:gear.id},0),/Unequip/);
 e.act('p',p,{kind:'unequip-gear',item:gear.id},0);assert.equal(p.weaponBonus,0);assert.equal(profile.equippedGear.weapon,null);e.act('p',p,{kind:'discard-gear',item:gear.id},0);assert.equal(profile.gear.length,0);
});
test('rarities strictly improve armor, attack and primary attribute bonuses',()=>{
 assert.deepEqual([0,.6,.85,.97].map(n=>rollRarity(()=>n)),['uncommon','rare','epic','legendary']);
 for(const base of ['copperArmor','knightSword','ironRing','ironBow'] as const){let stat=0,bonus=0;for(const rarity of ['uncommon','rare','epic','legendary'] as Rarity[]){const stats=gearStats({id:uuid(),base,rarity}),current=stats.armor+stats.attack,attribute=Math.max(...Object.values(stats.bonuses));assert.ok(current>stat);assert.ok(attribute>bonus);stat=current;bonus=attribute;}}
});
test('duplicate bases keep separate rarities; equip/replace/unequip updates effective stats without spending points or granting permanent bonuses',()=>{
 const {e,p,profile}=setup();level(profile);const a:GearInstance={id:uuid(),base:'copperArmor',rarity:'uncommon'},b:GearInstance={id:uuid(),base:'copperArmor',rarity:'legendary'};profile.gear=[a,b];const points=attributePoints(profile.level,profile.attributes);
 e.act('p',p,{kind:'equip-gear',item:a.id},0);const armor=p.armor;e.act('p',p,{kind:'equip-gear',item:b.id},0);assert.ok(p.armor>armor);assert.equal(profile.equippedGear.chest,b.id);assert.ok(maxHealth(p.attributes)>100);assert.equal(profile.attributes.vitality,10);assert.equal(attributePoints(profile.level,profile.attributes),points);
 p.hp=maxHealth(p.attributes);e.act('p',p,{kind:'unequip-item',slot:'chest'},0);assert.equal(p.armor,0);assert.equal(p.hp,100);assert.deepEqual(p.attributes,profile.attributes);
});
test('individual equipment and selected loadout survive saves while legacy saves migrate and forged gear is rejected',()=>{
 const {e,p,profile}=setup();level(profile);const gear:GearInstance={id:uuid(),base:'ironStaff',rarity:'epic'};profile.gear.push(gear);e.act('p',p,{kind:'equip-gear',item:gear.id},0);const save=writeProgress(profile,0),loaded=readProgress(save);assert.deepEqual(loaded.profile.gear,profile.gear);const restored=newFighter();applyEquipment(loaded.profile,restored);assert.equal(restored.weaponBonus,p.weaponBonus);assert.deepEqual(restored.attributes,p.attributes);
 const normal=setup();const legacy:any=writeProgress(normal.profile,0);delete legacy.profile.gear;delete legacy.profile.equippedGear;assert.deepEqual(readProgress(legacy).profile.gear,[]);
 for(const edit of [(s:any)=>s.profile.gear.push({...gear}),(s:any)=>s.profile.gear[0].rarity=null,(s:any)=>s.profile.gear[0].base='__proto__',(s:any)=>s.profile.gear[0].bonuses={strength:999},(s:any)=>s.profile.gear[0].rarity='mythic',(s:any)=>s.profile.equippedGear.head=gear.id,(s:any)=>s.profile.weapon='sword']){const forged=structuredClone(save);edit(forged);assert.throws(()=>readProgress(forged));}
 const snapshot=e.snapshot('p',0);snapshot.gear[0].rarity='legendary';snapshot.equippedGear.weapon=null;assert.equal(profile.gear[0].rarity,'epic');assert.equal(profile.equippedGear.weapon,gear.id);
});
