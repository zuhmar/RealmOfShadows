import type {RegionId} from './index';
import type {GearInstance} from './loot-equipment';
import type {EquipmentId} from './equipment';
import type {WeaponId} from './classes';
import type {ItemId} from './economy';
export const housingRegions=['elderwood-upper','elderwood-homes-upper','elderwood-homes-attic'] as const;
export const isHousingFloor=(region:string)=>housingRegions.includes(region as typeof housingRegions[number]);
export interface HouseRoom{x:number;y:number;w:number;h:number}
export interface PlayerHouse{id:string;name:string;price:number;roof:string;floors:readonly (readonly HouseRoom[])[];door:{x:number;y:number};terrace:HouseRoom;stairs:{x:number;y:number}}
/** Five separate properties. Unions of rectangles make stepped/L/T plans, never scaled shells. */
export const playerHouses:readonly PlayerHouse[]=[
 {id:'briar',name:'Briar Cottage',price:500,roof:'bank',floors:[[{x:8,y:1,w:5,h:4},{x:12,y:3,w:3,h:2}]],door:{x:10.5,y:4.5},terrace:{x:7,y:1,w:9,h:6},stairs:{x:9.5,y:2.5}},
 {id:'pinewatch',name:'Pinewatch House',price:1000,roof:'workshop',floors:[[{x:29,y:1,w:7,h:4},{x:33,y:4,w:3,h:2}],[{x:29,y:1,w:7,h:4}]],door:{x:34.5,y:5.5},terrace:{x:28,y:1,w:9,h:6},stairs:{x:30.5,y:2.5}},
 {id:'stonebend',name:'Stonebend Lodge',price:1500,roof:'smithy',floors:[[{x:1,y:10,w:4,h:7},{x:4,y:13,w:3,h:4}],[{x:1,y:10,w:4,h:6}]],door:{x:5.5,y:16.5},terrace:{x:1,y:9,w:7,h:10},stairs:{x:2.5,y:12.5}},
 {id:'eastridge',name:'Eastridge Manor',price:2500,roof:'hall',floors:[[{x:41,y:9,w:6,h:5},{x:43,y:14,w:4,h:3}],[{x:41,y:9,w:6,h:5}],[{x:42,y:10,w:4,h:3}]],door:{x:44.5,y:16.5},terrace:{x:40,y:8,w:7,h:11},stairs:{x:43.5,y:11.5}},
 {id:'sunset',name:'Sunset Terrace',price:750,roof:'depot',floors:[[{x:16,y:34,w:8,h:3},{x:18,y:37,w:4,h:2}]],door:{x:16.5,y:36.5},terrace:{x:15,y:33,w:10,h:6},stairs:{x:20.5,y:35.5}},
];
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
