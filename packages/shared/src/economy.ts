import {newAttributes,attributePoints,attributeRules,isAttribute,maxHealth,type Attributes,type SkillId,monsters,monsterKind,equipmentItems,equipmentSlots,emptyEquipment,starterEquipment,isEquipment,isEquipmentSlot,equipmentArmor,type RegionId,type Equipment,type EquipmentId,items,rewards,merchant,combat as C,totalXp,levelForXp,type ItemId,classes,weapons,classRules,isClassChoice,isWeapon,skillLevel,spells,isSpell,canLearnSpell,type SpellId,type ClassId,type WeaponId} from '@realm/game-data';
import {sight,type Fighter,type Kill} from './combat';
export interface Stack{id:number;item:ItemId;quantity:number}
export interface Profile{attributes:Attributes;equipment:Equipment;ownedEquipment:EquipmentId[];learnedSpells:SpellId[];classId:ClassId;weapon:WeaponId;ownedWeapons:WeaponId[];skills:Record<SkillId,number>;skillXp:Record<SkillId,number>;gold:number;xp:number;level:number;inventory:Stack[];potionReadyAt:number}
export interface Drop{id:string;owner:string;region?:RegionId;x:number;y:number;gold:number;pelts:number;shards?:number;expires:number}
export interface EconomySnapshot extends Profile{attributePoints:number;armor:number;account?:{email:string;savedAt:string;state:'ready'|'saving'|'error'}|null;drops:Drop[];capacity:number;nextXp:number;levelXp:number;time:number}
export class Economy{
 profiles=new Map<string,Profile>();drops=new Map<string,Drop>();lastKill=0;serial=0;
 join(id:string){if(!this.profiles.has(id))this.profiles.set(id,{attributes:newAttributes(),equipment:emptyEquipment(),ownedEquipment:[...starterEquipment],learnedSpells:[],classId:'citizen',weapon:'wand',ownedWeapons:[...classRules.starterWeapons],skills:{melee:1,distance:1,magic:1,shielding:1},skillXp:{melee:0,distance:0,magic:0,shielding:0},gold:0,xp:0,level:1,inventory:[],potionReadyAt:0});}
 sync(id:string,p:Fighter){const profile=this.profiles.get(id);if(!profile)return;profile.skillXp={melee:p.meleeXp,distance:p.distanceXp,magic:p.magicXp,shielding:p.shieldingXp};profile.skills={melee:skillLevel(p.meleeXp),distance:skillLevel(p.distanceXp),magic:skillLevel(p.magicXp),shielding:skillLevel(p.shieldingXp)};}
 leave(id:string){this.profiles.delete(id);for(const [key,d] of this.drops)if(d.owner===id)this.drops.delete(key);}
 process(kills:Kill[],players:Map<string,Fighter>|{get(id:string):Fighter|undefined},time:number){
 for(const kill of kills){if(kill.id<=this.lastKill)continue;this.lastKill=kill.id;const p=players.get(kill.owner),profile=this.profiles.get(kill.owner);if(!p||!profile)continue;const reward=kill.kind?monsters[monsterKind(kill.kind)]:{xp:rewards.wolfXp,gold:rewards.wolfGold,pelts:rewards.wolfPelts};profile.xp=Math.min(totalXp(rewards.levelCap),profile.xp+reward.xp);profile.level=levelForXp(profile.xp);const id=`spoils-${kill.id}`;this.drops.set(id,{id,owner:kill.owner,region:kill.region??'woods',shards:'shards' in reward?reward.shards:0,x:kill.x,y:kill.y,gold:reward.gold,pelts:reward.pelts,expires:time+rewards.dropLifetime});}
 for(const [id,d] of this.drops)if(time>=d.expires)this.drops.delete(id);
 }
 add(inventory:Stack[],item:ItemId,quantity:number):Stack[]|null{
 const next=inventory.map(s=>({...s}));let left=quantity;
 for(const stack of next){if(stack.item===item){const count=Math.min(left,items[item].stack-stack.quantity);stack.quantity+=count;left-=count;}}
 while(left>0){if(next.length>=rewards.capacity)return null;const count=Math.min(left,items[item].stack);next.push({id:++this.serial,item,quantity:count});left-=count;}
 return next;
 }
 act(id:string,p:Fighter,request:unknown,time:number):string{
 const profile=this.profiles.get(id);if(!profile||p.hp<=0)return 'You cannot use items while defeated.';
 if(!request||typeof request!=='object')return 'Invalid action.';const {kind,drop,weapon,classId,spell,item,slot,attribute}=request as {kind:unknown;drop:unknown;weapon:unknown;classId:unknown;spell:unknown;item:unknown;slot:unknown;attribute:unknown};
 if(kind==='attribute'){
 if(!isAttribute(attribute))return 'Choose a valid attribute.';
 if(attributePoints(profile.level,profile.attributes)<1)return 'No attribute points available.';
 if(profile.attributes[attribute]>=attributeRules.cap)return 'This attribute is at its maximum.';
 profile.attributes[attribute]++;p.attributes={...profile.attributes};return `${attribute[0].toUpperCase()+attribute.slice(1)} increased.`;
 }
 if(kind==='class'){if(profile.classId!=='citizen')return 'Your class has already been chosen.';if(profile.level<classRules.unlockLevel)return 'Reach level 5 to choose your class.';if(!isClassChoice(classId))return 'Choose Knight, Archer, Mage or Rogue.';profile.classId=classId;const starter=classes[classId].weapon;if(!profile.ownedWeapons.includes(starter))profile.ownedWeapons.push(starter);profile.weapon=starter;p.weapon=starter;p.auto=false;p.target='';return `You chose ${classes[classId].name}. ${weapons[starter].name} equipped.`;}
 if(kind==='equip'){if(!isWeapon(weapon)||!profile.ownedWeapons.includes(weapon))return 'You do not own that weapon.';if(profile.level<weapons[weapon].level)return `Reach level ${weapons[weapon].level} to equip this weapon.`;if(p.auto)return 'Stop attacking before changing weapons.';profile.weapon=weapon;p.weapon=weapon;p.target='';return 'Weapon equipped.';}
 if(kind==='equip-item'){
 if(!isEquipment(item)||!profile.ownedEquipment.includes(item))return 'You do not own that item.';
 if(profile.level<equipmentItems[item].level)return `Reach level ${equipmentItems[item].level} to equip this item.`;
 if(p.auto)return 'Stop attacking before changing equipment.';
 profile.equipment[equipmentItems[item].slot]=item;p.armor=equipmentArmor(profile.equipment);p.shieldArmor=profile.equipment.offhand?equipmentItems[profile.equipment.offhand].armor:0;return `${equipmentItems[item].name} equipped.`;
 }
 if(kind==='unequip-item'){
 if(!isEquipmentSlot(slot))return 'Choose an equipment slot.';
 if(p.auto)return 'Stop attacking before changing equipment.';
 profile.equipment[slot]=null;p.armor=equipmentArmor(profile.equipment);p.shieldArmor=profile.equipment.offhand?equipmentItems[profile.equipment.offhand].armor:0;return `${equipmentSlots[slot]} unequipped.`;
 }
 if(kind==='pickup'){
 if(typeof drop!=='string')return 'Choose a loot bundle.';const d=this.drops.get(drop);
 if(!d||d.owner!==id||time>=d.expires||p.region!==(d.region??'woods')||Math.hypot(p.x-d.x,p.y-d.y)>rewards.pickupRange||!sight(p,d,p.region))return 'Move closer to your loot bundle.';
 let inventory=d.pelts?this.add(profile.inventory,'pelt',d.pelts):profile.inventory.map(s=>({...s}));if(inventory&&d.shards)inventory=this.add(inventory,'crystalShard',d.shards);if(!inventory)return 'Inventory full. Sell materials to free space.';
 // Mutations happen together after every prerequisite passes. A repeated ID finds no drop.
 profile.inventory=inventory;profile.gold+=d.gold;this.drops.delete(drop);return `Collected ${d.gold} gold${d.pelts?` and ${d.pelts} wolf pelt`:``}${d.shards?` and ${d.shards} crystal shard${d.shards===1?'':'s'}`:``}.`;
 }
 if(kind==='potion'){
 const stack=profile.inventory.find(s=>s.item==='potion'&&s.quantity>0);
 if(!stack)return 'No healing potions. Buy one from Mara in Elderwood.';
 if(time<profile.potionReadyAt)return 'Your potion is still on cooldown.';
 if(p.hp>=maxHealth(p.attributes))return 'Your health is already full.';
 p.hp=Math.min(maxHealth(p.attributes),p.hp+items.potion.heal);profile.potionReadyAt=time+items.potion.cooldown;stack.quantity--;profile.inventory=profile.inventory.filter(s=>s.quantity>0);return 'Healing potion restored health.';
 }
 if(p.region!=='elderwood'||Math.hypot(p.x-merchant.x,p.y-merchant.y)>merchant.range)return 'Visit Mara the Trader in Elderwood.';
 if(kind==='buy-equipment'){
 const definition=isEquipment(item)?equipmentItems[item]:isWeapon(item)?weapons[item]:null;
 if(!definition)return 'Choose valid equipment.';
 if(profile.level<definition.level)return `Reach level ${definition.level} to buy this item.`;
 if((isEquipment(item)&&profile.ownedEquipment.includes(item))||(isWeapon(item)&&profile.ownedWeapons.includes(item)))return 'You already own that item.';
 if(profile.gold<definition.price)return `${definition.name} costs ${definition.price} gold.`;
 profile.gold-=definition.price;
 if(isEquipment(item))profile.ownedEquipment.push(item);else if(isWeapon(item))profile.ownedWeapons.push(item);
 return `Bought ${definition.name}.`;
 }
 if(kind==='learn'){if(!isSpell(spell)||!canLearnSpell(spell,profile))return 'That spell is unavailable for your class or level.';if(profile.learnedSpells.includes(spell))return 'You already know that spell.';const s=spells[spell];if(profile.gold<s.price)return `${s.name} costs ${s.price} gold.`;profile.gold-=s.price;profile.learnedSpells.push(spell);return `Learned ${s.name}.`; }
 if(kind==='buy'){
 if(profile.gold<items.potion.buy)return `A potion costs ${items.potion.buy} gold.`;
 const inventory=this.add(profile.inventory,'potion',1);if(!inventory)return 'Inventory full.';
 profile.gold-=items.potion.buy;profile.inventory=inventory;return 'Bought one healing potion.';
 }
 if(kind==='sell'){
 const count=profile.inventory.filter(s=>s.item==='pelt').reduce((sum,s)=>sum+s.quantity,0),shards=profile.inventory.filter(s=>s.item==='crystalShard').reduce((sum,s)=>sum+s.quantity,0);if(!count&&!shards)return 'No materials to sell.';
 const gold=count*items.pelt.sell+shards*items.crystalShard.sell;profile.inventory=profile.inventory.filter(s=>s.item!=='pelt'&&s.item!=='crystalShard');profile.gold+=gold;return shards?`Sold materials for ${gold} gold.`:`Sold ${count} wolf pelts for ${gold} gold.`;
 }
 return 'Invalid action.';
 }
 snapshot(id:string,time:number):EconomySnapshot{const p=this.profiles.get(id)!;return {...p,attributes:{...p.attributes},attributePoints:attributePoints(p.level,p.attributes),armor:equipmentArmor(p.equipment),equipment:{...p.equipment},ownedEquipment:[...p.ownedEquipment],learnedSpells:[...p.learnedSpells],ownedWeapons:[...p.ownedWeapons],skills:{...p.skills},skillXp:{...p.skillXp},inventory:p.inventory.map(s=>({...s})),drops:[...this.drops.values()].filter(d=>d.owner===id&&d.expires>time).map(d=>({...d})),capacity:rewards.capacity,nextXp:totalXp(Math.min(rewards.levelCap,p.level+1)),levelXp:totalXp(p.level),time};}
}
