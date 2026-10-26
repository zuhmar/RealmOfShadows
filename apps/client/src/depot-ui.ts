import {depotRules,depotUsage,equipmentItems,weapons,gearName,gearSlot,items} from '@realm/game-data';
import type {EconomySnapshot} from '@realm/shared';
import {itemSprite} from './item-assets';
export interface DepotRequest{kind:string;category:string;item:string;box:string}
let previous='';
export function renderDepot(bag:EconomySnapshot,box:string,act:(request:DepotRequest)=>void,force=false){
 const key=JSON.stringify([bag.depot,bag.inventory,bag.gear,bag.ownedEquipment,bag.ownedWeapons,bag.equipment,bag.weapon,bag.equippedGear,!!bag.account]);if(!force&&key===previous)return;previous=key;
 document.querySelector('#depot-summary')!.textContent=`Bag ${bag.usedSlots} / ${bag.capacity} · Storage ${depotUsage(bag.depot)} / ${depotRules.capacity} slots`;
 document.querySelector('#depot-save-note')!.textContent=bag.account?'Personal storage · Saved with your character.':'Guest storage lasts for this session. Signed-in characters have saved storage.';
 for(const [direction,target]of [['deposit','#depot-bag-items'],['withdraw','#depot-storage-items']] as const){
 const list=document.querySelector(target)!;list.replaceChildren();
 const row=(category:string,id:string,base:string,name:string,detail:string,equipped=false)=>{const card=document.createElement('div');card.className='depot-item';card.append(itemSprite(base,name));const info=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('span');title.textContent=name;description.textContent=equipped?'Equipped · Unequip in your bag first':detail;info.append(title,description);const button=document.createElement('button');button.type='button';button.textContent=direction==='deposit'?'Deposit':'Withdraw';button.disabled=equipped;button.dataset.category=category;button.dataset.item=id;button.dataset.direction=direction;button.addEventListener('click',()=>act({kind:`depot-${direction}`,category,item:id,box}));card.append(info,button);list.append(card);};
 const stored=direction==='withdraw';
 for(const stack of stored?bag.depot.supplies:bag.inventory)row('supply',String(stack.id),stack.item,items[stack.item].name,`${stack.quantity} items · Transfer whole stack`);
 for(const gear of stored?bag.depot.gear:bag.gear)row('gear',gear.id,gear.base,gearName(gear),gear.rarity?'Rarity and bonuses stay unchanged':'Unidentified',!stored&&bag.equippedGear[gearSlot(gear.base)]===gear.id);
 for(const id of stored?bag.depot.equipment:bag.ownedEquipment){const slot=equipmentItems[id].slot;row('equipment',id,id,equipmentItems[id].name,'Equipment',!stored&&bag.equipment[slot]===id&&!bag.equippedGear[slot]);}
 for(const id of stored?bag.depot.weapons:bag.ownedWeapons)row('weapon',id,id,weapons[id].name,'Weapon',!stored&&bag.weapon===id&&!bag.equippedGear.weapon);
 if(!list.children.length){const empty=document.createElement('p');empty.textContent=stored?'Your personal storage is empty.':'No items in your bag.';list.append(empty);}
 }
}
