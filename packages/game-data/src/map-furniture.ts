import {craftingStations} from './town-services';
import {mapObject,type IslandObject} from './island-layout';
/** Furniture uses 64px per floor cell, plus a 16px elevated top gutter. */
export interface FurniturePiece extends IslandObject {sourceKey?:string;serviceFor?:string}
export type CounterEnd='single'|'start'|'middle'|'end'|'corner-nw'|'corner-ne'|'corner-sw'|'corner-se';
export const furniturePiece=(family:string,end:CounterEnd,x:number,y:number,sourceKey?:string):FurniturePiece=>({...mapObject(`map-furniture-${family}-${end}`,x*48,(y-.25)*48,48,60),footY:(y+1)*48,sourceKey});
/** Expand logical furniture into reusable cells. Collision remains the authored footprint. */
export function modularFurniture(object:IslandObject):FurniturePiece[]|undefined{
 const skill=object.key.match(/^craft-bench-(blacksmithing|woodworking|cooking|alchemy)$/)?.[1];
 if(skill){
  const station=craftingStations.find(s=>'bench'in s&&s.bench.key===object.key);if(!station||!('bench'in station))return;
  const cells=station.bench.cells,occupied=new Set(cells.map(([x,y])=>`${x},${y}`));
  return cells.flatMap(([x,y],i)=>{
   const mask=(occupied.has(`${x},${y-1}`)?1:0)|(occupied.has(`${x+1},${y}`)?2:0)|(occupied.has(`${x},${y+1}`)?4:0)|(occupied.has(`${x-1},${y}`)?8:0);
   const base={...mapObject(`counter-connected-${mask}`,x*48,(y-.25)*48,48,60),footY:(y+1)*48,sourceKey:object.key};
   return i===1?[base,{...mapObject(`counter-tools-${skill}-${station.npc.facing}`,(x+.0625)*48,(y-.28)*48,42,42),footY:(y+1)*48+.1,sourceKey:object.key}]:[base];
  });
 }
 // Preserve the purpose-drawn side/back views rather than replacing them with front modules.
 if(/^furn-.*-(left|right|up)$/.test(object.key))return;
 const family=/^furn-counter-/.test(object.key)?'counter':/^furn-(meeting|table)-/.test(object.key)?'table':/^furn-bench-/.test(object.key)?'bench':/^furn-bookshelf-/.test(object.key)?'shelf':undefined;
 if(!family)return;
 const width=Math.max(1,Math.round(object.w/48)),x=object.x/48,y=(object.y+object.h)/48-1;
 return Array.from({length:width},(_,i)=>furniturePiece(family,width===1?'single':i===0?'start':i===width-1?'end':'middle',x+i,y,object.key));
}
