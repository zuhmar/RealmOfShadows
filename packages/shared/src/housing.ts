import {lootEquipmentRules,items,houseById,houseFloorIndex,nearHouseDoor,validDisplayTile,houseAt,inventoryFits,equipmentItems,gearSlot,type HouseRecord,type HouseDisplay,type HouseItem,type PublicHouse,type PlayerHouse} from '@realm/game-data';
import type {Profile} from './economy';
export interface HousingActor{x:number;y:number;region:string;hp:number;auto:boolean}
export interface HousingRequest{kind:string;house:string;floor?:number;x?:number;y?:number;category?:string;item?:string}
export function publicHouse(h:HouseRecord,userId?:string):PublicHouse{return{id:h.id,ownerName:h.ownerName,owned:!!h.ownerId,mine:!!userId&&h.ownerId===userId,displays:structuredClone(h.displays)};}
/** Plan on clones: callers commit the profile and house together, never a client-supplied item. */
export function planHousing(profile:Profile,actor:HousingActor,house:HouseRecord,userId:string,ownerName:string,raw:unknown):{profile:Profile;house:HouseRecord;message:string}|string{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return 'Choose a valid house action.';
 const r=raw as HousingRequest,h=houseById(r.house);if(!h||house.id!==h.id)return 'Unknown house.';
 if(actor.hp<=0||actor.auto)return 'Stop fighting before using a house.';
 const next=structuredClone(profile),record=structuredClone(house);
 if(r.kind==='buy'){
  if(!nearHouseDoor(actor,h))return 'Stand beside the house door to buy it.';
  if(record.ownerId)return `Owned by ${record.ownerName}.`;
  if(next.gold<h.price)return `You need ${h.price} gold to buy ${h.name}.`;
  next.gold-=h.price;record.ownerId=userId;record.ownerName=ownerName.slice(0,40);record.revision++;
  return{profile:next,house:record,message:`You bought ${h.name} for ${h.price} gold. Your door is open to visitors.`};
 }
 if(record.ownerId!==userId)return 'Only the owner can change this house display.';
 const floor=houseFloorIndex(actor.region);if(r.floor!==floor||houseAt(actor)?.id!==h.id||!validDisplayTile(h,floor,r.x,r.y)||Math.hypot(actor.x-r.x!,actor.y-r.y!)>1.6)return 'Stand beside a display tile inside your house.';
 const index=record.displays.findIndex(d=>d.floor===floor&&d.x===r.x&&d.y===r.y);
 if(r.kind==='place'){
  if(index>=0)return 'This display tile is occupied. Take its item back first.';
  let item:HouseItem|undefined;
  if(r.category==='supply'){const stack=next.inventory.find(s=>String(s.id)===r.item);if(stack){item={category:'supply',item:stack.item};stack.quantity--;next.inventory=next.inventory.filter(s=>s.quantity>0);}}
  if(r.category==='gear'){const gear=next.gear.find(g=>g.id===r.item);if(gear){if(Object.values(next.equippedGear).includes(gear.id))return 'Unequip this item first.';item={category:'gear',gear};next.gear=next.gear.filter(g=>g.id!==gear.id);}}
  if(r.category==='equipment'){const id=next.ownedEquipment.find(id=>id===r.item);if(id){if(next.equipment[equipmentItems[id].slot]===id&&!next.equippedGear[equipmentItems[id].slot])return 'Unequip this item first.';item={category:'equipment',item:id};next.ownedEquipment=next.ownedEquipment.filter(k=>k!==id);}}
  if(r.category==='weapon'){const id=next.ownedWeapons.find(id=>id===r.item);if(id){if(next.weapon===id&&!next.equippedGear.weapon)return 'Unequip this weapon first.';item={category:'weapon',item:id};next.ownedWeapons=next.ownedWeapons.filter(k=>k!==id);}}
  if(!item)return 'Choose an unequipped item from your bag.';
  record.displays.push({floor,x:r.x!,y:r.y!,item});
 }else if(r.kind==='take'){
  if(index<0)return 'This display tile is empty.';const item=record.displays[index].item;
  if(item.category==='supply'){const stack=next.inventory.find(s=>s.item===item.item&&s.quantity<items[item.item].stack);if(stack){stack.quantity++;}else next.inventory.push({id:Math.max(0,...next.inventory.map(s=>s.id),...next.depot.supplies.map(s=>s.id))+1,item:item.item,quantity:1});}
  else if(item.category==='gear')next.gear.push(item.gear);
  else if(item.category==='equipment'){if(next.ownedEquipment.includes(item.item))return 'You already have this equipment in your bag.';next.ownedEquipment.push(item.item);}
  else{if(next.ownedWeapons.includes(item.item))return 'You already have this weapon in your bag.';next.ownedWeapons.push(item.item);}
  if(next.gear.length>lootEquipmentRules.maxInstances)return 'Your bag is full. Free a slot before taking this item.';
  if(!inventoryFits(profile,next))return 'Your bag is full. Free a slot before taking this item.';
  record.displays.splice(index,1);
 }else return 'Choose a valid house action.';
 record.revision++;return{profile:next,house:record,message:r.kind==='place'?'Item placed on display. Visitors can see it.':'Item returned to your bag.'};
}
