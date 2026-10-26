import {weapons,emptyEquipment,starterEquipment,equipmentSlots,equipmentItems,isEquipment,isEquipmentSlot,classes,classRules,isClassChoice,isWeapon,isSpell,canLearnSpell,items,rewards,totalXp,levelForXp,skillRules,skillLevel,spells,type SpellId} from '@realm/game-data';
import type {Profile} from './economy';
export interface CharacterProgress{version:1;profile:Profile;cooldowns:Partial<Record<SpellId,number>>;potionRemaining:number}
const integer=(v:unknown,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
// Saved JSON is never applied to actors without validation. Derived values are rebuilt.
export function readProgress(value:unknown):CharacterProgress{
 const s=structuredClone(value) as CharacterProgress,p=s?.profile;
 if(s?.version!==1||!p||!integer(p.xp,totalXp(rewards.levelCap))||!integer(p.gold,Number.MAX_SAFE_INTEGER)||!(p.classId==='citizen'||isClassChoice(p.classId)))throw Error('Invalid character save.');
 p.level=levelForXp(p.xp);if(p.classId!=='citizen'&&p.level<classRules.unlockLevel)throw Error('Invalid saved class.');
 if(!Array.isArray(p.ownedWeapons)||p.ownedWeapons.length>Object.keys(weapons).length||new Set(p.ownedWeapons).size!==p.ownedWeapons.length||p.ownedWeapons.some(w=>!isWeapon(w)||weapons[w].level>p.level)||!isWeapon(p.weapon)||!p.ownedWeapons.includes(p.weapon))throw Error('Invalid saved equipment.');
 // Version-1 saves predating equipment receive the same starter items as new players.
 if(p.equipment===undefined&&p.ownedEquipment===undefined){p.equipment=emptyEquipment();p.ownedEquipment=[...starterEquipment];}
 if(!Array.isArray(p.ownedEquipment)||p.ownedEquipment.length>Object.keys(equipmentItems).length||new Set(p.ownedEquipment).size!==p.ownedEquipment.length||p.ownedEquipment.some(id=>!isEquipment(id))||!p.equipment||Array.isArray(p.equipment)||typeof p.equipment!=='object'||Object.keys(p.equipment).length!==Object.keys(equipmentSlots).length||Object.entries(p.equipment).some(([slot,id])=>!isEquipmentSlot(slot)||(id!==null&&(!isEquipment(id)||!p.ownedEquipment.includes(id)||equipmentItems[id].slot!==slot||equipmentItems[id].level>p.level))))throw Error('Invalid saved equipment slots.');
 if(!p.skillXp||!['melee','distance','magic'].every(k=>integer(p.skillXp[k as keyof typeof p.skillXp],skillRules.factor*(skillRules.cap-1)**2)))throw Error('Invalid saved skills.');
 p.skills={melee:skillLevel(p.skillXp.melee),distance:skillLevel(p.skillXp.distance),magic:skillLevel(p.skillXp.magic)};
 if(!Array.isArray(p.learnedSpells)||p.learnedSpells.length>Object.keys(spells).length||new Set(p.learnedSpells).size!==p.learnedSpells.length||p.learnedSpells.some(id=>!isSpell(id)||!canLearnSpell(id,p)))throw Error('Invalid saved spells.');
 if(!Array.isArray(p.inventory)||p.inventory.length>rewards.capacity||p.inventory.some(stack=>!stack||!integer(stack.id,Number.MAX_SAFE_INTEGER)||!Object.hasOwn(items,stack.item)||!integer(stack.quantity,items[stack.item]?.stack)||stack.quantity<1)||new Set(p.inventory.map(i=>i.id)).size!==p.inventory.length)throw Error('Invalid saved inventory.');
 if(typeof s.potionRemaining!=='number'||!Number.isFinite(s.potionRemaining)||s.potionRemaining<0||s.potionRemaining>items.potion.cooldown||!s.cooldowns||Array.isArray(s.cooldowns)||typeof s.cooldowns!=='object'||Object.entries(s.cooldowns).some(([id,time])=>!isSpell(id)||!p.learnedSpells.includes(id)||typeof time!=='number'||!Number.isFinite(time)||time<0||time>spells[id].cooldown))throw Error('Invalid saved cooldowns.');
 p.potionReadyAt=0;return s;
}
export function writeProgress(profile:Profile,time:number,ready:Partial<Record<SpellId,number>>={}):CharacterProgress{
 const cooldowns:Partial<Record<SpellId,number>>={};for(const id of profile.learnedSpells){const remaining=Math.max(0,(ready[id]??0)-time);if(remaining>0)cooldowns[id]=remaining;}
 return readProgress({version:1,profile,cooldowns,potionRemaining:Math.max(0,profile.potionReadyAt-time)});
}
