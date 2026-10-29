import {woodsCliffs} from './woods-cliffs';
import {woodsLedge} from './elevation';
import {craftingStations} from './town-services';
import {villageBuildings,buildingsFor,isVillageUpper} from './village-buildings';
import {woodsGridEncounters} from './woods-grid-spawns';
import {depotBoxes} from './depot';
import overrides from './grid-overrides.json';
import type {RegionId} from './index';
import {mapObject,type IslandObject} from './island-layout';
export interface GridMap{width:number;height:number;cells:number[][];objects:IslandObject[];blocked:Set<string>;propBlocked:Set<string>;edges:Set<string>}
export const gridDirections=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]] as const;
const cache=new Map<string,GridMap>();
export const gridCell=(p:{x:number;y:number})=>({x:Math.floor(p.x)+.5,y:Math.floor(p.y)+.5});
export const gridKey=(p:{x:number;y:number})=>`${Math.floor(p.x)},${Math.floor(p.y)}`;
export function gridMap(region:string):GridMap{
 const old=cache.get(region);if(old)return old;
 const lower=region.endsWith('-depths'),village=region==='elderwood'||isVillageUpper(region),cave=region.startsWith('caverns');
 const width=lower?48:(region==='woods'||region==='woods-upper')?68:region==='caverns'?64:32,height=lower?36:region==='woods'||region==='woods-upper'||region==='caverns'?48:24;
 const cells=Array.from({length:height},()=>Array<number>(width).fill(cave||lower||isVillageUpper(region)?5:0)),objects:IslandObject[]=[],blocked=new Set<string>(),edges=new Set<string>();
 const rect=(x:number,y:number,w:number,h:number,material:number)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(j>=0&&i>=0&&j<height&&i<width)cells[j][i]=material;};
 const path=(points:readonly (readonly [number,number])[],material=1)=>{for(let i=1;i<points.length;i++){let [x,y]=points[i-1];const [tx,ty]=points[i];rect(x-1,y-1,3,3,material);while(x!==tx||y!==ty){x+=Math.sign(tx-x);y+=Math.sign(ty-y);rect(x-1,y-1,3,3,material);}}};
 const dressingSeed=(x:number,y:number)=>{let n=(Math.imul(x,73856093)^Math.imul(y,19349663))>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);return(n^(n>>>15))>>>0;};
 const prop=(key:string,x:number,y:number,w:number,h:number,solidW=0,solidH=0,solidOffsetX=0)=>{
  if(village){
   const names:Record<string,string>={'depot-box':'chest-down','village-forge':'forge-down','village-workbench':'workbench-down','village-counter':'counter-down','village-table':'meeting-down','town-bookshelf':x===27?'bookshelf-left':'bookshelf-down','town-bed':'bed-down','town-table':'table-left','town-armor':'armor-left','town-tools':'tools-down','town-chair':'chair-right','town-well':'well-down','elderwood-bench':'bench-down','elderwood-planter':'planter-down','elderwood-barrel':x===26?'barrel-up':'barrel-down','town-stairs-up':'stairsup-down','town-stairs-down':'stairsdown-down'};
   if(names[key]){if(key==='elderwood-bench'){y+=h-2;h=2;}if(key==='elderwood-planter'){y+=h-1;h=1;}key=`furn-${names[key]}`;}
  }
  const object=mapObject(key,x*48,y*48,w*48,h*48);
  if(solidW&&solidH){object.footprint={x:x+solidOffsetX,y:y+h-solidH,width:solidW,height:solidH};if(village)object.footY=(object.footprint.y+solidH-.5)*48;}
  objects.push(object);for(let dy=0;dy<solidH;dy++)for(let dx=0;dx<solidW;dx++)blocked.add(`${x+solidOffsetX+dx},${y+h-solidH+dy}`);};
 if(region==='woods-upper'){
  rect(0,0,width,height,5);rect(woodsLedge.x,woodsLedge.y,woodsLedge.width,woodsLedge.height,0);rect(40,4,1,3,2);
  prop('woods-flowers',37,3,1,1);prop('woods-stump',42,3,1,1);
 }else if(village){
  if(!isVillageUpper(region)){
  rect(1,1,30,22,0);
  // A main street with service lanes, forecourts and deliberate garden gaps.
  rect(15,1,3,18,2);rect(8,9,20,2,1);rect(13,8,6,3,2);
  rect(18,8,8,2,2);rect(24,8,2,2,2);rect(8,8,3,3,2);
  rect(18,16,9,2,1);rect(25,16,2,3,2);rect(27,16,1,7,1);
  rect(17,22,11,1,1);rect(22,21,3,2,2);
  // Pond banks and the central timber crossing keep their existing water cells.
  rect(1,19,30,4,3);rect(19,17,10,6,0);rect(19,22,9,1,1);rect(27,17,1,6,1);
  rect(1,19,12,4,0);rect(2,20,11,3,3);rect(4,19,6,1,3);rect(1,21,1,2,3);rect(12,21,2,2,3);
  rect(14,19,5,4,3);rect(15,19,3,4,4);
  rect(18,18,7,1,1);rect(18,19,1,4,1);rect(17,22,7,1,1);
  rect(15,19,3,4,4); // Keep the timber crossing continuous to the south bank.
  rect(19,3,2,3,1); // Walled flower beds, reached through the southern gate.
  rect(28,9,3,3,1); // Smithy's delivery yard, off the front-door route.
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
  for(const [x,y]of [[2,2],[2,5],[28,1],[28,7]])prop('elderwood-oak',x,y,3,3,1,1,1);
  for(const [x,y]of [[2,7],[29,11],[1,9],[29,18]])prop('elderwood-oak',x,y,3,3,1,1,1);
  prop('elderwood-bench',19,14,2,1,2,1);prop('elderwood-planter',19,13,1,1,1,1);
  prop('woods-flowers',12,18,1,.6);prop('woods-flowers',20,10,1,.6);
  for(const x of [13,19])for(const y of [8,17])prop('elderwood-lamp',x,y,1,2,1,1);
  // A fenced public garden, workshop supplies and a pond-side flower walk.
  prop('elderwood-fence-h',18,2,4,1,4,1);
  for(const x of [18,21])for(const y of [3,5])prop('elderwood-fence-v',x,y,1,2,1,2);
  for(const x of [18,21])prop('elderwood-fence-h',x,7,1,1,1,1);
  for(const [x,y]of [[19,3],[20,4],[19,5]])prop('woods-flowers',x,y,1,1);
  prop('furn-bench-up',20,6,1,1,1,1);
  prop('furn-chest-left',28,10,1,1,1,1);prop('furn-chest-up',29,10,1,1,1,1);prop('furn-barrel-down',30,10,1,1,1,1);
  prop('caverns-old-crate',28,11,1,1,1,1);
  for(const [x,y]of [[2,18],[4,18],[10,18],[11,19],[20,18],[26,18]])prop('woods-flowers',x,y,1,1);
  prop('furn-planter-down',12,2,1,1,1,1);prop('furn-barrel-down',23,3,1,1,1,1);
  }else{
   prop('town-bookshelf',6,2,2,2,2,1);prop('town-bed',6,5,2,2,2,2);prop('town-table',9,3,2,2,2,1);
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
   prop('town-well',20,8,2,2,2,1);prop('elderwood-bench',6,6,2,1,2,1);
  }
  prop(isVillageUpper(region)?'town-stairs-down':'town-stairs-up',10.5,4.5,2,2);
  prop(isVillageUpper(region)?'town-stairs-down':'town-stairs-up',23.5,18.5,2,2);
 }else if(region==='woods'){
  for(const [x,y]of [[7,5],[51,5],[7,32],[51,32]])rect(x,y,11,9,0);
  path([[10,8],[22,8],[27,10],[34,8],[43,8],[48,10],[57,8],[55,14],[57,18],[57,22],[59,28],[57,36],[48,38],[40,36],[34,36],[26,36],[20,38],[10,36],[8,32],[10,28],[10,25],[10,20],[12,14],[10,8]]);path([[34,8],[34,13],[32,18],[34,24],[34,30],[36,33],[34,40]]);path([[10,23],[22,23],[27,25],[34,24],[42,23],[57,23]]);
  path([[26,36],[23,35]]);
  // Keep every approach encounter on the trail as its bends follow the forest.
  for(const area of Object.values(woodsGridEncounters))for(const [x,y]of area.approach)rect(x,y,1,1,1);
  // Quiet fishing pools off the main trail; banks never cut the encounter routes.
  rect(21,14,5,3,3);rect(22,13,3,1,3);rect(22,17,3,1,3);
  rect(43,27,4,3,3);rect(44,26,2,1,3);rect(44,30,2,1,3);
  path([[24,23],[24,20],[26,18]]);path([[40,23],[40,28],[41,31],[44,32]]);
  rect(30,21,9,10,2);rect(1,20,8,3,3);rect(1,21,8,1,4);rect(60,20,7,3,3);rect(60,21,7,1,4);rect(58,21,2,1,1);
  // Enclosed boss grove with one clearly marked south entrance.
  rect(49,30,14,1,5);rect(49,30,1,12,5);rect(62,30,1,12,5);rect(49,41,6,1,5);rect(58,41,5,1,5);path([[56,41],[56,36]]);path([[34,36],[34,43],[56,43],[56,41]]);
  prop('woods-portal',33,22.5,3,3);prop('caverns-stairs-down',33,11,3,2);
  path([[35,10],[40,10],[45,8]]);
  rect(woodsLedge.x,woodsLedge.y,woodsLedge.width,woodsLedge.height+woodsLedge.faceHeight,5);
  for(const cliff of woodsCliffs)rect(cliff.x,cliff.y,cliff.size,cliff.size,5);
  const originalTrail=new Set<string>();for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)if([1,2,4].includes(cells[y][x]))originalTrail.add(`${x},${y}`);
  const protectedSpawns=new Set(gridSpawns('woods').map(p=>`${Math.floor(p.x)},${Math.floor(p.y)}`));
  const seed=dressingSeed;
  // Read an immutable copy so shoulder weathering never erodes a trail's center.
  const unweathered=cells.map(row=>[...row]);
  for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++)if(unweathered[y][x]===1&&!protectedSpawns.has(`${x},${y}`)&&seed(Math.floor(x/4),Math.floor(y/4))%4===0&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>unweathered[y+dy][x+dx]===0).length>=1&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>unweathered[y+dy][x+dx]===1).length>=2)cells[y][x]=0;
  const treeSites:{x:number;y:number;seed:number}[]=[];
  for(let y=2;y<44;y++)for(let x=2;x<64;x++){
   const inClearing=(x>=5&&x<=19&&(y<=15||y>=29))||(x>=49&&(y<=15||y>=27))||(x>=29&&x<=40&&y>=19&&y<=32);
   const trunkY=y+2,nearRoad=[-1,0,1].some(dx=>[-1,0,1].some(dy=>originalTrail.has(`${x+dx},${trunkY+dy}`)));
   if(inClearing||nearRoad||cells[trunkY][x]!==0)continue;treeSites.push({x,y,seed:seed(x,y)});
  }
  const planted:{x:number;y:number}[]=[];
  for(const site of treeSites.sort((a,b)=>a.seed-b.seed)){
   if(planted.length>=140)break;if(planted.some(p=>Math.hypot(p.x-site.x,p.y-site.y)<2.4))continue;
   planted.push(site);prop(site.seed%3?'woods-oak':'woods-pine',site.x,site.y,2,3,1,1);
  }
  // Understory follows trail margins without blocking combat or gathering approaches.
  for(let y=3;y<44;y++)for(let x=3;x<64;x++)if(cells[y][x]===0&&seed(x,y)%29===0&&!blocked.has(`${x},${y}`)&&!gridSpawns('woods').some(p=>Math.hypot(p.x-x-.5,p.y-y-.5)<2)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>originalTrail.has(`${x+dx},${y+dy}`)))prop(seed(x,y)%2?'woods-fern':'woods-mushrooms',x,y,1,1);
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
  // Irregular chamber shoulders spare marked paths and monster spawn rings.
  const spawnSites=gridSpawns(region as RegionId);
  for(const [x,y,w,h]of rooms)for(let xx=x;xx<x+w;xx++)for(const yy of [y,y+h-1]){
   const notch=dressingSeed(Math.floor(xx/3),yy)%3===0;
   if(notch&&cells[yy][xx]===0&&spawnSites.every(p=>Math.hypot(p.x-xx-.5,p.y-yy-.5)>2))cells[yy][xx]=5;
  }
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
 const propBlocked=new Set(blocked);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(cells[y][x]===3||cells[y][x]===5)blocked.add(`${x},${y}`);
 const result={width,height,cells,objects,blocked,propBlocked,edges};cache.set(region,result);return result;
}
export function gridBlocked(region:string,x:number,y:number){const map=gridMap(region);return x<0||y<0||x>=map.width||y>=map.height||map.blocked.has(`${Math.floor(x)},${Math.floor(y)}`);}
type GridMonster='wolf'|'spider'|'boar'|'bear'|'bat'|'crawler'|'golem'|'wyrm';
export function gridSpawns(region:RegionId):{id:string;kind:GridMonster;region:RegionId;x:number;y:number}[]{
 if(region==='woods-upper')return [[38.5,4.5],[41.5,4.5],[38.5,6.5]].map(([x,y],i)=>({id:`ledge-wolf-${i+1}`,kind:'wolf' as const,region,x,y}));
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
