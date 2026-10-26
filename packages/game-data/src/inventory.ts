import {items,type ItemId} from './economy';
import {equipmentItems,type Equipment,type EquipmentId} from './equipment';
import {type WeaponId} from './classes';
import {type GearInstance,type GearLoadout,gearDefinition,gearStats,rarityDefinitions} from './loot-equipment';
export const inventoryRules={capacity:32};
export interface InventoryContents{inventory:unknown[];gear:GearInstance[];equippedGear:GearLoadout;equipment:Equipment;weapon:WeaponId;ownedEquipment:EquipmentId[];ownedWeapons:WeaponId[]}
export function inventoryUsage(p:InventoryContents){return p.inventory.length+p.gear.filter(g=>!Object.values(p.equippedGear).includes(g.id)).length+p.ownedWeapons.filter(id=>p.weapon!==id||p.equippedGear.weapon!==null).length+p.ownedEquipment.filter(id=>p.equipment[equipmentItems[id].slot]!==id||p.equippedGear[equipmentItems[id].slot]!==null).length;}
// Preserve old inventories even above the new limit. Only actions that do not
// increase their slot use are permitted until the owner sells/discards items.
export function inventoryFits(before:InventoryContents,after:InventoryContents){return inventoryUsage(after)<=Math.max(inventoryRules.capacity,inventoryUsage(before));}
export function catalogueSellPrice(id:EquipmentId|WeaponId){return Math.max(0,Math.floor(gearDefinition(id).price/4));}
export function droppedSellPrice(item:GearInstance){const base=catalogueSellPrice(item.base);return item.rarity?Math.max(2,base+gearStats(item).armor+gearStats(item).attack+rarityDefinitions[item.rarity].attributes*3):Math.max(1,base);}

export function supplySellPrice(id:ItemId){const item=items[id];return 'sell'in item?item.sell:Math.floor(item.buy/4);}
