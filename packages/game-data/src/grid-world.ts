import {craftingStations} from './town-services';
import {villageBuildings,buildingsFor,isVillageUpper} from './village-buildings';
import {woodsGridEncounters} from './woods-grid-spawns';
import {depotBoxes} from './depot';
import overrides from './grid-overrides.json';
import type {RegionId} from './index';
import {mapObject,type IslandObject} from './island-layout';
export interface GridMap{width:number;height:number;cells:number[][];objects:IslandObject[];blocked:Set<string>;edges:Set<string>}
export const gridDirections=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]] as const;
const cache=new Map<string,GridMap>();
export const gridCell=(p:{x:number;y:number})=>({x:Math.floor(p.x)+.5,y:Math.floor(p.y)+.5});
export const gridKey=(p:{x:number;y:number})=>`${Math.floor(p.x)},${Math.floor(p.y)}`;
export function gridMap(region:string):GridMap{
 const old=cache.get(region);if(old)return old;
 const lower=region.endsWith('-depths'),village=region==='elderwood'||isVillageUpper(region),cave=region.startsWith('caverns');
 const width=lower?48:region==='woods'?68:region==='caverns'?64:32,height=lower?36:region==='woods'||region==='caverns'?48:24;
 const cells=Array.from({length:height},()=>Array<number>(width).fill(cave||lower||isVillageUpper(region)?5:0)),objects:IslandObject[]=[],blocked=new Set<string>(),edges=new Set<string>();
 const rect=(x:number,y:number,w:number,h:number,material:number)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(j>=0&&i>=0&&j<height&&i<width)cells[j][i]=material;};
 const path=(points:readonly (readonly [number,number])[],material=1)=>{for(let i=1;i<points.length;i++){let [x,y]=points[i-1];const [tx,ty]=points[i];rect(x-1,y-1,3,3,material);while(x!==tx||y!==ty){x+=Math.sign(tx-x);y+=Math.sign(ty-y);rect(x-1,y-1,3,3,material);}}};
 const prop=(key:string,x:number,y:number,w:number,h:number,solidW=0,solidH=0)=>{
  if(village){
   const names:Record<string,string>={'depot-box':'chest-down','village-forge':'forge-down','village-workbench':'workbench-down','village-counter':'counter-down','village-table':'meeting-down','town-bookshelf':x===27?'bookshelf-left':'bookshelf-down','town-bed':'bed-down','town-table':'table-left','town-armor':'armor-left','town-tools':'tools-down','town-chair':'chair-right','town-well':'well-down','elderwood-bench':'bench-down','elderwood-planter':'planter-down','elderwood-barrel':x===26?'barrel-up':'barrel-down','town-stairs-up':'stairsup-down','town-stairs-down':'stairsdown-down'};
   if(names[key]){if(key==='elderwood-bench'){y+=h-2;h=2;}if(key==='elderwood-planter'){y+=h-1;h=1;}key=`furn-${names[key]}`;}
  }
  objects.push(mapObject(key,x*48,y*48,w*48,h*48));for(let dy=0;dy<solidH;dy++)for(let dx=0;dx<solidW;dx++)blocked.add(`${x+dx},${y+h-solidH+dy}`);};
 if(village){
  if(!isVillageUpper(region)){rect(1,1,30,22,0);rect(1,19,30,4,3);rect(14,2,5,17,2);rect(3,9,26,3,1);rect(3,15,26,3,1);rect(14,19,5,4,4);rect(19,17,10,6,0);path([[27,16],[27,22],[23,22]]);
  // A sheltered southern pond, stepped banks and a continuous timber crossing.
  rect(1,19,12,4,0);rect(2,20,11,3,3);rect(4,19,6,1,3);rect(1,21,1,2,3);rect(12,21,2,2,3);
  rect(14,19,5,4,3);rect(15,19,3,4,4);
  // Short routes lead to each service; the central square remains unobstructed.
  path([[17,9],[24,9],[25,8]],2);path([[10,10],[9,10],[9,9]],2);
  path([[8,17],[12,17],[12,14],[14,14]]);path([[19,16],[22,16],[25,17]]);
  }
  // Every village building is assembled from the same edge-aligned tile kit.
  for(const building of buildingsFor(region)){
   const {x,y,width:w,height:h,door,doorWidth}=building,prefix=building.id==='depot'?'depot':'village';
   const doorway=(column:number)=>!isVillageUpper(region)&&column>=x+door&&column<x+door+doorWidth;
   rect(x,y,w,h,4);
   for(let row=y;row<y+h;row++)for(let column=x;column<x+w;column++)prop(building.id==='smithy'||building.id==='bank'?'town-floor-stone':'depot-floor',column,row,1,1);
   for(let column=x+1;column<x+w-1;column++){prop(`${prefix}-wall-n`,column,y,1,1);if(!doorway(column))prop(`${prefix}-wall-s`,column,y+h-1,1,1);}
   for(let row=y+1;row<y+h-1;row++){prop(`${prefix}-wall-w`,x,row,1,1);prop(`${prefix}-wall-e`,x+w-1,row,1,1);}
   for(const [corner,cx,cy]of [['nw',x,y],['ne',x+w-1,y],['sw',x,y+h-1],['se',x+w-1,y+h-1]] as const)prop(`${prefix}-wall-${corner}`,cx,cy,1,1);
   for(let row=y;row<y+h;row++){edges.add(`v:${x},${row}`);edges.add(`v:${x+w},${row}`);}
   for(let column=x;column<x+w;column++){edges.add(`h:${column},${y}`);if(!doorway(column))edges.add(`h:${column},${y+h}`);}
   if(!isVillageUpper(region)&&building.id!=='depot')prop(building.id==='workshop'?'crafting-hall-sign':`village-sign-${building.id}`,x+1,y-1,w-2,.8);
  }
  if(!isVillageUpper(region)){
  for(const box of depotBoxes)prop('depot-box',box.x-.5,box.y-.5,1,1,1,1);
  prop('depot-sign',8,1,3,1.25);
  prop('village-forge',23,4,2,2,2,1);prop('elderwood-barrel',26,4,1,1,1,1);
  prop('furn-chest-down',23,6,1,1,1,1);prop('town-tools',26,3,1,1);
  for(const station of craftingStations)if('npc'in station){blocked.add(`${Math.floor(station.npc.x)},${Math.floor(station.npc.y)}`);objects.push(mapObject(station.bench.key,station.bench.x*48,station.bench.y*48,96,96));for(const [x,y]of station.bench.cells)blocked.add(`${x},${y}`);}
  rect(2,18,12,1,2);rect(13,14,1,5,2);
  prop('village-counter',24,12,2,2,2,1);prop('village-table',21,18,2,2,2,1);
  rect(13,11,7,6,2);prop('elderwood-portal',15,10.5,3,3);
  for(const [x,y]of [[2,2],[2,5],[28,1],[28,7]])prop('elderwood-oak',x,y,2,3,1,1);
  for(const [x,y]of [[2,7],[29,11],[1,9],[29,18]])prop('elderwood-oak',x,y,2,3,1,1);
  prop('elderwood-bench',18.5,14,1.6,.65);prop('elderwood-planter',18.5,13,1,.8);
  prop('woods-flowers',12,18,1,.6);prop('woods-flowers',20,10,1,.6);
  for(const x of [13,19])for(const y of [8,17])prop('elderwood-lamp',x,y, .6,1.5);
  }else{
   prop('town-bookshelf',6,2,2,2,2,1);prop('town-bed',6,5,2,2,1,1);prop('town-table',9,3,2,2,1,1);
   prop('town-bookshelf',20,18,2,2,2,1);prop('town-bookshelf',22,18,2,2,2,1);
  }
  // Directional windows, room furnishings and wooden staircases share the same grid.
  for(const b of buildingsFor(region)){
   prop('town-window',b.x+1,b.y-.15,1.3,.9);
   if(b.width>6)prop('town-window',b.x+b.width-3,b.y-.15,1.3,.9);
  }
  if(!isVillageUpper(region)){
   prop('town-armor',26,5,1,2,1,1);
   prop('town-bookshelf',27,12,1,2,1,1);prop('town-chair',20,20,1,1,1,1);
   prop('town-well',20,8,1.5,2,1,1);prop('elderwood-bench',6,6,2,1,2,1);
  }
  prop(isVillageUpper(region)?'town-stairs-down':'town-stairs-up',10.5,4.5,2,2);
  prop(isVillageUpper(region)?'town-stairs-down':'town-stairs-up',23.5,18.5,2,2);
 }else if(region==='woods'){
  for(const [x,y]of [[7,5],[51,5],[7,32],[51,32]])rect(x,y,11,9,0);
  path([[10,8],[22,8],[27,10],[34,8],[43,8],[48,10],[57,8],[57,36],[34,36],[10,36],[10,8]]);path([[34,8],[34,40]]);path([[10,23],[22,23],[27,25],[34,24],[42,23],[57,23]]);
  // Keep every approach encounter on the trail as its bends follow the forest.
  for(const area of Object.values(woodsGridEncounters))for(const [x,y]of area.approach)rect(x,y,1,1,1);
  // Quiet fishing pools off the main trail; banks never cut the encounter routes.
  rect(21,14,5,3,3);rect(22,13,3,1,3);rect(22,17,3,1,3);
  rect(43,27,4,3,3);rect(44,26,2,1,3);rect(44,30,2,1,3);
  path([[24,23],[24,20],[26,18]]);path([[40,23],[40,28],[41,31],[44,32]]);
  rect(30,21,9,10,2);rect(1,20,8,3,3);rect(1,21,8,1,4);rect(60,20,7,3,3);rect(60,21,7,1,4);
  // Enclosed boss grove with one clearly marked south entrance.
  rect(49,30,14,1,5);rect(49,30,1,12,5);rect(62,30,1,12,5);rect(49,41,6,1,5);rect(58,41,5,1,5);path([[56,41],[56,36]]);path([[34,36],[34,43],[56,43],[56,41]]);
  prop('woods-portal',33,22.5,3,3);prop('caverns-stairs-down',33,11,3,2);
  for(let gy=2;gy<44;gy+=3)for(let gx=2;gx<64;gx+=3){
   // Stable one-cell offsets break up planted rows without moving encounter clearings.
   const hash=(Math.imul(gx,73856093)^Math.imul(gy,19349663))>>>0,x=gx+(hash%2),y=gy+((hash>>>3)%2);
   const inClearing=(x>=5&&x<=19&&(y<=15||y>=29))||(x>=49&&(y<=15||y>=27))||(x>=29&&x<=40&&y>=19&&y<=32);
   const trunkY=y+2,nearRoad=[-1,0,1].some(dx=>[-1,0,1].some(dy=>[1,2,4].includes(cells[trunkY+dy]?.[x+dx])));
   if(inClearing||nearRoad||cells[trunkY][x]!==0)continue;prop((x+y)%2?'woods-oak':'woods-pine',x,y,2,3,1,1);
  }
  prop('woods-den',7,3,3,2);
  for(const [key,x,y]of [['woods-log',20,15],['woods-stump',26,16],['woods-flowers',24,19],['woods-mushrooms',42,29],['woods-boulder',46,31],['woods-ruin',37,17],['woods-fern',28,18]] as const)prop(key,x,y,key==='woods-flowers'||key==='woods-mushrooms'||key==='woods-fern'?1:2, key==='woods-ruin'?2:1);
  for(const [x,y]of [[7,33],[15,34],[7,38]])prop('woods-web',x,y,2,2);
  // Small habitat details keep the huntable clearings open and visually distinct.
  for(const [key,x,y]of [['woods-boulder',5,5],['woods-log',17,13],['woods-fern',6,14],['woods-mushrooms',15,30],['woods-fern',5,35],['woods-bones',18,39],['woods-boulder',53,4],['woods-stump',60,15],['woods-ancient',59,32],['woods-bones',51,38]] as const)prop(key,x,y,key==='woods-ancient'?3:key==='woods-fern'||key==='woods-mushrooms'?1:2,key==='woods-ancient'?4:1);
  for(const [x,y]of [[31,7],[36,22],[31,35],[54,41]])prop('woods-lamp',x,y,.6,1.5);
 }else if(cave||lower){
  // Cell-authored chambers and orthogonal corridors, independent of reference images.
  const rooms=lower?[[20,28,9,6],[4,21,11,8],[32,18,11,10],[6,4,12,9],[32,3,11,9]]:[[26,36,13,9],[5,26,14,10],[43,25,15,11],[6,5,15,13],[41,3,17,14]];
  for(const [x,y,w,h]of rooms){
   rect(x,y,w,h,0);
   if(cave){
    // Uneven rock shoulders, with broad clear floors for grid combat.
    rect(x-1,y+3,1,3,0);rect(x+w,y+h-5,1,3,0);
    for(const [cx,cy]of [[x,y],[x+w-1,y],[x,y+h-1],[x+w-1,y+h-1]])rect(cx,cy,1,1,5);
   }
  }
  const route:readonly (readonly[number,number])[]=lower?[[24,31],[24,24],[9,24],[9,8],[37,8],[37,23],[24,23]]:[[32,40],[32,31],[12,31],[12,11],[32,11],[32,31],[50,31],[50,10]];
  path(route,cave?2:1);if(lower)path([[24,31],[24,8]],cave?2:1);if(!lower)path([[32,11],[32,22],[50,22],[50,31]],2);
  if(cave){
   if(lower){rect(18,3,8,3,0);path([[24,8],[24,5]],2);rect(19,3,3,2,3);}
   else{rect(22,5,7,6,0);path([[20,11],[25,11],[27,9]],2);rect(23,6,3,3,3);}
   // Recessed crystal and mining details sit beside, rather than across, the routes.
   const details=lower?[['caverns-geode',17,4,2,2],['caverns-ore-vein',40,24,2,2],['caverns-old-crate',5,26,1,1],['caverns-mushroom-luminous',33,10,2,1]] as const:[['caverns-geode',27,5,2,2],['caverns-mine-cart',28,42,2,1.5],['caverns-old-crate',36,42,1,1],['caverns-rune-obelisk',55,5,1.5,2],['caverns-bones',54,13,2,1]] as const;
   for(const [key,x,y,w,h]of details)prop(key,x,y,w,h);
  }
  const bx=lower?24:32,by=lower?21:28;rect(bx-3,by,7,2,3);rect(bx,by-1,1,4,4);
  if(lower){prop('caverns-stairs-up',23,28,3,3);}else{prop('elderwood-portal',31,37.5,3,3);prop('caverns-stairs-down',31,21,3,2);}
  for(const [x,y,w,h]of rooms){if(cave){prop('caverns-crystal-violet',x,y,2,2);prop('caverns-crystal-teal',x+w-2,y+h-2,2,2);prop('caverns-lantern-blue',x+w-1,y+1,.6,1.5);}else{prop('woods-stump',x,y,2,2);prop('woods-mushrooms',x+w-2,y+h-2,1,1);prop('woods-lamp',x+w-1,y+1,.6,1.5);}}
  if(!cave){for(const [x,y]of [[6,4],[14,9],[9,11]])prop('woods-web',x,y,2,2);prop('woods-den',4,20,3,2);prop('woods-ruin',40,3,1,2);}
 }else{path([[4,12],[27,12]]);path([[16,4],[16,20]]);rect(4,4,5,5,3);rect(23,16,5,5,3);prop('elderwood-portal',15,10.5,3,3);}
 const override=(overrides.maps as Record<string,{cells?:number[][]}>)[region];
 if(override?.cells){if(override.cells.length!==height||override.cells.some(row=>row.length!==width||row.some(n=>!Number.isInteger(n)||n<0||n>5)))throw Error(`Invalid grid terrain override: ${region}`);for(let y=0;y<height;y++)cells[y]=[...override.cells[y]];}
 for(let x=0;x<width;x++){cells[0][x]=5;cells[height-1][x]=5;}for(let y=0;y<height;y++){cells[y][0]=5;cells[y][width-1]=5;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(cells[y][x]===3||cells[y][x]===5)blocked.add(`${x},${y}`);
 const result={width,height,cells,objects,blocked,edges};cache.set(region,result);return result;
}
export function gridBlocked(region:string,x:number,y:number){const map=gridMap(region);return x<0||y<0||x>=map.width||y>=map.height||map.blocked.has(`${Math.floor(x)},${Math.floor(y)}`);}
type GridMonster='wolf'|'spider'|'boar'|'bear'|'bat'|'crawler'|'golem'|'wyrm';
export function gridSpawns(region:RegionId):{id:string;kind:GridMonster;region:RegionId;x:number;y:number}[]{
 if(region==='woods')return (Object.entries(woodsGridEncounters) as [keyof typeof woodsGridEncounters,typeof woodsGridEncounters[keyof typeof woodsGridEncounters]][]).flatMap(([kind,area])=>[...area.habitat,...area.approach].map(([x,y],i)=>({id:`${kind}-${i+1}`,kind,region,x:x+.5,y:y+.5})));
 const woods=region.startsWith('woods'),lower=region.endsWith('-depths');
 const groups:[GridMonster,number,number,number][]=woods?(lower?[['wolf',5,23,6],['spider',7,5,6],['boar',33,20,6]]:[['wolf',8,6,9],['spider',8,33,9],['boar',52,6,9],['bear',55,35,1]]):(lower?[['bat',5,23,6],['crawler',7,5,6],['golem',33,20,5]]:[['bat',7,7,9],['crawler',7,28,9],['golem',45,27,9],['wyrm',48,8,1]]);
 const result=groups.flatMap(([kind,x,y,count])=>Array.from({length:count},(_,i)=>({id:`${lower?woods?'roots-':'depths-':''}${kind}-${i+1}`,kind,region,x:x+(i%3)*3+.5,y:y+Math.floor(i/3)*3+.5})));
 if(lower&&woods)result.push({id:'roots-shrine-spider',kind:'spider',region,x:37.5,y:6.5});
 if(lower&&!woods){const vault=result.at(-1)!;vault.x=37.5;vault.y=6.5;}
 return result;
}

