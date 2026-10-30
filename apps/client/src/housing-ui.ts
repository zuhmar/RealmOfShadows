import {playerHouses,houseById,houseFloorIndex,houseDisplayTiles,items,equipmentItems,weapons,gearName,gearSlot,type PublicHouse,type HouseItem} from '@realm/game-data';
import type {EconomySnapshot} from '@realm/shared';
import {itemSprite,itemImageUrl} from './item-assets';
import type Phaser from 'phaser';
export const houseItemBase=(item:HouseItem)=>item.category==='gear'?item.gear.base:item.item;
export const houseItemName=(item:HouseItem)=>item.category==='gear'?gearName(item.gear):item.category==='supply'?items[item.item].name:item.category==='weapon'?weapons[item.item].name:equipmentItems[item.item].name;
export class HousingUI{
 dialog=document.createElement('dialog');active?:{house:string;floor?:number;x?:number;y?:number};pending=false;signature='';message='';
 constructor(private bag:()=>EconomySnapshot|undefined,private send:(r:unknown)=>void){this.dialog.id='house-dialog';document.body.append(this.dialog);}
 open(house:string,tile?:{floor:number;x:number;y:number}){this.active={house,...tile};this.message='';this.signature='';this.render();if(!this.dialog.open)this.dialog.showModal();}
 result(message:string){this.pending=false;this.message=message;this.signature='';this.render();}
 render(){if(!this.active)return;const bag=this.bag(),h=houseById(this.active.house);if(!h||!bag)return;const state=bag.houses?.find(s=>s.id===h.id),key=JSON.stringify([this.active,bag.houses,bag.gold,bag.inventory,bag.gear,bag.ownedEquipment,bag.ownedWeapons,bag.equipment,bag.weapon,bag.equippedGear,bag.account?.state,bag.housingAvailable,this.pending,this.message]);if(key===this.signature)return;this.signature=key;this.dialog.replaceChildren();
 const header=document.createElement('div');header.className='portal-heading';const title=document.createElement('h2');title.textContent=h.name;const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>this.dialog.close();header.append(title,close);this.dialog.append(header);
 const info=document.createElement('p');info.id='house-owner';info.textContent=state?.owned?`Owned by ${state.ownerName}${state.mine?' · Your house':''}`:`Unowned · ${h.price} gold`;this.dialog.append(info);const detail=document.createElement('p');detail.textContent=`${h.floors.length} floor${h.floors.length===1?'':'s'} · Public item displays · Bag: ${bag.usedSlots} / ${bag.capacity} · Gold: ${bag.gold}`;this.dialog.append(detail);
 const button=(label:string,r:Record<string,unknown>,disabled=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled||this.pending||!!bag.housingBusy;b.onclick=()=>{this.pending=true;this.message='Saving house…';this.signature='';this.render();this.send({...this.active,...r});};return b;};
 if(!state?.owned){const buy=button(`Buy house · ${h.price} gold`,{kind:'buy'},!bag.account||!bag.housingAvailable||bag.gold<h.price);buy.id='buy-house';this.dialog.append(buy);const note=document.createElement('p');note.textContent=!bag.account?'Sign in to buy a permanent house.':!bag.housingAvailable?'Housing saves are not available yet.':bag.gold<h.price?'Earn more gold before buying this house.':'Buying deducts gold once and saves ownership to your account.';this.dialog.append(note);}
 else if(this.active.floor!==undefined){const a=this.active,d=state.displays.find(d=>d.floor===a.floor&&d.x===a.x&&d.y===a.y);const label=document.createElement('p');label.textContent=d?`On display: ${houseItemName(d.item)}`:'Empty display tile';this.dialog.append(label);if(d)this.dialog.append(itemSprite(houseItemBase(d.item),houseItemName(d.item)));
 if(state.mine){if(d)this.dialog.append(button('Take item back',{kind:'take'}));else{
 const list=document.createElement('div');list.id='house-bag-items';this.dialog.append(list);
 const row=(category:string,item:string,base:string,name:string,equipped=false)=>{const card=document.createElement('div');card.className='depot-item';const text=document.createElement('span');text.textContent=name;card.append(itemSprite(base,name),text,button(equipped?'Equipped':'Display',{kind:'place',category,item},equipped));list.append(card);};
 for(const s of bag.inventory)row('supply',String(s.id),s.item,`${items[s.item].name} × ${s.quantity} · Display one`);
 for(const g of bag.gear)row('gear',g.id,g.base,gearName(g),Object.values(bag.equippedGear).includes(g.id));
 for(const id of bag.ownedEquipment)row('equipment',id,id,equipmentItems[id].name,bag.equipment[equipmentItems[id].slot]===id&&!bag.equippedGear[equipmentItems[id].slot]);
 for(const id of bag.ownedWeapons)row('weapon',id,id,weapons[id].name,bag.weapon===id&&!bag.equippedGear.weapon);
 if(!list.childElementCount)list.textContent='Your bag is empty.';
 }}else{const note=document.createElement('p');note.textContent='Only the owner can place or take display items.';this.dialog.append(note);}}
 else{const note=document.createElement('p');note.textContent=state.mine?'Walk through the single door. Click a display tile inside to place or retrieve an item.':'The door is open for visitors. Displayed items belong to the owner.';this.dialog.append(note);}
 const feedback=document.createElement('p');feedback.id='house-feedback';feedback.setAttribute('role','status');feedback.textContent=this.message;this.dialog.append(feedback);
 }
}
export function drawHousingWorld(scene:Phaser.Scene,region:string,houses:PublicHouse[],click:(id:string,tile?:{floor:number;x:number;y:number})=>void){
 const floor=houseFloorIndex(region);if(floor<0)return;
 for(const h of playerHouses){const state=houses.find(s=>s.id===h.id);if(floor===0){const zone=scene.add.zone(h.door.x*64,h.door.y*64-8,64,64).setInteractive({useHandCursor:true}).setDepth((h.door.y+1)*64+3).setData('houseDoor',h.id);zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(h.id)});}
 for(const tile of houseDisplayTiles(h,floor)){
  const d=state?.displays.find(d=>d.floor===floor&&d.x===tile.x&&d.y===tile.y),x=tile.x*64,y=tile.y*64;
  const plinth=scene.add.graphics();plinth.fillStyle(0x31483e,.8);plinth.fillRect(x-23,y-10,46,23);plinth.fillStyle(0x8c9678);plinth.fillRect(x-23,y-15,46,15);plinth.lineStyle(1,0xc8c7a5,.7);plinth.strokeRect(x-23,y-15,46,15);plinth.setDepth(y+1).setData('houseDisplay',h.id);
  const container=scene.add.container(x,y).setDepth(y+2);if(d)void itemImageUrl(houseItemBase(d.item)).then(async url=>{if(!url||!container.active)return;const key=`house-item-${houseItemBase(d.item)}`;if(!scene.textures.exists(key)){const im=new Image();im.src=url;await im.decode();if(!container.active)return;if(!scene.textures.exists(key))scene.textures.addImage(key,im);}if(container.active)container.add(scene.add.image(0,-20,key).setDisplaySize(40,40));}).catch(()=>{});
  const zone=scene.add.zone(x,y-8,56,56).setInteractive({useHandCursor:true}).setDepth(y+4).setData('houseDisplayHit',h.id);zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(h.id,{floor,...tile})});
 }
 }
}
