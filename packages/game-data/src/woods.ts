import placements from './woods-placement.json';
import {islandCollision,mapObject,rectangle,type IslandObject,type MapPolygon} from './island-layout';
export const woodsMap={width:3264,height:2176,worldWidth:68,worldHeight:136/3,offsetY:4/3};
export const woodsHabitats=[
 {kind:'wolf',name:'Wolf den',x:600,y:300,rx:360,ry:240},
 {kind:'spider',name:'Web hollow',x:600,y:1590,rx:360,ry:240},
 {kind:'boar',name:'Boar grounds',x:2600,y:300,rx:360,ry:240},
 {kind:'bear',name:'Forest Bear arena',x:2600,y:1590,rx:360,ry:240},
] as const;
export const woodsClearings=[
 {name:'Portal sanctuary',x:placements.portal.x,y:placements.portal.y,rx:180,ry:145},...woodsHabitats,
 {name:'Overgrown lookout',x:1632,y:300,rx:150,ry:110},
 {name:'Ancient grove',x:1632,y:1850,rx:150,ry:110},
 {name:'Old crossroads',x:1632,y:800,rx:160,ry:115},
];
export const woodsPortal={x:placements.portal.x/48,y:placements.portal.y/48+woodsMap.offsetY,radius:2.5,arrival:{x:placements.portal.x/48,y:(placements.portal.y+96)/48+woodsMap.offsetY}};
export type WoodsMonsterKind=typeof woodsHabitats[number]['kind'];
export interface WoodsEncounter {id:string;kind:WoodsMonsterKind;x:number;y:number;area:'habitat'|'approach'}
const seen=new Set<string>();
export const woodsEncounterSpawns:WoodsEncounter[]=placements.spawns.map(s=>{
 if(!s.id||seen.has(s.id)||!woodsHabitats.some(h=>h.kind===s.kind)||!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<120||s.x>3140||s.y<70||s.y>2070)throw Error(`Invalid Woods placement: ${s.id}`);
 seen.add(s.id);return {...s,kind:s.kind as WoodsMonsterKind,area:s.area==='approach'?'approach':'habitat'};
});
export const woodsTrails:readonly (readonly (readonly [number,number])[])[]=[
 [[792,584],[1050,800],[1632,800],[2150,800]],
 [[600,300],[1050,300],[1050,1590],[600,1590]],
 [[2600,300],[2150,300],[2150,800],[2600,1100],[2600,1590]],
 [[1632,800],[1632,300]],[[1632,800],[placements.portal.x,placements.portal.y],[1632,1850]],[[1050,1590],[1632,1850],[1990,1590],[2150,800]],
 [[100,510],[792,584]],[[3160,800],[2150,800]],
];
const nearestRoad=(s:WoodsEncounter):[number,number]=>{
 let best:[number,number]=[s.x,s.y],distance=Infinity;
 for(const trail of woodsTrails)for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((s.x-a[0])*dx+(s.y-a[1])*dy)/(dx*dx+dy*dy))),p:[number,number]=[a[0]+dx*t,a[1]+dy*t],d=Math.hypot(p[0]-s.x,p[1]-s.y);if(d<distance){distance=d;best=p;}}
 return best;
};
export const woodsSpawnTrails=woodsEncounterSpawns.filter(s=>s.kind!=='bear').map(s=>{
 const h=woodsHabitats.find(h=>h.kind===s.kind)!,start=s.area==='approach'?nearestRoad(s):[h.x,h.y];
 return [start,[s.x,s.y]] as readonly (readonly [number,number])[];
}).filter(([a,b])=>a[0]!==b[0]||a[1]!==b[1]);
export const woodsBossBoundary={left:2160,right:3040,top:1280,bottom:1920,thickness:36,gateLeft:2520,gateRight:2680};
const wall=woodsBossBoundary;
export const woodsBossWalls=[rectangle(wall.left,wall.top,wall.gateLeft-wall.left,wall.thickness),rectangle(wall.gateRight,wall.top,wall.right-wall.gateRight,wall.thickness),rectangle(wall.left,wall.top,wall.thickness,wall.bottom-wall.top),rectangle(wall.right-wall.thickness,wall.top,wall.thickness,wall.bottom-wall.top),rectangle(wall.left,wall.bottom-wall.thickness,wall.right-wall.left,wall.thickness)];
const leftBank=Array.from({length:35},(_,i)=>[104+Math.sin(i*1.15)*19,i*64] as const);
const rightBank=Array.from({length:35},(_,i)=>[3160+Math.sin(i*.95)*19,i*64] as const);
const southBank=Array.from({length:52},(_,i)=>[i*64,2100+Math.sin(i*.8)*13] as const);
export const woodsGeometry={rivers:[[[0,0],...leftBank,[0,2176]] as MapPolygon,[[3264,0],...rightBank,[3264,2176]] as MapPolygon,[...southBank,[3264,2176],[0,2176]] as MapPolygon],cliffs:[rectangle(0,0,3264,45),...woodsBossWalls],bridges:[rectangle(35,480,125,65),rectangle(3100,770,125,65)]};
export const woodsObjects:IslandObject[]=[];
const add=(kind:string,x:number,y:number,w:number,h:number,solid=true)=>woodsObjects.push(mapObject(`woods-${kind}`,x,y,w,h,solid?(kind==='boulder'?[[.08,.4],[.88,.4],[.96,.93],[.08,.93]]:kind==='log'?[[.05,.5],[.95,.5],[.95,.95],[.05,.95]]:kind==='fence'?[[.03,.65],[.98,.65],[.98,.98],[.03,.98]]:kind==='ruin'||kind==='torch'||kind==='stump'||kind==='cart'||kind==='den'?[[.12,.75],[.88,.75],[.88,.98],[.12,.98]]:[[.36,.83],[.64,.83],[.64,.98],[.36,.98]]):[]));
const segmentDistance=(x:number,y:number,a:readonly [number,number],b:readonly [number,number])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
const open=(x:number,y:number,padding=0)=>
 woodsClearings.filter(c=>!woodsHabitats.some(h=>h.name===c.name)||c.name==='Forest Bear arena').some(c=>((x-c.x)/(c.rx+padding))**2+((y-c.y)/(c.ry+padding))**2<1)||
 woodsEncounterSpawns.some(s=>((x-s.x)/(105+padding))**2+((y-s.y)/(85+padding))**2<1)||
 [...woodsTrails,...woodsSpawnTrails].some(trail=>trail.some((p,i)=>i>0&&segmentDistance(x,y,trail[i-1],p)<(woodsTrails.includes(trail)?60:38)+padding))||
 (x>wall.left-65&&x<wall.right+65&&y>wall.top-65&&y<wall.bottom+65);
