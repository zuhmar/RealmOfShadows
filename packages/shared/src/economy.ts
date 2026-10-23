import {items,rewards,merchant,combat as C,totalXp,levelForXp,type ItemId} from '@realm/game-data';
import {sight,type Fighter,type Kill} from './combat';
export interface Stack{id:number;item:ItemId;quantity:number}
export interface Profile{gold:number;xp:number;level:number;inventory:Stack[];potionReadyAt:number}
export interface Drop{id:string;owner:string;x:number;y:number;gold:number;pelts:number;expires:number}
export interface EconomySnapshot extends Profile{drops:Drop[];capacity:number;nextXp:number;levelXp:number;time:number}
export class Economy{
 profiles=new Map<string,Profile>();drops=new Map<string,Drop>();lastKill=0;serial=0;
 join(id:string){if(!this.profiles.has(id))this.profiles.set(id,{gold:0,xp:0,level:1,inventory:[],potionReadyAt:0});}
 leave(id:string){this.profiles.delete(id);for(const [key,d] of this.drops)if(d.owner===id)this.drops.delete(key);}
 process(kills:Kill[],players:Map<string,Fighter>|{get(id:string):Fighter|undefined},time:number){
 for(const kill of kills){if(kill.id<=this.lastKill)continue;this.lastKill=kill.id;const p=players.get(kill.owner),profile=this.profiles.get(kill.owner);if(!p||!profile)continue;profile.xp=Math.min(totalXp(rewards.levelCap),profile.xp+rewards.wolfXp);profile.level=levelForXp(profile.xp);const id=`spoils-${kill.id}`;this.drops.set(id,{id,owner:kill.owner,x:kill.x,y:kill.y,gold:rewards.wolfGold,pelts:rewards.wolfPelts,expires:time+rewards.dropLifetime});}
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
 if(!request||typeof request!=='object')return 'Invalid action.';const {kind,drop}=request as {kind:unknown;drop:unknown};
 if(kind==='pickup'){
 if(typeof drop!=='string')return 'Choose a loot bundle.';const d=this.drops.get(drop);
 if(!d||d.owner!==id||time>=d.expires||p.region!=='woods'||Math.hypot(p.x-d.x,p.y-d.y)>rewards.pickupRange||!sight(p,d))return 'Move closer to your loot bundle.';
 const inventory=this.add(profile.inventory,'pelt',d.pelts);if(!inventory)return 'Inventory full. Sell materials to free space.';
 // Mutations happen together after every prerequisite passes. A repeated ID finds no drop.
 profile.inventory=inventory;profile.gold+=d.gold;this.drops.delete(drop);return `Collected ${d.gold} gold and ${d.pelts} wolf pelt.`;
 }
 if(kind==='potion'){
 const stack=profile.inventory.find(s=>s.item==='potion'&&s.quantity>0);
 if(!stack)return 'No healing potions. Buy one from Mara in Elderwood.';
 if(time<profile.potionReadyAt)return 'Your potion is still on cooldown.';
 if(p.hp>=C.playerHp)return 'Your health is already full.';
 p.hp=Math.min(C.playerHp,p.hp+items.potion.heal);profile.potionReadyAt=time+items.potion.cooldown;stack.quantity--;profile.inventory=profile.inventory.filter(s=>s.quantity>0);return 'Healing potion restored health.';
 }
 if(p.region!=='elderwood'||Math.hypot(p.x-merchant.x,p.y-merchant.y)>merchant.range)return 'Visit Mara the Trader in Elderwood.';
 if(kind==='buy'){
 if(profile.gold<items.potion.buy)return `A potion costs ${items.potion.buy} gold.`;
 const inventory=this.add(profile.inventory,'potion',1);if(!inventory)return 'Inventory full.';
 profile.gold-=items.potion.buy;profile.inventory=inventory;return 'Bought one healing potion.';
 }
 if(kind==='sell'){
 const count=profile.inventory.filter(s=>s.item==='pelt').reduce((sum,s)=>sum+s.quantity,0);if(!count)return 'No wolf pelts to sell.';
 profile.inventory=profile.inventory.filter(s=>s.item!=='pelt');profile.gold+=count*items.pelt.sell;return `Sold ${count} wolf pelts for ${count*items.pelt.sell} gold.`;
 }
 return 'Invalid action.';
 }
 snapshot(id:string,time:number):EconomySnapshot{const p=this.profiles.get(id)!;return {...p,inventory:p.inventory.map(s=>({...s})),drops:[...this.drops.values()].filter(d=>d.owner===id&&d.expires>time).map(d=>({...d})),capacity:rewards.capacity,nextXp:totalXp(Math.min(rewards.levelCap,p.level+1)),levelXp:totalXp(p.level),time};}
}
