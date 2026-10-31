import {selectWindowPanels,type WindowAnchor,type WindowSide} from './building-windows';
import {onElderwoodRim,elderwoodTown} from './elderwood-layout';
import {houseCells,houseFloorIndex,playerHouses} from './housing';
import {mapObject} from './island-layout';
import type {BuildingVisual} from './building-visuals';
/** One-cell panels follow the exact union boundary, including recessed wings. */
export function housingVisuals(region:string,roofs=true):BuildingVisual[]{
 const floor=houseFloorIndex(region);if(floor<0)return[];const out:BuildingVisual[]=[],height=1.25,pad=.1875;
 const put=(key:string,x:number,y:number,w:number,h:number,footY:number,id:string,upper=false,roof=false,windowAt?:WindowAnchor)=>out.push({...mapObject(key,x*48,y*48,w*48,h*48),footY:footY*48,houseFor:id,houseWallSide:key.startsWith('house-wall-')?key.split('-')[2]:undefined,houseUpper:upper,houseRoof:roof,...(windowAt?{windowAt}:{})});
 for(const h of playerHouses){
  for(let level=floor;level<h.floors.length;level++){
   if(level>floor&&!roofs)break;const cells=houseCells(h,level),above=houseCells(h,level+1),lift=(level-floor)*height,upper=level>floor;
   const candidates:Record<WindowSide,string[]>={n:[],s:[],w:[],e:[]};
   for(const key of cells){const[x,y]=key.split(',').map(Number);for(const[side,dx,dy]of [['n',0,-1],['s',0,1],['w',-1,0],['e',1,0]] as const)if(!cells.has(`${x+dx},${y+dy}`)&&!(side==='s'&&level===0&&x===Math.floor(h.door.x)&&y===Math.floor(h.door.y)))candidates[side].push(key);}
   const windows={} as Record<WindowSide,Set<string>>;
   for(const side of ['n','s','w','e'] as const){candidates[side].sort((a,b)=>{const p=a.split(',').map(Number),q=b.split(',').map(Number);return side==='n'||side==='s'?p[0]-q[0]||p[1]-q[1]:p[1]-q[1]||p[0]-q[0]});windows[side]=selectWindowPanels(candidates[side],h.floors.length===1?undefined:h.floors.length===2?2:level===0?2:1);}
   for(const key of cells){const[x,y]=key.split(',').map(Number),has=(dx:number,dy:number)=>cells.has(`${x+dx},${y+dy}`);
    if(!upper)put('town-floor-stone',x,y,1,1,-10,h.id);
    const anchor=(side:WindowSide):WindowAnchor|undefined=>!upper&&windows[side].has(key)?{x:x+(side==='e'?1:side==='w'?0:.5),y:y+(side==='s'?1:side==='n'?0:.5),side,building:h.id,kind:'house',region}:undefined;
    if(!has(0,-1))put(`house-wall-n-half${windows.n.has(key)?'-window':''}`,x,y-height-lift,1,height,y,h.id,upper,false,anchor('n'));
    if(!has(0,1)&&!(level===0&&x===Math.floor(h.door.x)&&y===Math.floor(h.door.y)))put(`house-wall-s-half${windows.s.has(key)?'-window':''}`,x,y+1-height-lift,1,height,y+1,h.id,upper,false,anchor('s'));
    if(!has(-1,0))put(`house-wall-w${windows.w.has(key)?'-window':''}`,x,y-height-lift+.1875,1,1,y+1,h.id,upper,false,anchor('w'));
    if(!has(1,0))put(`house-wall-e${windows.e.has(key)?'-window':''}`,x,y-height-lift+.1875,1,1,y+1,h.id,upper,false,anchor('e'));
    if(roofs&&!above.has(key)){
     const n=!has(0,-1),s=!has(0,1),w=!has(-1,0),e=!has(1,0),mid=(Math.min(...[...cells].map(k=>Number(k.split(',')[1])))+Math.max(...[...cells].map(k=>Number(k.split(',')[1]))))/2,slope=n?'back':s?'front':y<mid?'back':'front',edge=(n?'n':s?'s':'')+(w?'w':e?'e':'')||'field';
     put(`roof-tile-${h.roof}-${slope}-${edge}`,x-pad,y-height-lift-pad,1+pad*2,1+pad*2,Math.max(...[...cells].map(k=>Number(k.split(',')[1])))+1.05,h.id,upper,true);
    }
   }
  }
  if(floor===0)out.push({...mapObject('house-door-1-closed',(h.door.x-.5)*48,(h.door.y+.5-height)*48,48,height*48),footY:(h.door.y+.5+1/32)*48,houseFor:h.id,houseDoor:h.id});
 }
 return out;
}

/** Only outdoor cliff dressing is projected below; the original town stays untouched. */
export function outsideVillageCenter(o:{x:number;y:number;w:number;footY:number}){const x=(o.x+o.w/2)/48,y=o.footY/48,t=elderwoodTown;return onElderwoodRim(Math.floor(x),Math.floor(y))||x<t.x||x>=t.x+t.width||y<t.y||y>=t.y+t.height;}
