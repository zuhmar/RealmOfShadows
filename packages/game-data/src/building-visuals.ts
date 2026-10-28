import {buildingsFor,type villageBuildings,isBuildingFloor} from './village-buildings';
import {mapObject,type IslandObject} from './island-layout';
/** Shared elevated view: grid axes stay square; vertical faces are foreshortened. */
export const townView={wallHeight:1.25,roofOverhang:.25,wallThickness:.1875} as const;
export interface BuildingVisual extends IslandObject{roofFor?:string;wallFor?:string;wallSide?:string;signFor?:string;upperFor?:string}
export function insideBuilding(p:{x:number;y:number},b:typeof villageBuildings[number]){return p.x>b.x&&p.x<b.x+b.width&&p.y>b.y&&p.y<b.y+b.height;}
export function buildingVisuals(region:string,objects:readonly IslandObject[],roofs=true):BuildingVisual[]{
 const buildings=buildingsFor(region),result:BuildingVisual[]=[],height=townView.wallHeight;
 const put=(key:string,x:number,y:number,w:number,h:number,footY:number,meta:Partial<BuildingVisual>={})=>result.push({...mapObject(key,x*48,y*48,w*48,h*48),footY:footY*48,...meta});
 for(const object of objects){
  if(buildings.length&&/^(depot|village)-wall-/.test(object.key))continue;
  const copy:BuildingVisual={...object};
  if(copy.key.startsWith('furn-')){
   // All directional canvases use equal X/Y scale; footprints never shear artwork.
   const size=Math.min(object.w,object.h);copy.x=object.x+(object.w-size)/2;copy.y=object.y+object.h-size;copy.w=size;copy.h=size;
  }
  if(object.key==='town-window'){copy.x=object.x+(object.w-.8*48)/2;copy.y-=.55*48;copy.w=.8*48;copy.h=.6*48;}
  if(object.key==='furn-tools-down')copy.y-=48;
  const sign=buildings.find(b=>object.key===(b.id==='depot'?'depot-sign':`village-sign-${b.id}`));
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
   for(const side of ['n','s']){
    let x=b.x+1;
    while(x<b.x+b.width-1){
     if(side==='s'&&door(x)){x++;continue;}
     const width=x+1<b.x+b.width-1&&!(side==='s'&&door(x+1))?2:1,base=(side==='n'?b.y:bottom)-lift;
     put(`house-wall-${side}${width===1?'-half':''}`,x,base-height,width,height,base+lift,{...meta,wallSide:side});x+=width;
    }
   }
   // Side caps join the horizontal caps exactly; no overlapping corner sprites.
   const start=b.y-height-lift+townView.wallThickness,end=bottom-height-lift;
   for(let y=start;y<end-1e-6;y++){
    const length=Math.min(1,end-y);
    put('house-wall-w',b.x,y,1,length,y+height+lift,{...meta,wallSide:'w'});
    put('house-wall-e',b.x+b.width-1,y,1,length,y+height+lift,{...meta,wallSide:'e'});
   }
   for(const [side,x,base]of [['nw',b.x,b.y],['ne',b.x+b.width-1,b.y],['sw',b.x,bottom],['se',b.x+b.width-1,bottom]] as const)
    put(`house-wall-${side}`,x,base-height-lift,1,height,base+.01,{...meta,wallSide:side});
   put('town-window',b.x+1.1,bottom-.7-lift,.8,.6,bottom+.02,{...meta,wallSide:'s'});
   if(story)put('town-window',b.x+b.width-1.9,bottom-.7-lift,.8,.6,bottom+.02,{...meta,wallSide:'s'});
  }
  if(roofs)put(`house-roof-${b.id}`,b.x-townView.roofOverhang,b.y-stories*height,b.width+townView.roofOverhang*2,b.height+.1,bottom+.05,{roofFor:b.id});
 }
 return result;
}
