import {playerHouses,houseCells} from './housing';
import {fenceMask} from './fences';
import {mapObject,type IslandObject} from './island-layout';
export interface GardenPlot{x:number;y:number;w:number;h:number;gate:{x:number;y:number};kind:'yard'|'court'}
/** Small garden pockets vary by property; courts occupy the space inside the promenades. */
export const neighborhoodGardens:GardenPlot[]=[
 {x:35,y:25,w:10,h:4,gate:{x:39,y:25},kind:'court'},
 {x:58,y:70,w:10,h:6,gate:{x:58,y:73},kind:'court'},
 {x:24,y:38,w:5,h:8,gate:{x:24,y:42},kind:'court'},
 {x:76,y:54,w:4,h:8,gate:{x:79,y:58},kind:'court'},
 ...playerHouses.flatMap((h,i)=>i%3===1?[]:[{x:h.floors[0][0].x+9,y:h.floors[0][0].y+3,w:i%2?3:4,h:4,gate:{x:h.floors[0][0].x+10,y:h.floors[0][0].y+6},kind:'yard' as const}]),
];
export function dressNeighborhood(cells:number[][],objects:IslandObject[],blocked:Set<string>){
 const homes=new Set(playerHouses.flatMap(h=>[...houseCells(h,0)])),fences=new Set<string>();
 const prop=(key:string,x:number,y:number,w=1,h=1,solid=false)=>{const o=mapObject(key,x*48,y*48,w*48,h*48);o.footY=(y+h-.15)*48;if(solid){o.footprint={x:x+Math.floor(w/2),y:y+h-1,width:1,height:1};blocked.add(`${x+Math.floor(w/2)},${y+h-1}`);}objects.push(o);};
 const free=(x:number,y:number)=>cells[y]?.[x]===0&&!homes.has(`${x},${y}`)&&!blocked.has(`${x},${y}`);
 for(const g of neighborhoodGardens){let valid=true;for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++)if(!free(x,y))valid=false;if(!valid)continue;
  for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++)if((x===g.x||y===g.y||x===g.x+g.w-1||y===g.y+g.h-1)&&!(x===g.gate.x&&y===g.gate.y))fences.add(`${x},${y}`);
  if(g.kind==='court'){
   for(let y=g.y+1;y<g.y+g.h-1;y++)for(let x=g.x+1;x<g.x+g.w-1;x++)cells[y][x]=2;
   cells[g.gate.y][g.gate.x]=2;
   prop('woods-flowers',g.x+1,g.y+1);prop('woods-flowers',g.x+g.w-2,g.y+g.h-2);
   if(g.w>6)prop('furn-bench-up',g.x+3,g.y+1,1,1,true);else prop('woods-stump',g.x+1,g.y+2,1,1,true);
  }else{prop('woods-flowers',g.x+1,g.y+1);prop('woods-flowers',g.x+g.w-2,g.y+g.h-2);}
 }
 for(const key of fences){const[x,y]=key.split(',').map(Number);prop(`map-fence-${fenceMask(fences,x,y)}`,x,y,1,1,true);}
 for(const[x,y]of [[33,24],[23,36],[69,70],[80,52]])if(free(x,y)&&free(x,y+1))prop('elderwood-lamp',x,y,1,2,true);
 // Loose groves interrupt the big grass rectangles without forming another rigid wall.
 for(const[x,y]of [[28,17],[33,18],[55,18],[72,17],[24,29],[26,32],[24,60],[27,64],[77,35],[78,39],[76,67],[78,70],[34,73],[38,74],[73,74],[75,77]]){
  if(free(x,y)&&free(x+1,y+2)&&!fences.has(`${x+1},${y+2}`)){prop('elderwood-oak',x,y,3,3,true);prop('woods-flowers',x+2,y+3);}
 }
 for(const[x,y]of [[30,35],[30,56],[35,30],[65,30],[73,38],[73,59],[38,65],[66,65]])if(free(x,y))prop('woods-boulder',x,y);
 for(const h of playerHouses){const x=Math.floor(h.door.x),y=Math.floor(h.door.y)+1;for(const dx of [-2,2])if(free(x+dx,y))prop('woods-flowers',x+dx,y);}
 // Courtyard approaches follow small bends rather than cutting through the housing drives.
 for(const points of [[[39,22],[39,24],[39,25]],[[52,73],[57,73],[58,73]],[[22,42],[24,42]],[[79,58],[82,58]]])for(let i=1;i<points.length;i++){let[x,y]=points[i-1];const[tx,ty]=points[i];while(x!==tx||y!==ty){if(!fences.has(`${x},${y}`)&&!homes.has(`${x},${y}`)&&!blocked.has(`${x},${y}`))cells[y][x]=2;x+=Math.sign(tx-x);y+=Math.sign(ty-y);}}
}
