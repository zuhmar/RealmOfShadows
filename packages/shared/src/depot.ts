import {lootEquipmentRules,atDepot,depotRules,depotUsage,inventoryFits,isEquipment,isWeapon,equipmentItems,type DepotContents} from '@realm/game-data';
import type {Profile,Stack} from './economy';
import type {Fighter} from './combat';
export function transferDepot(profile:Profile,p:Fighter,request:{kind:unknown;item?:unknown;category?:unknown;box?:unknown},add:(stacks:Stack[],item:Stack['item'],quantity:number,capacity?:number)=>Stack[]|null):string{
 if(!atDepot(p,request.box))return 'Walk inside the Depot and stand beside a storage box.';
 if(p.auto)return 'Stop attacking before using storage.';
 const deposit=request.kind==='depot-deposit',category=request.category,item=request.item,bag={...profile,inventory:profile.inventory.map(s=>({...s})),gear:[...profile.gear],ownedEquipment:[...profile.ownedEquipment],ownedWeapons:[...profile.ownedWeapons]},storage:DepotContents=structuredClone(profile.depot);
 if(category==='supply'){
 const from=deposit?bag.inventory:storage.supplies,stack=from.find(s=>String(s.id)===item);if(!stack)return 'You do not own that supply stack.';
 const target=add(deposit?storage.supplies:bag.inventory,stack.item,stack.quantity,deposit?depotRules.capacity:undefined);if(!target)return deposit?'Depot storage is full.':'Your bag is full.';
 if(deposit){bag.inventory=from.filter(s=>s.id!==stack.id);storage.supplies=target;}else{storage.supplies=from.filter(s=>s.id!==stack.id);bag.inventory=target;}
 }else if(category==='gear'){
 const from=deposit?bag.gear:storage.gear,gear=from.find(g=>g.id===item);if(!gear)return 'You do not own that equipment.';
 if(deposit&&Object.values(profile.equippedGear).includes(gear.id))return 'Unequip this item before storing it.';
 if(deposit){bag.gear=from.filter(g=>g.id!==gear.id);storage.gear.push(gear);}else{storage.gear=from.filter(g=>g.id!==gear.id);bag.gear.push(gear);}
 }else if(category==='equipment'&&isEquipment(item)){
 const from=deposit?bag.ownedEquipment:storage.equipment;if(!from.includes(item))return 'You do not own that item.';
 if(deposit&&profile.equipment[equipmentItems[item].slot]===item&&!profile.equippedGear[equipmentItems[item].slot])return 'Unequip this item before storing it.';
 const target=deposit?storage.equipment:bag.ownedEquipment;if(target.includes(item))return 'That item is already in the destination.';
 if(deposit){bag.ownedEquipment=from.filter(id=>id!==item);storage.equipment.push(item);}else{storage.equipment=from.filter(id=>id!==item);bag.ownedEquipment.push(item);}
 }else if(category==='weapon'&&isWeapon(item)){
 const from=deposit?bag.ownedWeapons:storage.weapons;if(!from.includes(item))return 'You do not own that weapon.';
 if(deposit&&profile.weapon===item&&!profile.equippedGear.weapon)return 'Unequip this weapon before storing it.';
 const target=deposit?storage.weapons:bag.ownedWeapons;if(target.includes(item))return 'That weapon is already in the destination.';
 if(deposit){bag.ownedWeapons=from.filter(id=>id!==item);storage.weapons.push(item);}else{storage.weapons=from.filter(id=>id!==item);bag.ownedWeapons.push(item);}
 }else return 'Choose a valid item to transfer.';
 if(depotUsage(storage)>depotRules.capacity)return 'Depot storage is full.';
 if(!deposit&&!inventoryFits(profile,bag))return 'Your bag is full. Free a slot before withdrawing.';
 if(!deposit&&bag.gear.length>lootEquipmentRules.maxInstances)return 'Your bag is full.';
 profile.inventory=bag.inventory;profile.gear=bag.gear;profile.ownedEquipment=bag.ownedEquipment;profile.ownedWeapons=bag.ownedWeapons;profile.depot=storage;
 return deposit?'Item deposited in your personal storage.':'Item withdrawn to your bag.';
}
