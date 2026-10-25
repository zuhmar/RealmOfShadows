import {islandCollision,mapObject,rectangle,type IslandObject,type MapPolygon} from './island-layout';
export const woodsMap={width:2304,height:1536,worldWidth:48,worldHeight:32,offsetY:4/3};
// Ground guide, foliage exclusion and navigation landmarks share these coordinates.
export const woodsClearings=[
 {name:'Portal sanctuary',x:792,y:584,rx:180,ry:145},
 {name:'Wolf den',x:768,y:250,rx:310,ry:210},
 {name:'Web hollow',x:330,y:430,rx:245,ry:230},
 {name:'Boar grounds',x:1870,y:900,rx:300,ry:230},
 {name:'Forest Bear arena',x:1550,y:1290,rx:220,ry:155},
 {name:'Overgrown lookout',x:1810,y:290,rx:170,ry:130},
 {name:'Ancient grove',x:500,y:1210,rx:165,ry:130},
 {name:'Old crossroads',x:1200,y:1000,rx:140,ry:110},
];
export const woodsTrails:readonly (readonly (readonly [number,number])[])[]=[
 [[792,584],[768,215]],[[792,584],[330,584],[330,430]],
 [[792,584],[1200,584],[1500,450],[1810,290]],
 [[1200,584],[1540,720],[1870,900]],
 [[792,584],[900,820],[1200,1000],[1550,1290]],
 [[330,430],[330,1000],[500,1210],[1200,1000]],
 [[1200,1000],[1600,1050],[1870,900]],
 [[100,510],[330,584]],[[1870,900],[2200,800]],
];
const leftBank=Array.from({length:25},(_,i)=>[104+Math.sin(i*1.15)*19,i*64] as const);
const rightBank=Array.from({length:25},(_,i)=>[2200+Math.sin(i*.95)*19,i*64] as const);
const southBank=Array.from({length:37},(_,i)=>[i*64,1460+Math.sin(i*.8)*13] as const);
export const woodsGeometry={rivers:[[[0,0],...leftBank,[0,1536]] as MapPolygon,[[2304,0],...rightBank,[2304,1536]] as MapPolygon,[...southBank,[2304,1536],[0,1536]] as MapPolygon],cliffs:[rectangle(0,0,2304,45)],bridges:[rectangle(35,480,125,65),rectangle(2140,770,125,65)]};
export const woodsObjects:IslandObject[]=[];
const add=(kind:string,x:number,y:number,w:number,h:number,solid=true)=>woodsObjects.push(mapObject(`woods-${kind}`,x,y,w,h,solid?(kind==='boulder'?[[.08,.4],[.88,.4],[.96,.93],[.08,.93]]:kind==='log'?[[.05,.5],[.95,.5],[.95,.95],[.05,.95]]:kind==='fence'?[[.03,.65],[.98,.65],[.98,.98],[.03,.98]]:kind==='ruin'||kind==='torch'||kind==='stump'||kind==='cart'||kind==='den'?[[.12,.75],[.88,.75],[.88,.98],[.12,.98]]:[[.36,.83],[.64,.83],[.64,.98],[.36,.98]]):[]));

const segmentDistance=(x:number,y:number,a:readonly [number,number],b:readonly [number,number])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
const open=(x:number,y:number,padding=0)=>woodsClearings.some(c=>((x-c.x)/(c.rx+padding))**2+((y-c.y)/(c.ry+padding))**2<1)||woodsTrails.some(trail=>trail.some((p,i)=>i>0&&segmentDistance(x,y,trail[i-1],p)<76+padding));
let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let y=85;y<1440;y+=62)for(let x=140;x<2170;x+=58){const px=x+random()*24,py=y+random()*18;if(!open(px,py,30))add(random()>.55?'oak':random()>.17?'pine':'ancient',px-38,py-95,80+random()*25,110+random()*15);}
// Scenery frames the clearings rather than occupying spawn or travel lanes.
for(let i=0;i<180;i++){const x=160+random()*1960,y=100+random()*1300;if(open(x,y,35))continue;add(i%5===0?'boulder':i%5===1?'stump':i%5===2?'log':i%5===3?'fern':'mushrooms',x-20,y-30,i%5===2?85:42,i%5===2?38:42,i%5<3);}
for(let i=0;i<160;i++){const x=160+random()*1960,y=100+random()*1300;if(open(x,y,-25))continue;add(i%3===0?'flowers':i%3===1?'mushrooms':'fern',x,y,28,30,false);}
for(const [x,y]of [[610,365],[935,365],[610,685],[935,685],[1110,875],[1290,1080]])add('lamp',x,y,28,90);
for(const [x,y]of [[175,300],[420,330],[200,495]])add('web',x,y,100,95,false);
for(const [x,y]of [[165,460],[410,490],[230,520]])add('egg-nest',x,y,64,48,false);
for(const [x,y]of [[1700,745],[1980,760],[1720,1050],[2010,1010]])add('fence',x,y,90,45);
for(const [x,y]of [[1740,1070],[1995,1080]])add('log',x,y,95,42);
for(const [x,y]of [[1330,1150],[1750,1150],[1330,1360],[1750,1360]])add('torch',x,y,38,95);
for(const [x,y]of [[1360,1170],[1700,1170],[1370,1350],[1700,1350],[1690,190],[1900,210],[1750,360],[1900,355]])add('ruin',x,y,48,95);
for(const [x,y]of [[1430,1340],[1630,1360]])add('bones',x,y,50,35,false);
for(const [x,y]of [[340,1110],[570,1100],[380,1295],[590,1280]])add('ancient',x,y,120,155);
for(const [x,y]of [[600,65],[880,65],[585,275],[920,275]])add('fence',x,y,85,45);
for(const [x,y]of [[615,365],[930,365]])add('banner',x,y,38,125);
add('den',718,36,120,95);add('cart',2010,760,85,80);
for(const [x,y]of [[985,505],[555,505],[1280,625],[1100,1050],[1660,930]])add('sign',x,y,60,58);
add('portal',700,420,184,164,false);
const collision=islandCollision(woodsMap.width,woodsMap.height,woodsGeometry,woodsObjects);
export function woodsFootprintBlocked(x:number,y:number,r=0){return collision(x*48,(y-woodsMap.offsetY)*48,r*48);}