let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let y=95;y<2060;y+=62)for(let x=145;x<3110;x+=58){const px=x+random()*24,py=y+random()*18;if(!open(px,py,35))add(random()>.55?'oak':random()>.17?'pine':'ancient',px-38,py-95,80+random()*25,110+random()*15);}
for(let i=0;i<320;i++){const x=170+random()*2880,y=120+random()*1880;if(open(x,y,50))continue;add(i%5===0?'boulder':i%5===1?'stump':i%5===2?'log':i%5===3?'fern':'mushrooms',x-20,y-30,i%5===2?85:42,i%5===2?38:42,i%5<3);}
for(let i=0;i<250;i++){const x=170+random()*2880,y=120+random()*1880;if(open(x,y,0))continue;add(i%3===0?'flowers':i%3===1?'mushrooms':'fern',x,y,28,30,false);}
// Landmark props stay on pocket edges, leaving the shared access routes clear.
add('den',545,175,110,90,false);
for(const s of woodsEncounterSpawns.filter(s=>s.kind==='spider')){add('web',s.x-90,s.y-50,68,65,false);add('egg-nest',s.x+45,s.y+20,50,38,false);}
for(const s of woodsEncounterSpawns.filter(s=>s.kind==='boar'))add('log',s.x+55,s.y+35,65,30,false);
for(const [x,y]of [[2180,1250],[3000,1250],[2180,1850],[3000,1850]])add('ruin',x,y,48,95,false);
for(const x of [2480,2700]){add('torch',x,1240,38,95,false);add('banner',x,1120,38,125,false);}
for(const [x,y]of [[2350,1750],[2790,1750]])add('bones',x,y,50,35,false);
for(const [x,y]of [[1490,230],[1730,230],[1480,1880],[1750,1880]])add('ruin',x,y,48,95,false);
for(const [x,y]of [[620,440],[940,440],[1450,710],[1770,710],[1100,1100],[2040,1100]])add('lamp',x,y,28,90,false);
for(const [x,y]of [[1030,590],[1200,810],[1960,810],[1800,1690]])add('sign',x,y,60,58,false);
add('portal',placements.portal.x-100,placements.portal.y-179,200,179,false);
woodsObjects.push(mapObject('caverns-stairs-down',1552,700,160,120));
const collision=islandCollision(woodsMap.width,woodsMap.height,woodsGeometry,woodsObjects);
export function woodsFootprintBlocked(x:number,y:number,r=0){return collision(x*48,(y-woodsMap.offsetY)*48,r*48);}
