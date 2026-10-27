import {ProfessionSystem,type FishingCast} from './professions';
import {transferDepot} from './depot';
import {newProfessions,type ProfessionXp,questById,questComplete,recordQuestEvent,type QuestJournal,equipmentDropChance,defaultCosmetics,validCosmetics,migrateCosmetics,type Cosmetics,emptyDepot,type DepotContents,islandForRegion,inventoryUsage,inventoryFits,inventoryRules,supplySellPrice,catalogueSellPrice,droppedSellPrice,emptyGearLoadout,gearDefinition,gearSlot,gearName,gearStats,rollRarity,islandEquipmentTiers,lootEquipmentRules,type GearInstance,type GearLoadout,newAttributes,attributePoints,attributeRules,isAttribute,maxHealth,type Attributes,type SkillId,monsters,monsterKind,equipmentItems,equipmentSlots,emptyEquipment,starterEquipment,isEquipment,isEquipmentSlot,equipmentArmor,type RegionId,type Equipment,type EquipmentId,type EquipmentSlot,items,rewards,merchant,combat as C,totalXp,levelForXp,type ItemId,classes,weapons,classRules,isClassChoice,isWeapon,skillLevel,spells,isSpell,canLearnSpell,type SpellId,type ClassId,type WeaponId} from '@realm/game-data';
import {sight,type Fighter,type Kill} from './combat';
import {applyEquipment,effectiveAttributes,profileArmor,cloneGear,equippedInstance} from './gear';
export interface Stack{id:number;item:ItemId;quantity:number}
export interface Profile{professions:ProfessionXp;quests:QuestJournal;cosmetics:Cosmetics;depot:DepotContents;gear:GearInstance[];equippedGear:GearLoadout;attributes:Attributes;equipment:Equipment;ownedEquipment:EquipmentId[];learnedSpells:SpellId[];classId:ClassId;weapon:WeaponId;ownedWeapons:WeaponId[];skills:Record<SkillId,number>;skillXp:Record<SkillId,number>;gold:number;xp:number;level:number;inventory:Stack[];potionReadyAt:number}
export interface Drop{id:string;owner:string;region?:RegionId;x:number;y:number;gold:number;pelts:number;shards?:number;expires:number;gear?:GearInstance}
export interface EconomySnapshot extends Profile{fishing:FishingCast|null;nodeReadyAt:Record<string,number>;effectiveAttributes:Attributes;usedSlots:number;gearCapacity:number;weaponAttack:number;attributePoints:number;armor:number;account?:{email:string;savedAt:string;state:'ready'|'saving'|'error'}|null;drops:Drop[];capacity:number;nextXp:number;levelXp:number;time:number}
export class Economy{
 constructor(private random:()=>number=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){}
 professions=new ProfessionSystem();
 profiles=new Map<string,Profile>();drops=new Map<string,Drop>();lastKill=0;serial=0;
 join(id:string){if(!this.profiles.has(id))this.profiles.set(id,{professions:newProfessions(),quests:{},cosmetics:defaultCosmetics(),depot:emptyDepot(),gear:[],equippedGear:emptyGearLoadout(),attributes:newAttributes(),equipment:emptyEquipment(),ownedEquipment:[...starterEquipment],learnedSpells:[],classId:'citizen',weapon:'wand',ownedWeapons:[...classRules.starterWeapons],skills:{melee:1,distance:1,magic:1,shielding:1},skillXp:{melee:0,distance:0,magic:0,shielding:0},gold:0,xp:0,level:1,inventory:[],potionReadyAt:0});}
 sync(id:string,p:Fighter){const profile=this.profiles.get(id);if(!profile)return;profile.skillXp={melee:p.meleeXp,distance:p.distanceXp,magic:p.magicXp,shielding:p.shieldingXp};profile.skills={melee:skillLevel(p.meleeXp),distance:skillLevel(p.distanceXp),magic:skillLevel(p.magicXp),shielding:skillLevel(p.shieldingXp)};}
 leave(id:string){this.professions.leave(id);this.profiles.delete(id);for(const [key,d] of this.drops)if(d.owner===id)this.drops.delete(key);}
 process(kills:Kill[],players:Map<string,Fighter>|{get(id:string):Fighter|undefined},time:number){
 this.professions.tick(time,players,this.profiles,this.add.bind(this),this.random);
 for(const kill of kills){if(kill.id<=this.lastKill)continue;this.lastKill=kill.id;const p=players.get(kill.owner),profile=this.profiles.get(kill.owner);if(!p||!profile)continue;const reward=kill.kind?monsters[monsterKind(kill.kind)]:{xp:rewards.wolfXp,gold:rewards.wolfGold,pelts:rewards.wolfPelts};profile.xp=Math.min(totalXp(rewards.levelCap),profile.xp+reward.xp);profile.level=levelForXp(profile.xp);recordQuestEvent(profile.quests,'kill',monsterKind(kill.kind),islandForRegion(kill.region??'woods'));const id=`spoils-${kill.id}`,region=kill.region??'woods',tier=islandEquipmentTiers[islandForRegion(region)],pool=Object.keys({...equipmentItems,...weapons}).filter(base=>gearDefinition(base as EquipmentId|WeaponId).tier===tier);const gear=tier&&pool.length&&this.random()<equipmentDropChance(monsterKind(kill.kind))?{id:globalThis.crypto.randomUUID(),base:pool[Math.floor(this.random()*pool.length)] as EquipmentId|WeaponId,rarity:null}:undefined;this.drops.set(id,{id,owner:kill.owner,region:kill.region??'woods',shards:'shards' in reward?reward.shards:0,x:kill.x,y:kill.y,gold:reward.gold,pelts:reward.pelts,...(gear?{gear}:{}),expires:time+rewards.dropLifetime});}
 for(const [id,d] of this.drops)if(time>=d.expires)this.drops.delete(id);
 }
 add(inventory:Stack[],item:ItemId,quantity:number,capacity:number=rewards.capacity):Stack[]|null{
 const next=inventory.map(s=>({...s}));let left=quantity;
 for(const stack of next){if(stack.item===item){const count=Math.min(left,items[item].stack-stack.quantity);stack.quantity+=count;left-=count;}}
 while(left>0){if(next.length>=capacity)return null;const count=Math.min(left,items[item].stack);next.push({id:++this.serial,item,quantity:count});left-=count;}
 return next;
 }
 act(id:string,p:Fighter,request:unknown,time:number):string{
 const profile=this.profiles.get(id);if(!profile||p.hp<=0)return 'You cannot use items while defeated.';const fits=(changes:Partial<Profile>)=>inventoryFits(profile,{...profile,...changes});
 if(!request||typeof request!=='object')return 'Invalid action.';const {kind,drop,weapon,classId,spell,item,slot,attribute}=request as {kind:unknown;drop:unknown;weapon:unknown;classId:unknown;spell:unknown;item:unknown;slot:unknown;attribute:unknown};
 if(kind==='gather'||kind==='craft')return this.professions.act(id,p,profile,kind,item,time,this.add.bind(this),this.random);
 if(kind==='food'){if(time<profile.potionReadyAt)return 'Your food or potion is still on cooldown.';if(p.hp>=maxHealth(p.attributes))return 'Your health is already full.';const fish=profile.inventory.find(s=>s.item==='cookedFish');if(!fish)return 'No cooked fish in your bag.';fish.quantity--;profile.inventory=profile.inventory.filter(s=>s.quantity>0);p.hp=Math.min(maxHealth(p.attributes),p.hp+30);profile.potionReadyAt=time+items.potion.cooldown;return 'Ate cooked fish · Restored up to 30 HP.';}
 if(kind==='quest-accept'||kind==='quest-claim'){
 const q=questById(item);if(!q||!q.playable)return 'This quest is not available yet.';
 if(p.region!=='elderwood'||Math.hypot(p.x-merchant.x,p.y-merchant.y)>merchant.range)return 'Visit Mara the Trader to accept quests and claim rewards.';
 if(profile.level<q.level)return `Reach level ${q.level} for this quest.`;
 if(q.requires&&!profile.quests[q.requires]?.claimed)return 'Complete and claim the previous main quest first.';
 const progress=profile.quests[q.id];
 if(kind==='quest-accept'){if(progress)return 'Quest already accepted.';profile.quests[q.id]={progress:q.objectives.map(()=>0),claimed:false};return `Quest accepted: ${q.name}.`;}
 if(!progress||progress.claimed||!questComplete(q,progress))return 'Complete the quest objectives before claiming.';
 progress.claimed=true;profile.gold=Math.min(Number.MAX_SAFE_INTEGER,profile.gold+q.gold);profile.xp=Math.min(totalXp(rewards.levelCap),profile.xp+q.xp);profile.level=levelForXp(profile.xp);return `Quest complete: ${q.name}. +${q.gold} gold · +${q.xp} EXP.`;
 }
 if(kind==='cosmetics'){const next=migrateCosmetics((request as {cosmetics?:unknown}).cosmetics);if(!validCosmetics(next))return 'Choose a valid outfit, wings and aura.';profile.cosmetics={...next};return 'Appearance updated.';}
 if(kind==='depot-deposit'||kind==='depot-withdraw')return transferDepot(profile,p,request as {kind:unknown},this.add.bind(this));
 if(kind==='attribute'){
 if(!isAttribute(attribute))return 'Choose a valid attribute.';
 if(attributePoints(profile.level,profile.attributes)<1)return 'No attribute points available.';
 if(profile.attributes[attribute]>=attributeRules.cap)return 'This attribute is at its maximum.';
 profile.attributes[attribute]++;applyEquipment(profile,p);return `${attribute[0].toUpperCase()+attribute.slice(1)} increased.`;
 }
 if(kind==='class'){if(profile.classId!=='citizen')return 'Your class has already been chosen.';if(profile.level<classRules.unlockLevel)return 'Reach level 5 to choose your class.';if(!isClassChoice(classId))return 'Choose Knight, Archer, Mage or Rogue.';const starter=classes[classId].weapon;if(!fits({weapon:starter,ownedWeapons:profile.ownedWeapons.includes(starter)?profile.ownedWeapons:[...profile.ownedWeapons,starter],equippedGear:{...profile.equippedGear,weapon:null}}))return 'Inventory full. Free a slot before choosing your class.';profile.classId=classId;if(!profile.ownedWeapons.includes(starter))profile.ownedWeapons.push(starter);profile.weapon=starter;profile.equippedGear.weapon=null;applyEquipment(profile,p);p.auto=false;p.target='';return `You chose ${classes[classId].name}. ${weapons[starter].name} equipped.`;}
 if(kind==='equip'){if(!isWeapon(weapon)||!profile.ownedWeapons.includes(weapon))return 'You do not own that weapon.';if(profile.level<weapons[weapon].level)return `Reach level ${weapons[weapon].level} to equip this weapon.`;if(p.auto)return 'Stop attacking before changing weapons.';profile.weapon=weapon;profile.equippedGear.weapon=null;applyEquipment(profile,p);p.target='';return 'Weapon equipped.';}
 if(kind==='equip-item'){
 if(!isEquipment(item)||!profile.ownedEquipment.includes(item))return 'You do not own that item.';
 if(profile.level<equipmentItems[item].level)return `Reach level ${equipmentItems[item].level} to equip this item.`;
 if(p.auto)return 'Stop attacking before changing equipment.';
 profile.equipment[equipmentItems[item].slot]=item;profile.equippedGear[equipmentItems[item].slot]=null;applyEquipment(profile,p);return `${equipmentItems[item].name} equipped.`;
 }
 if(kind==='unequip-item'){
 if(!isEquipmentSlot(slot))return 'Choose an equipment slot.';
 if(p.auto)return 'Stop attacking before changing equipment.';
 if(!fits({equipment:{...profile.equipment,[slot]:null},equippedGear:{...profile.equippedGear,[slot]:null}}))return 'Inventory full. Free a slot before unequipping.';profile.equipment[slot]=null;profile.equippedGear[slot]=null;applyEquipment(profile,p);return `${equipmentSlots[slot]} unequipped.`;
 }
 if(kind==='identify'||kind==='equip-gear'||kind==='discard-gear'){
 const found=profile.gear.find(g=>g.id===item);if(!found)return 'You do not own that equipment.';
 if(kind==='identify'){if(found.rarity)return 'This equipment is already identified.';found.rarity=rollRarity(this.random);recordQuestEvent(profile.quests,'identify',gearDefinition(found.base).tier,Object.keys(islandEquipmentTiers).find(island=>islandEquipmentTiers[island]===gearDefinition(found.base).tier)??'');return `Identified: ${gearName(found)}.`;}
 const slot=gearSlot(found.base);
 if(kind==='discard-gear'){if(Object.values(profile.equippedGear).includes(found.id))return 'Unequip this item before discarding it.';profile.gear=profile.gear.filter(g=>g.id!==found.id);return 'Equipment discarded.';}
 if(!found.rarity)return 'Identify this equipment before equipping it.';
 if(profile.level<gearDefinition(found.base).level)return `Reach level ${gearDefinition(found.base).level} to equip this item.`;
 if(p.auto)return 'Stop attacking before changing equipment.';
 profile.equippedGear[slot]=found.id;if(isEquipment(found.base))profile.equipment[slot as EquipmentSlot]=found.base;else profile.weapon=found.base;
 applyEquipment(profile,p);p.target='';return `${gearName(found)} equipped.`;
 }
 if(kind==='unequip-gear'){
 const slot=Object.keys(profile.equippedGear).find(key=>profile.equippedGear[key as keyof GearLoadout]===item) as keyof GearLoadout|undefined;
 if(!slot)return 'This equipment is not equipped.';if(p.auto)return 'Stop attacking before changing equipment.';
 const fallback=profile.ownedWeapons[0]??'wand',ownedWeapons=slot==='weapon'&&!profile.ownedWeapons.length?['wand' as WeaponId]:profile.ownedWeapons;if(!fits({ownedWeapons,equippedGear:{...profile.equippedGear,[slot]:null},...(slot==='weapon'?{weapon:fallback}:{equipment:{...profile.equipment,[slot]:null}})}))return 'Inventory full. Free a slot before unequipping.';profile.ownedWeapons=ownedWeapons;profile.equippedGear[slot]=null;if(slot==='weapon')profile.weapon=fallback;else profile.equipment[slot]=null;applyEquipment(profile,p);return 'Equipment unequipped.';
 }
 if(kind==='pickup'){
 if(typeof drop!=='string')return 'Choose a loot bundle.';const d=this.drops.get(drop);
 if(!d||d.owner!==id||time>=d.expires||p.region!==(d.region??'woods')||Math.hypot(p.x-d.x,p.y-d.y)>rewards.pickupRange||!sight(p,d,p.region))return 'Move closer to your loot bundle.';
 let inventory=d.pelts?this.add(profile.inventory,'pelt',d.pelts):profile.inventory.map(s=>({...s}));if(inventory&&d.shards)inventory=this.add(inventory,'crystalShard',d.shards);if(!inventory)return 'Inventory full. Sell materials to free space.';if((d.gear&&profile.gear.length>=lootEquipmentRules.maxInstances)||!fits({inventory,gear:d.gear?[...profile.gear,d.gear]:profile.gear}))return 'Inventory full. Sell or discard items to free space.';
 // Mutations happen together after every prerequisite passes. A repeated ID finds no drop.
 profile.inventory=inventory;if(d.gear)profile.gear.push(cloneGear(d.gear));profile.gold+=d.gold;this.drops.delete(drop);recordQuestEvent(profile.quests,'loot',islandForRegion(d.region??'woods'),islandForRegion(d.region??'woods'));return `Collected ${d.gold} gold${d.pelts?` and ${d.pelts} wolf pelt`:``}${d.shards?` and ${d.shards} crystal shard${d.shards===1?'':'s'}`:``}${d.gear?' and unidentified equipment':''}.`;
 }
 if(kind==='potion'){
 const stack=profile.inventory.find(s=>s.item==='potion'&&s.quantity>0);
 if(!stack)return 'No healing potions. Buy one from Mara in Elderwood.';
 if(time<profile.potionReadyAt)return 'Your potion is still on cooldown.';
 if(p.hp>=maxHealth(p.attributes))return 'Your health is already full.';
 p.hp=Math.min(maxHealth(p.attributes),p.hp+items.potion.heal);profile.potionReadyAt=time+items.potion.cooldown;stack.quantity--;profile.inventory=profile.inventory.filter(s=>s.quantity>0);return 'Healing potion restored health.';
 }
 if(p.region!=='elderwood'||Math.hypot(p.x-merchant.x,p.y-merchant.y)>merchant.range)return 'Visit Mara the Trader in Elderwood.';
 if(kind==='sell-supply'){
 const stack=profile.inventory.find(s=>String(s.id)===item);if(!stack)return 'Choose a supply stack you own.';const gold=supplySellPrice(stack.item)*stack.quantity;profile.inventory=profile.inventory.filter(s=>s.id!==stack.id);profile.gold+=gold;return `Sold supply stack for ${gold} gold.`;
 }
 if(kind==='sell-gear'){
 const found=profile.gear.find(g=>g.id===item);if(!found)return 'You do not own that equipment.';if(Object.values(profile.equippedGear).includes(found.id))return 'Unequip this item before selling it.';
 const price=droppedSellPrice(found);profile.gear=profile.gear.filter(g=>g.id!==found.id);profile.gold+=price;return `Sold ${gearName(found)} for ${price} gold.`;
 }
 if(kind==='sell-equipment'){
 if(isEquipment(item)){if(!profile.ownedEquipment.includes(item))return 'You do not own that item.';const slot=equipmentItems[item].slot;if(profile.equipment[slot]===item&&!profile.equippedGear[slot])return 'Unequip this item before selling it.';profile.ownedEquipment=profile.ownedEquipment.filter(id=>id!==item);}
 else if(isWeapon(item)){if(!profile.ownedWeapons.includes(item))return 'You do not own that item.';if(profile.weapon===item&&!profile.equippedGear.weapon)return 'Unequip this item before selling it.';profile.ownedWeapons=profile.ownedWeapons.filter(id=>id!==item);}
 else return 'Choose valid equipment.';
 const price=catalogueSellPrice(item);profile.gold+=price;return `Sold equipment for ${price} gold.`;
 }
 if(kind==='buy-equipment'){
 const definition=isEquipment(item)?equipmentItems[item]:isWeapon(item)?weapons[item]:null;
 if(!definition)return 'Choose valid equipment.';
 if(profile.level<definition.level)return `Reach level ${definition.level} to buy this item.`;
 if((isEquipment(item)&&profile.ownedEquipment.includes(item))||(isWeapon(item)&&profile.ownedWeapons.includes(item)))return 'You already own that item.';
 if(profile.gold<definition.price)return `${definition.name} costs ${definition.price} gold.`;
 if(!fits(isEquipment(item)?{ownedEquipment:[...profile.ownedEquipment,item]}:isWeapon(item)?{ownedWeapons:[...profile.ownedWeapons,item]}:{}))return 'Inventory full. Sell or discard items to free space.';
 profile.gold-=definition.price;
 if(isEquipment(item))profile.ownedEquipment.push(item);else if(isWeapon(item))profile.ownedWeapons.push(item);
 return `Bought ${definition.name}.`;
 }
 if(kind==='learn'){if(!isSpell(spell)||!canLearnSpell(spell,profile))return 'That spell is unavailable for your class or level.';if(profile.learnedSpells.includes(spell))return 'You already know that spell.';const s=spells[spell];if(profile.gold<s.price)return `${s.name} costs ${s.price} gold.`;profile.gold-=s.price;profile.learnedSpells.push(spell);return `Learned ${s.name}.`; }
 if(kind==='buy'){
 if(profile.gold<items.potion.buy)return `A potion costs ${items.potion.buy} gold.`;
 const inventory=this.add(profile.inventory,'potion',1);if(!inventory||!fits({inventory}))return 'Inventory full. Sell or discard items to free space.';
 profile.gold-=items.potion.buy;profile.inventory=inventory;return 'Bought one healing potion.';
 }
 if(kind==='sell'){
 const count=profile.inventory.filter(s=>s.item==='pelt').reduce((sum,s)=>sum+s.quantity,0),shards=profile.inventory.filter(s=>s.item==='crystalShard').reduce((sum,s)=>sum+s.quantity,0);if(!count&&!shards)return 'No materials to sell.';
 const gold=count*items.pelt.sell+shards*items.crystalShard.sell;profile.inventory=profile.inventory.filter(s=>s.item!=='pelt'&&s.item!=='crystalShard');profile.gold+=gold;return shards?`Sold materials for ${gold} gold.`:`Sold ${count} wolf pelts for ${gold} gold.`;
 }
 return 'Invalid action.';
 }
 snapshot(id:string,time:number):EconomySnapshot{const p=this.profiles.get(id)!;return {...p,fishing:this.professions.status(id),nodeReadyAt:Object.fromEntries([...this.professions.depleted].filter(([node,ready])=>!node.startsWith('fish:')&&ready>time)),professions:{...p.professions},quests:structuredClone(p.quests),cosmetics:{...p.cosmetics},depot:structuredClone(p.depot),gear:p.gear.map(cloneGear),equippedGear:{...p.equippedGear},effectiveAttributes:effectiveAttributes(p),usedSlots:inventoryUsage(p),gearCapacity:lootEquipmentRules.maxInstances,weaponAttack:equippedInstance(p,'weapon')?gearStats(equippedInstance(p,'weapon')!).attack:weapons[p.weapon].attack,attributes:{...p.attributes},attributePoints:attributePoints(p.level,p.attributes),armor:profileArmor(p),equipment:{...p.equipment},ownedEquipment:[...p.ownedEquipment],learnedSpells:[...p.learnedSpells],ownedWeapons:[...p.ownedWeapons],skills:{...p.skills},skillXp:{...p.skillXp},inventory:p.inventory.map(s=>({...s})),drops:[...this.drops.values()].filter(d=>d.owner===id&&d.expires>time).map(d=>({...d,...(d.gear?{gear:cloneGear(d.gear)}:{})})),capacity:inventoryRules.capacity,nextXp:totalXp(Math.min(rewards.levelCap,p.level+1)),levelXp:totalXp(p.level),time};}
}