/** Trace grid-boundary crossings. At a diagonal join both orthogonal routes must be clear. */
export function gridCrossesWall(region:string,from:{x:number;y:number},to:{x:number;y:number}):boolean{
 const {edges}=gridMap(region);if(!edges.size)return false;
 let x=Math.floor(from.x),y=Math.floor(from.y);const endX=Math.floor(to.x),endY=Math.floor(to.y),dx=to.x-from.x,dy=to.y-from.y,sx=Math.sign(dx),sy=Math.sign(dy);
 const blocked=(ax:number,ay:number,bx:number,by:number)=>edges.has(ax===bx?`h:${ax},${Math.max(ay,by)}`:`v:${Math.max(ax,bx)},${ay}`);
 const deltaX=dx?1/Math.abs(dx):Infinity,deltaY=dy?1/Math.abs(dy):Infinity;
 let tx=dx?((sx>0?x+1:x)-from.x)/dx:Infinity,ty=dy?((sy>0?y+1:y)-from.y)/dy:Infinity;
 const limit=Math.abs(endX-x)+Math.abs(endY-y)+2;
 for(let i=0;i<limit&&(x!==endX||y!==endY);i++){
  if(Math.abs(tx-ty)<1e-10){if(blocked(x,y,x+sx,y)||blocked(x,y,x,y+sy)||blocked(x+sx,y,x+sx,y+sy)||blocked(x,y+sy,x+sx,y+sy))return true;x+=sx;y+=sy;tx+=deltaX;ty+=deltaY;}
  else if(tx<ty){if(blocked(x,y,x+sx,y))return true;x+=sx;tx+=deltaX;}
  else{if(blocked(x,y,x,y+sy))return true;y+=sy;ty+=deltaY;}
 }return false;
}
