import {playerHouses,houseCells} from './housing';
import {mapObject,type IslandObject} from './island-layout';
export const neighborhoodPlaces=[
 {name:'North Well Court',x:55,y:25,w:7,h:4,entry:{x:57,y:24},approach:{x:57,y:22}},
 {name:'West Flower Walk',x:24,y:52,w:5,h:5,entry:{x:23,y:54},approach:{x:22,y:54}},
 {name:'South Picnic Green',x:40,y:69,w:7,h:4,entry:{x:43,y:73},approach:{x:51,y:73}},
 {name:'East Orchard',x:76,y:34,w:4,h:8,entry:{x:80,y:38},approach:{x:82,y:38}},
] as const;
/** Purposeful public spaces and loose planting, with all formal routes reserved. */
export function refineNeighborhood(cells:number[][],objects:IslandObject[],blocked:Set<string>){
 const homes=new Set(playerHouses.flatMap(h=>[...houseCells(h,0)])),visual=new Set<string>();
 for(const o of objects)for(let y=Math.floor(o.y/48);y<Math.ceil((o.y+o.h)/48);y++)for(let x=Math.floor(o.x/48);x<Math.ceil((o.x+o.w)/48);x++)visual.add(`${x},${y}`);
 const clear=(x:number,y:number,w=1,h=1,tree=false)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
  if(cells[yy]?.[xx]!==0||blocked.has(`${xx},${yy}`)||homes.has(`${xx},${yy}`)||visual.has(`${xx},${yy}`))return false;
  if(tree)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(homes.has(`${xx+dx},${yy+dy}`))return false;
 }return true;};
 const prop=(key:string,x:number,y:number,w=1,h=1,solid=true,name?:string)=>{
  const o=mapObject(key,x*48,y*48,w*48,h*48,[],name);o.footY=(y+h-.15)*48;
  if(solid){o.footprint={x:x+Math.floor(w/2),y:y+h-1,width:1,height:1};blocked.add(`${o.footprint.x},${o.footprint.y}`);}
  objects.push(o);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)visual.add(`${xx},${yy}`);
 };
 const pave=(x:number,y:number,material=2)=>{if(cells[y]?.[x]===0&&!homes.has(`${x},${y}`)&&!blocked.has(`${x},${y}`))cells[y][x]=material;};
 const connect=(a:{x:number;y:number},b:{x:number;y:number})=>{let{x,y}=a;pave(x,y);while(x!==b.x||y!==b.y){if(x!==b.x)x+=Math.sign(b.x-x);else y+=Math.sign(b.y-y);pave(x,y);}};
 for(const place of neighborhoodPlaces){
  // Draw a small, irregular paved heart while keeping the green edges open.
  for(let y=place.y+1;y<place.y+place.h-1;y++)for(let x=place.x+1;x<place.x+place.w-1;x++)if(clear(x,y))pave(x,y);
  connect(place.approach,place.entry);connect(place.entry,{x:place.x+Math.floor(place.w/2),y:place.y+Math.floor(place.h/2)});
 }
 // Public well, quiet seats and a picnic table use the existing directional prop art.
 for(const[key,x,y,name]of [
  ['furn-well-down',58,26,'North Well Court'],['furn-bench-down',56,25,'Well court bench'],
  ['furn-bench-right',24,53,'Flower walk bench'],['furn-planter-down',27,52,'Flower walk planter'],
  ['furn-table-down',42,70,'Picnic table'],['furn-bench-down',44,69,'Picnic bench'],
  ['furn-bench-left',79,40,'Orchard bench'],
 ] as const){if(!homes.has(`${x},${y}`)&&!blocked.has(`${x},${y}`)&&!visual.has(`${x},${y}`)&&(cells[y]?.[x]===0||cells[y]?.[x]===2))prop(key,x,y,1,1,true,name);}
 const trees=[
  [14,16],[18,17],[34,14],[38,16],[51,15],[56,16],[69,15],[74,16],[86,16],
  [13,19],[25,24],[27,34],[24,49],[26,58],[24,64],
  [75,33],[77,36],[76,43],[76,65],[78,70],[75,75],
  [14,75],[31,74],[36,76],[40,66],[46,69],[56,75],[61,76],[69,76],[85,75],
 ];
 for(const[x,y]of trees)if(clear(x,y,3,3,true)){
  prop('elderwood-oak',x,y,3,3,true);cells[y+2][x+1]=1;
  for(const[dx,dy]of [[-1,2],[3,1],[2,3]])if(clear(x+dx,y+dy))prop('woods-flowers',x+dx,y+dy,1,1,false);
 }
 for(const p of neighborhoodPlaces)for(const[dx,dy]of [[0,0],[p.w-1,0],[0,p.h-1],[p.w-1,p.h-1]])if(clear(p.x+dx,p.y+dy))prop('woods-flowers',p.x+dx,p.y+dy,1,1,false);
 for(const[i,h]of playerHouses.entries()){
  const x=Math.floor(h.door.x)+(i%2?2:-2),y=Math.floor(h.door.y)+1;
  if(clear(x,y))prop(i%4===0?'furn-barrel-down':i%4===1?'furn-planter-down':'woods-flowers',x,y,1,1,i%4<2);
 }
}
