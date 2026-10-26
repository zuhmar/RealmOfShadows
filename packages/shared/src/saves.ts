import {emptyDepot,depotUsage,depotRules,emptyGearLoadout,isGearBase,isRarity,gearSlot,gearDefinition,lootEquipmentRules,newAttributes,attributeRules,attributeDefinitions,weapons,emptyEquipment,starterEquipment,equipmentSlots,equipmentItems,isEquipment,isEquipmentSlot,classes,classRules,isClassChoice,isWeapon,isSpell,canLearnSpell,items,rewards,totalXp,levelForXp,skillRules,skillLevel,spells,type SpellId} from '@realm/game-data';
import type {Profile} from './economy';
export interface CharacterProgress{version:1;profile:Profile;cooldowns:Partial<Record<SpellId,number>>;potionRemaining:number}
const integer=(v:unknown,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
// Saved JSON is never applied to actors without validation. Derived values are rebuilt.
export function readProgress(value:unknown):CharacterProgress{
 const s=structuredClone(value) as CharacterProgress,p=s?.profile;
 if(s?.version!==1||!p||!integer(p.xp,totalXp(rewards.levelCap))||!integer(p.gold,Number.MAX_SAFE_INTEGER)||!(p.classId==='citizen'||isClassChoice(p.classId)))throw Error('Invalid character save.');
 // Older saves receive an empty private Depot without changing bag ownership.
 if(p.depot===undefined)p.depot=emptyDepot();
 const d=p.depot;
 const validGear=(g:unknown)=>{const v=g as {id:string;base:unknown;rarity:unknown};return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===3&&typeof v.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.id)&&isGearBase(v.base)&&(v.rarity===null||isRarity(v.rarity));};
 if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).sort().join(',')!=='equipment,gear,supplies,weapons'||![d.supplies,d.gear,d.equipment,d.weapons].every(a=>Array.isArray(a)&&a.length<=depotRules.capacity)||depotUsage(d)>depotRules.capacity||d.gear.some(g=>!validGear(g))||d.equipment.some(id=>!isEquipment(id))||d.weapons.some(id=>!isWeapon(id)||weapons[id].level>levelForXp(p.xp))||new Set(d.equipment).size!==d.equipment.length||new Set(d.weapons).size!==d.weapons.length||d.supplies.some(stack=>!stack||Object.keys(stack).length!==3||!integer(stack.id,Number.MAX_SAFE_INTEGER)||!Object.hasOwn(items,stack.item)||!integer(stack.quantity,items[stack.item]?.stack)||stack.quantity<1))throw Error('Invalid saved Depot.');
 p.level=levelForXp(p.xp);if(p.classId!=='citizen'&&p.level<classRules.unlockLevel)throw Error('Invalid saved class.');
 // Individual drops coexist with the existing catalogue ownership and loadout.
 if(p.gear===undefined&&p.equippedGear===undefined){p.gear=[];p.equippedGear=emptyGearLoadout();}
 if(!Array.isArray(p.gear)||p.gear.length>lootEquipmentRules.maxInstances||new Set(p.gear.map(g=>g?.id)).size!==p.gear.length||p.gear.some(g=>!g||typeof g!=='object'||Object.keys(g).length!==3||typeof g.id!=='string'||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).test(g.id)||!isGearBase(g.base)||!(g.rarity===null||isRarity(g.rarity))))throw Error('Invalid saved dropped equipment.');
 if(!p.equippedGear||typeof p.equippedGear!=='object'||Array.isArray(p.equippedGear)||Object.keys(p.equippedGear).sort().join(',')!==Object.keys(emptyGearLoadout()).sort().join(',')||Object.entries(p.equippedGear).some(([slot,id])=>id!==null&&!p.gear.some(g=>g.id===id&&g.rarity&&gearSlot(g.base)===slot&&gearDefinition(g.base).level<=p.level&&(slot==='weapon'?p.weapon===g.base:p.equipment?.[slot as keyof typeof p.equipment]===g.base))))throw Error('Invalid saved dropped loadout.');
 const rolled=(slot:string,id:unknown)=>p.gear.some(g=>g.id===p.equippedGear[slot as keyof typeof p.equippedGear]&&g.rarity&&g.base===id);
 if(!Array.isArray(p.ownedWeapons)||p.ownedWeapons.length>Object.keys(weapons).length||new Set(p.ownedWeapons).size!==p.ownedWeapons.length||p.ownedWeapons.some(w=>!isWeapon(w)||weapons[w].level>p.level)||!isWeapon(p.weapon)||(!p.ownedWeapons.includes(p.weapon)&&!rolled('weapon',p.weapon)))throw Error('Invalid saved equipment.');
 // Version-1 saves predating equipment receive the same starter items as new players.
 if(p.equipment===undefined&&p.ownedEquipment===undefined){p.equipment=emptyEquipment();p.ownedEquipment=[...starterEquipment];}
 if(!Array.isArray(p.ownedEquipment)||p.ownedEquipment.length>Object.keys(equipmentItems).length||new Set(p.ownedEquipment).size!==p.ownedEquipment.length||p.ownedEquipment.some(id=>!isEquipment(id))||!p.equipment||Array.isArray(p.equipment)||typeof p.equipment!=='object'||Object.keys(p.equipment).length!==Object.keys(equipmentSlots).length||Object.entries(p.equipment).some(([slot,id])=>!isEquipmentSlot(slot)||(id!==null&&(!isEquipment(id)||(!p.ownedEquipment.includes(id)&&!rolled(slot,id))||equipmentItems[id].slot!==slot||equipmentItems[id].level>p.level))))throw Error('Invalid saved equipment slots.');
 if(p.attributes===undefined)p.attributes=newAttributes();
 if(!p.attributes||typeof p.attributes!=='object'||Array.isArray(p.attributes)||Object.keys(p.attributes).length!==4||Object.keys(attributeDefinitions).some(key=>!integer(p.attributes[key as keyof typeof p.attributes],attributeRules.cap)||p.attributes[key as keyof typeof p.attributes]<attributeRules.base)||Object.values(p.attributes).reduce((sum,value)=>sum+value-attributeRules.base,0)>(p.level-1)*attributeRules.pointsPerLevel)throw Error('Invalid saved attributes.');
 if(p.skillXp&&p.skillXp.shielding===undefined)p.skillXp.shielding=0;
 if(!p.skillXp||!['melee','distance','magic','shielding'].every(k=>integer(p.skillXp[k as keyof typeof p.skillXp],skillRules.factor*(skillRules.cap-1)**2)))throw Error('Invalid saved skills.');
 p.skills={melee:skillLevel(p.skillXp.melee),distance:skillLevel(p.skillXp.distance),magic:skillLevel(p.skillXp.magic),shielding:skillLevel(p.skillXp.shielding)};
 if(!Array.isArray(p.learnedSpells)||p.learnedSpells.length>Object.keys(spells).length||new Set(p.learnedSpells).size!==p.learnedSpells.length||p.learnedSpells.some(id=>!isSpell(id)||!canLearnSpell(id,p)))throw Error('Invalid saved spells.');
 if(!Array.isArray(p.inventory)||p.inventory.length>rewards.capacity||p.inventory.some(stack=>!stack||!integer(stack.id,Number.MAX_SAFE_INTEGER)||!Object.hasOwn(items,stack.item)||!integer(stack.quantity,items[stack.item]?.stack)||stack.quantity<1)||new Set(p.inventory.map(i=>i.id)).size!==p.inventory.length)throw Error('Invalid saved inventory.');
 if(new Set([...p.gear,...d.gear].map(g=>g.id)).size!==p.gear.length+d.gear.length||new Set([...p.inventory,...d.supplies].map(stack=>stack.id)).size!==p.inventory.length+d.supplies.length)throw Error('Duplicate saved item ownership.');
 if(typeof s.potionRemaining!=='number'||!Number.isFinite(s.potionRemaining)||s.potionRemaining<0||s.potionRemaining>items.potion.cooldown||!s.cooldowns||Array.isArray(s.cooldowns)||typeof s.cooldowns!=='object'||Object.entries(s.cooldowns).some(([id,time])=>!isSpell(id)||!p.learnedSpells.includes(id)||typeof time!=='number'||!Number.isFinite(time)||time<0||time>spells[id].cooldown))throw Error('Invalid saved cooldowns.');
 p.potionReadyAt=0;return s;
}
export function writeProgress(profile:Profile,time:number,ready:Partial<Record<SpellId,number>>={}):CharacterProgress{
 const cooldowns:Partial<Record<SpellId,number>>={};for(const id of profile.learnedSpells){const remaining=Math.max(0,(ready[id]??0)-time);if(remaining>0)cooldowns[id]=remaining;}
 return readProgress({version:1,profile,cooldowns,potionRemaining:Math.max(0,profile.potionReadyAt-time)});
}
