import {townPoint} from './elderwood-layout';
import {villageBuildings} from './village-buildings';
import type {GearInstance} from './loot-equipment';
import type {EquipmentId} from './equipment';
import type {WeaponId} from './classes';
import type {ItemId} from './economy';
export interface DepotContents{supplies:{id:number;item:ItemId;quantity:number}[];gear:GearInstance[];equipment:EquipmentId[];weapons:WeaponId[]}
export const depotRules={capacity:100};
export const emptyDepot=():DepotContents=>({supplies:[],gear:[],equipment:[],weapons:[]});
export const depotUsage=(depot:DepotContents)=>depot.supplies.length+depot.gear.length+depot.equipment.length+depot.weapons.length;
export const baseDepotBoxes=[{id:'depot-west',x:20.5,y:16.5},{id:'depot-center',x:24.5,y:16.5},{id:'depot-east',x:28.5,y:16.5}] as const;
export const depotBoxes=baseDepotBoxes.map(townPoint);
export function atDepot(p:{x:number;y:number;region:string},box?:unknown){const b=villageBuildings.find(b=>b.id==='depot')!;return p.region==='elderwood'&&p.x>b.x&&p.x<b.x+b.width&&p.y>b.y&&p.y<b.y+b.height&&depotBoxes.some(b=>(box===undefined||b.id===box)&&Math.max(Math.abs(p.x-b.x),Math.abs(p.y-b.y))<=1.01&&Math.hypot(p.x-b.x,p.y-b.y)>.2);}
