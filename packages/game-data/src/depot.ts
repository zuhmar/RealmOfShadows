import type {GearInstance} from './loot-equipment';
import type {EquipmentId} from './equipment';
import type {WeaponId} from './classes';
import type {ItemId} from './economy';
export interface DepotContents{supplies:{id:number;item:ItemId;quantity:number}[];gear:GearInstance[];equipment:EquipmentId[];weapons:WeaponId[]}
export const depotRules={capacity:100};
export const emptyDepot=():DepotContents=>({supplies:[],gear:[],equipment:[],weapons:[]});
export const depotUsage=(depot:DepotContents)=>depot.supplies.length+depot.gear.length+depot.equipment.length+depot.weapons.length;
export const depotBoxes=[{id:'depot-west',x:7.5,y:3.5},{id:'depot-center',x:9.5,y:3.5},{id:'depot-east',x:11.5,y:3.5}] as const;
export function atDepot(p:{x:number;y:number;region:string},box?:unknown){return p.region==='elderwood'&&p.x>5.9&&p.x<13&&p.y>3&&p.y<8&&depotBoxes.some(b=>(box===undefined||b.id===box)&&Math.max(Math.abs(p.x-b.x),Math.abs(p.y-b.y))<=1.01&&Math.hypot(p.x-b.x,p.y-b.y)>.2);}
