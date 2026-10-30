import type {RegionId} from './index';
import type {GearInstance} from './loot-equipment';
import type {EquipmentId} from './equipment';
import type {WeaponId} from './classes';
import type {ItemId} from './economy';
export const housingRegions=['elderwood-upper','elderwood-homes-upper','elderwood-homes-attic'] as const;
export const isHousingFloor=(region:string)=>housingRegions.includes(region as typeof housingRegions[number]);
export interface HouseRoom{x:number;y:number;w:number;h:number}
export interface PlayerHouse{id:string;name:string;price:number;roof:string;side:'north'|'south'|'west'|'east';floors:readonly (readonly HouseRoom[])[];door:{x:number;y:number};terrace:HouseRoom;stairs:{x:number;y:number}}
/** Five different plans on each side, all on the expanded cliff belt outside the old town. */
const plans=[
 {name:'Cottage',price:500,roof:'bank',floors:[[{x:0,y:0,w:5,h:4},{x:4,y:2,w:3,h:2}]],door:{x:2.5,y:3.5},stairs:{x:1.5,y:1.5}},
 {name:'House',price:1000,roof:'workshop',floors:[[{x:0,y:0,w:7,h:4},{x:4,y:3,w:3,h:2}],[{x:0,y:0,w:7,h:4}]],door:{x:5.5,y:4.5},stairs:{x:1.5,y:1.5}},
 {name:'Lodge',price:1500,roof:'smithy',floors:[[{x:0,y:0,w:4,h:7},{x:3,y:3,w:3,h:4}],[{x:0,y:0,w:4,h:6}]],door:{x:4.5,y:6.5},stairs:{x:1.5,y:2.5}},
 {name:'Manor',price:2500,roof:'hall',floors:[[{x:0,y:0,w:6,h:5},{x:2,y:5,w:4,h:3}],[{x:0,y:0,w:6,h:5}],[{x:1,y:1,w:4,h:3}]],door:{x:3.5,y:7.5},stairs:{x:2.5,y:2.5}},
 {name:'Terrace',price:750,roof:'depot',floors:[[{x:0,y:0,w:8,h:3},{x:2,y:3,w:4,h:2}]],door:{x:.5,y:2.5},stairs:{x:4.5,y:1.5}},
];
const sidePlans={north:[0,1,2,3,4],west:[2,0,1,3,4],east:[3,0,1,2,4],south:[4,0,1,2,3]} as const;
const legacy:Record<string,{id:string;name:string}>={north0:{id:'briar',name:'Briar Cottage'},north1:{id:'pinewatch',name:'Pinewatch House'},west0:{id:'stonebend',name:'Stonebend Lodge'},east0:{id:'eastridge',name:'Eastridge Manor'},south0:{id:'sunset',name:'Sunset Terrace'}};
export const playerHouses:readonly PlayerHouse[]=(['north','west','east','south'] as const).flatMap(side=>sidePlans[side].map((template,i)=>{
 const p=plans[template],x=side==='west'?7:side==='east'?86:7+i*18,y=side==='north'?7:side==='south'?79:24+i*12,old=legacy[side+i];
 const move=<T extends {x:number;y:number}>(v:T)=>({...v,x:v.x+x,y:v.y+y});
 return{id:old?.id??`${side}${i+1}`,name:old?.name??`${side[0].toUpperCase()+side.slice(1)} ${p.name} ${i+1}`,side,price:p.price,roof:p.roof,floors:p.floors.map(f=>f.map(move)),door:move(p.door),stairs:move(p.stairs),terrace:{x:x-2,y:y-2,w:12,h:12}};
}));
export const houseById=(id:unknown)=>typeof id==='string'?playerHouses.find(h=>h.id===id):undefined;
export const houseFloorIndex=(region:string)=>housingRegions.indexOf(region as typeof housingRegions[number]);
const cellCache=new WeakMap<PlayerHouse,Map<number,Set<string>>>();
export function houseCells(h:PlayerHouse,floor:number){let cached=cellCache.get(h);if(!cached){cached=new Map();cellCache.set(h,cached);}const old=cached.get(floor);if(old)return old;const cells=new Set<string>();for(const r of h.floors[floor]??[])for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)cells.add(`${x},${y}`);cached.set(floor,cells);return cells;}
export function houseAt(p:{x:number;y:number;region?:string}){const floor=houseFloorIndex(p.region??'');return floor<0?undefined:playerHouses.find(h=>houseCells(h,floor).has(`${Math.floor(p.x)},${Math.floor(p.y)}`));}
export function houseDisplayTiles(h:PlayerHouse,floor:number){const cells=houseCells(h,floor),out:{x:number;y:number}[]=[];for(const key of cells){const[x,y]=key.split(',').map(Number);if(!cells.has(`${x},${y-1}`)&&cells.has(`${x},${y+1}`)&&Math.hypot(x+.5-h.stairs.x,y+.5-h.stairs.y)>1.5)out.push({x:x+.5,y:y+.5});}return out.slice(0,6);}
export type HouseItem={category:'supply';item:ItemId}|{category:'gear';gear:GearInstance}|{category:'equipment';item:EquipmentId}|{category:'weapon';item:WeaponId};
export interface HouseDisplay{floor:number;x:number;y:number;item:HouseItem}
export interface HouseRecord{id:string;ownerId:string|null;ownerName:string;revision:number;displays:HouseDisplay[]}
export interface PublicHouse{ id:string;ownerName:string;owned:boolean;mine:boolean;displays:HouseDisplay[] }
export const emptyHouse=(id:string):HouseRecord=>({id,ownerId:null,ownerName:'',revision:0,displays:[]});
export function nearHouseDoor(p:{x:number;y:number;region?:string},h:PlayerHouse){return p.region===housingRegions[0]&&Math.hypot(p.x-h.door.x,p.y-(h.door.y+1))<=1.6;}
export function validDisplayTile(h:PlayerHouse,floor:number,x:unknown,y:unknown){return typeof x==='number'&&typeof y==='number'&&houseDisplayTiles(h,floor).some(t=>t.x===x&&t.y===y);}
export function houseStairs(){return playerHouses.flatMap(h=>h.floors.slice(1).flatMap((_,i)=>[
 {id:`home-${h.id}-${i}-up`,from:housingRegions[i] as RegionId,to:housingRegions[i+1] as RegionId,x:h.stairs.x,y:h.stairs.y,radius:1.2,arrival:{x:h.stairs.x+1,y:h.stairs.y},direction:'up' as const,label:`${h.name} · Floor ${i+2}`},
 {id:`home-${h.id}-${i+1}-down`,from:housingRegions[i+1] as RegionId,to:housingRegions[i] as RegionId,x:h.stairs.x,y:h.stairs.y,radius:1.2,arrival:{x:h.stairs.x+1,y:h.stairs.y},direction:'down' as const,label:`${h.name} · Floor ${i+1}`},
 ]));}
