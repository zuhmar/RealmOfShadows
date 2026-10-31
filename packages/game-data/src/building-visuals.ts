import {selectWindowPanels,type WindowAnchor} from './building-windows';
import {connectedFenceVisuals,isMapFence} from './fences';
import {housingVisuals} from './housing-visuals';
import nativeSizes from './map-prop-sizes.json';
import {modularFurniture} from './map-furniture';
import {buildingsFor,type villageBuildings,isBuildingFloor} from './village-buildings';
import {mapObject,type IslandObject} from './island-layout';
/** Shared elevated view: grid axes stay square; vertical faces are foreshortened. */
export const townView={wallHeight:1.25,roofOverhang:.1875,wallThickness:.1875} as const;
export const townDoorTexture=(width:number,open:boolean)=>`house-door-${width}-${open?'open':'closed'}`;
/** Door panels share the shell coordinate system and sort below mounted signs. */
export function townDoorVisual(door:{x:number;y:number;width:number},open:boolean):IslandObject{
 return {...mapObject(townDoorTexture(door.width,open),(door.x-door.width/2)*48,(door.y+.5-townView.wallHeight)*48,door.width*48,townView.wallHeight*48),footY:(door.y+.5+1/32)*48};
}
export interface BuildingVisual extends IslandObject{windowAt?:WindowAnchor;houseFor?:string;houseWallSide?:string;houseDoor?:string;houseUpper?:boolean;houseRoof?:boolean;roofFor?:string;wallFor?:string;wallSide?:string;signFor?:string;upperFor?:string;sourceKey?:string;roofPart?:'tile'|'ridge'|'chimney'}
export function insideBuilding(p:{x:number;y:number},b:typeof villageBuildings[number]){return p.x>b.x&&p.x<b.x+b.width&&p.y>b.y&&p.y<b.y+b.height;}
export function buildingVisuals(region:string,objects:readonly IslandObject[],roofs=true):BuildingVisual[]{
 const buildings=buildingsFor(region),result:BuildingVisual[]=[],height=townView.wallHeight;
 const put=(key:string,x:number,y:number,w:number,h:number,footY:number,meta:Partial<BuildingVisual>={})=>result.push({...mapObject(key,x*48,y*48,w*48,h*48),footY:footY*48,...meta});
 for(const object of objects){
  if(isMapFence(object.key))continue;
  if(buildings.length&&(/^(depot|village)-wall-/.test(object.key)||object.key==='town-window'))continue;
  const pieces=modularFurniture(object);if(pieces){result.push(...pieces);continue;}
  const copy:BuildingVisual={...object};
  const native=(nativeSizes as Record<string,readonly number[]>)[object.key];
  if(native&&!isBuildingFloor(object.key)){
   // Runtime props have square padded canvases; keep the original artwork scale and baseline.
   const scale=Math.min(object.w/native[0],object.h/native[1]),w=Math.max(native[0],native[1])*scale,h=w;
   const center=object.footprint?(object.footprint.x+object.footprint.width/2)*48:object.x+object.w/2;
   copy.x=center-w/2;copy.y=object.y+object.h-h;copy.w=w;copy.h=h;
  }
  if(object.key==='furn-tools-down')copy.y-=48;
  const sign=buildings.find(b=>object.key===(b.id==='depot'?'depot-sign':b.id==='workshop'?'crafting-hall-sign':`village-sign-${b.id}`));
  if(sign){copy.x=(sign.x+(sign.width-3)/2)*48;copy.y=(sign.y+sign.height-1.9)*48;copy.w=3*48;copy.h=.9*48;copy.footY=(sign.y+sign.height+.12)*48;copy.signFor=sign.id;}
  if(isBuildingFloor(copy.key))copy.footY=-480;
  result.push(copy);
 }
 for(const b of buildings){
  const bottom=b.y+b.height,twoStories=b.id==='depot'||b.id==='hall';
  const stories=region==='elderwood'&&twoStories&&roofs?2:1;
  for(let story=0;story<stories;story++){
   const lift=story*height,meta={wallFor:b.id,...(story?{upperFor:b.id}:{})};
   const door=(x:number)=>region==='elderwood'&&story===0&&x>=b.x+b.door&&x<b.x+b.door+b.doorWidth;
   // Every panel has the same native pixels per cell and a 12px cap.
   for(const side of ['n','s'] as const){
    const panels=Array.from({length:b.width-2},(_,i)=>b.x+1+i).filter(x=>side!=='s'||!door(x));
    const windows=selectWindowPanels(panels,twoStories?2:undefined);
    for(const x of panels){const base=(side==='n'?b.y:bottom)-lift,isWindow=windows.has(x);
     put(`house-wall-${side}-half${isWindow?'-window':''}`,x,base-height,1,height,base+lift,{...meta,wallSide:side,...(isWindow&&!story?{windowAt:{x:x+.5,y:side==='n'?b.y:bottom,side,building:b.id,kind:'village' as const,region}}:{})});
    }
   }
   // Side caps use the same sparse window budget and retain the original wall thickness.
   const start=b.y-height-lift+townView.wallThickness,end=bottom-height-lift;
   const sideWindows=selectWindowPanels(Array.from({length:Math.max(0,b.height-2)},(_,i)=>i+1),twoStories?2:undefined);
   for(let y=start,i=0;y<end-1e-6;y++,i++){
    const length=Math.min(1,end-y),isWindow=sideWindows.has(i)&&length===1;
    for(const side of ['w','e'] as const)put(`house-wall-${side}${isWindow?'-window':''}`,side==='w'?b.x:b.x+b.width-1,y,1,length,y+height+lift,{...meta,wallSide:side,...(isWindow&&!story?{windowAt:{x:side==='w'?b.x:b.x+b.width,y:b.y+i+.5,side,building:b.id,kind:'village' as const,region}}:{})});
   }
   for(const [side,x,base]of [['nw',b.x,b.y],['ne',b.x+b.width-1,b.y],['sw',b.x,bottom],['se',b.x+b.width-1,bottom]] as const)
    put(`house-wall-${side}`,x,base-height-lift,1,height,base+.01,{...meta,wallSide:side});
  }
  if(roofs){
   const top=b.y-stories*height,pad=townView.roofOverhang;
   // Each 64px core covers one cell. Transparent gutters carry only outer eaves.
   for(let row=0;row<b.height;row++)for(let col=0;col<b.width;col++){
    const slope=row+1<=b.height/2?'back':row>=b.height/2?'front':'join';
    const edge=(row===0?'n':row===b.height-1?'s':'')+(col===0?'w':col===b.width-1?'e':'')||'field';
    put(`roof-tile-${b.id}-${slope}-${edge}`,b.x+col-pad,top+row-pad,1+pad*2,1+pad*2,bottom+.05,{roofFor:b.id,roofPart:'tile'});
   }
   for(let col=0;col<b.width;col++)put(`roof-ridge-${b.id}-${col===0?'w':col===b.width-1?'e':'field'}`,b.x+col-pad,top+b.height/2-pad,1+pad*2,.375,bottom+.06,{roofFor:b.id,roofPart:'ridge'});
   put('roof-chimney',b.x+b.width-1.6,top+.15,1,1.5,bottom+.07,{roofFor:b.id,roofPart:'chimney'});
  }
 }
 result.push(...connectedFenceVisuals(objects));result.push(...housingVisuals(region,roofs));return result;
}
