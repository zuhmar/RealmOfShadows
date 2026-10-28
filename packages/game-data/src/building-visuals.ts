import {buildingsFor,type villageBuildings,isBuildingFloor} from './village-buildings';
import {mapObject,type IslandObject} from './island-layout';
export interface BuildingVisual extends IslandObject{roofFor?:string;wallFor?:string;wallSide?:string;signFor?:string}
export function insideBuilding(p:{x:number;y:number},b:typeof villageBuildings[number]){return p.x>b.x&&p.x<b.x+b.width&&p.y>b.y&&p.y<b.y+b.height;}
/** Full-height artwork is projected above the same authoritative boundary edges. */
export function buildingVisuals(region:string,objects:readonly IslandObject[],roofs=true):BuildingVisual[]{
 const buildings=buildingsFor(region),result:BuildingVisual[]=[];
 const put=(key:string,x:number,y:number,w:number,h:number,footY:number,meta:Partial<BuildingVisual>={})=>result.push({...mapObject(key,x*48,y*48,w*48,h*48),footY:footY*48,...meta});
 for(const object of objects){
  if(buildings.length&&/^(depot|village)-wall-/.test(object.key))continue;
  const copy:BuildingVisual={...object};
  if(object.key==='town-window'||object.key==='furn-tools-down')copy.y-=48;
  const sign=buildings.find(b=>object.key===(b.id==='depot'?'depot-sign':`village-sign-${b.id}`));
  if(sign){copy.x=(sign.x+(sign.width-3)/2)*48;copy.y=(sign.y+sign.height-2.25)*48;copy.w=3*48;copy.h=1.1*48;copy.footY=(sign.y+sign.height+.12)*48;copy.signFor=sign.id;}
  if(isBuildingFloor(copy.key))copy.footY=-480;
  result.push(copy);
 }
 for(const b of buildings){
  const bottom=b.y+b.height,door=(x:number)=>region==='elderwood'&&x>=b.x+b.door&&x<b.x+b.door+b.doorWidth;
  for(let x=b.x+1;x<b.x+b.width-1;x++){
   put('house-wall-n',x,b.y-1.5,1,1.5,b.y,{wallFor:b.id,wallSide:'n'});
   if(!door(x))put('house-wall-s',x,bottom-1.5,1,1.5,bottom,{wallFor:b.id,wallSide:'s'});
  }
  for(let y=b.y;y<bottom;y++){
   put('house-wall-w',b.x,y-.5,1,1.5,y+1,{wallFor:b.id,wallSide:'w'});
   put('house-wall-e',b.x+b.width-1,y-.5,1,1.5,y+1,{wallFor:b.id,wallSide:'e'});
  }
  for(const [side,x,y,base]of [['nw',b.x,b.y-1.5,b.y],['ne',b.x+b.width-1,b.y-1.5,b.y],['sw',b.x,bottom-1.5,bottom],['se',b.x+b.width-1,bottom-1.5,bottom]] as const)put(`house-wall-${side}`,x,y,1,1.5,base+.01,{wallFor:b.id,wallSide:side});
  // Front windows sit on full wall faces beside the open doorway.
  put('town-window',b.x+.25,bottom-1.25,1,.8,bottom+.02,{wallFor:b.id,wallSide:'s'});
  if(roofs)put(`house-roof-${b.id}`,b.x-.3,b.y-1.5,b.width+.6,b.height+.05,bottom+.05,{roofFor:b.id});
 }
 return result;
}
