import {elderwoodMap,elderwoodTerrainGeometry} from './elderwood';
import {woodsMap,woodsGeometry,woodsTrails,woodsSpawnTrails,woodsClearings,woodsHabitats,woodsEncounterSpawns,woodsPortal} from './woods';
import {rectangle,type MapPolygon} from './island-layout';
export const terrainTileSize=32;
export const terrainMaterials=['grass','dirt','stone','water','wood','cliff'] as const;
export type TerrainMaterial=typeof terrainMaterials[number];
export interface TerrainLayerPlan{name:string;material:TerrainMaterial;polygons:MapPolygon[];tint:number}
export interface TerrainPlan{width:number;height:number;offsetY:number;columns:number;rows:number;layers:TerrainLayerPlan[]}
const ellipse=(x:number,y:number,rx:number,ry:number):MapPolygon=>Array.from({length:32},(_,i)=>[x+Math.cos(i*Math.PI/16)*rx,y+Math.sin(i*Math.PI/16)*ry] as const);
function road(points:readonly (readonly [number,number])[],width:number):MapPolygon[]{
 const polygons:MapPolygon[]=points.map(([x,y])=>ellipse(x,y,width/2,width/2));
 for(let i=1;i<points.length;i++){const [ax,ay]=points[i-1],[bx,by]=points[i],length=Math.hypot(bx-ax,by-ay);if(!length)continue;const dx=-(by-ay)/length*width/2,dy=(bx-ax)/length*width/2;polygons.push([[ax+dx,ay+dy],[bx+dx,by+dy],[bx-dx,by-dy],[ax-dx,ay-dy]]);}
 return polygons;
}
// Clip masks to the island rectangle, including the partial final tile row.
function clip(polygon:MapPolygon,width:number,height:number):MapPolygon{
 let out=polygon.map(p=>[p[0],p[1]] as [number,number]);
 for(const [axis,bound,lower]of [[0,0,true],[0,width,false],[1,0,true],[1,height,false]] as const){const input=out;out=[];for(let i=0;i<input.length;i++){const a=input[i],b=input[(i+1)%input.length],inside=(p:[number,number])=>lower?p[axis]>=bound:p[axis]<=bound,ai=inside(a),bi=inside(b);if(ai)out.push(a);if(ai!==bi){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}}
 return out;
}
const cache=new Map<string,TerrainPlan>();
export function terrainPlan(region:string):TerrainPlan{
 const cached=cache.get(region);if(cached)return cached;
 const detailed=region==='woods'||region==='elderwood',map=region==='woods'?woodsMap:elderwoodMap;
 const sourceWidth=detailed?map.width:1536,sourceHeight=detailed?map.height:1152,scale=4/3;
 const width=sourceWidth*scale,height=sourceHeight*scale,layers:TerrainLayerPlan[]=[];
 const add=(name:string,material:TerrainMaterial,polygons:readonly MapPolygon[],tint=0xffffff)=>{layers.push({name,material,tint,polygons:polygons.map(p=>clip(p,sourceWidth,sourceHeight)).filter(p=>p.length>=3).map(p=>{const points=p.map(([x,y])=>[x*scale,y*scale] as const);let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1];}return area<0?points.reverse():points;})});};
 add('meadow',region==='caverns'?'stone':'grass',[rectangle(0,0,sourceWidth,sourceHeight)],region==='woods'?0xd7ead7:region==='swamp'?0x9cb89b:0xffffff);
 let trails:{points:readonly (readonly [number,number])[];width:number}[],pockets:MapPolygon[]=[],stone:MapPolygon[]=[];
 if(region==='woods'){
  trails=[...woodsTrails.map(points=>({points,width:110})),...woodsSpawnTrails.map(points=>({points,width:72}))];
  pockets=[...woodsEncounterSpawns.filter(s=>s.kind!=='bear').map(s=>ellipse(s.x,s.y,95,75)),...woodsClearings.filter(c=>!woodsHabitats.some(h=>h.name===c.name)).map(c=>ellipse(c.x,c.y,c.rx,c.ry))];
  stone=[rectangle(woodsPortal.x*48-110,(woodsPortal.y-map.offsetY)*48-65,220,145),ellipse(2600,1590,340,225)];
 }else if(region==='elderwood'){
  trails=[[[765,0],[765,1024]],[[0,500],[1536,500]],[[245,350],[600,350]],[[930,350],[1350,350]],[[245,350],[245,610],[555,610],[555,350]],[[970,350],[970,810],[1345,810],[1345,350]],[[275,610],[275,810],[610,810]],[[435,290],[435,350]],[[1090,280],[1090,350]],[[970,600],[1345,600]],[[65,214],[175,214],[175,350]],[[1465,680],[1420,680],[1420,500]],[[275,935],[275,870]],[[1182,945],[1182,865]]].map(points=>({points:points as [number,number][],width:46}));
  stone=[[[710,290],[825,290],[825,310],[950,310],[950,695],[825,695],[825,740],[710,740],[710,695],[585,695],[585,310],[710,310]]];
 }else trails=[{points:[[792,0],[792,1152]],width:144},{points:[[0,648],[1536,648]],width:144}];
 add('path-border','dirt',[...trails.flatMap(t=>road(t.points,t.width+6)),...pockets.map(p=>p)],0x987244);
 add('paths','dirt',[...trails.flatMap(t=>road(t.points,t.width)),...pockets]);
 add('courtyards','stone',stone);
 if(region==='elderwood')add('plaza-gardens','grass',[[630,365,68,100],[840,365,62,100],[630,545,67,86],[840,545,62,86]].map(([x,y,w,h])=>rectangle(x,y,w,h)));
 if(detailed){const geometry=region==='woods'?woodsGeometry:elderwoodTerrainGeometry;
  add('riverbanks','cliff',geometry.rivers.flatMap(p=>road([...p,p[0]],22)),0xc6c1a3);
  add('water','water',geometry.rivers);
  add('cliffs','cliff',geometry.cliffs);
  add('bridges','wood',geometry.bridges);
 }
 const result={width,height,offsetY:detailed?map.offsetY*64:0,columns:Math.ceil(width/32),rows:Math.ceil(height/32),layers};cache.set(region,result);return result;
}
export function terrainFrame(material:TerrainMaterial,x:number,y:number){const variation=((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0)%4;return variation*6+terrainMaterials.indexOf(material);}
export function terrainLayerData(plan:TerrainPlan,layer:TerrainLayerPlan){
 const data=Array.from({length:plan.rows},()=>Array<number>(plan.columns).fill(-1));
 for(const polygon of layer.polygons){const minX=Math.max(0,Math.floor(Math.min(...polygon.map(p=>p[0]))/32)),maxX=Math.min(plan.columns-1,Math.floor(Math.max(...polygon.map(p=>p[0]))/32)),minY=Math.max(0,Math.floor(Math.min(...polygon.map(p=>p[1]))/32)),maxY=Math.min(plan.rows-1,Math.floor(Math.max(...polygon.map(p=>p[1]))/32));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)data[y][x]=terrainFrame(layer.material,x,y);}
 return data;
}
