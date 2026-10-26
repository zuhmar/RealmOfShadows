import {islandCollision,mapObject,rectangle,type MapPolygon,type IslandObject} from './island-layout';
export const rootsMap={width:2304,height:1728,worldWidth:48,worldHeight:36,offsetY:0};
export const rootsChambers=[{name:'Rootway Landing',x:1152,y:1450,rx:260,ry:180},{name:'Wolf Burrow',x:500,y:1050,rx:380,ry:300},{name:'Briar Thicket',x:1800,y:1000,rx:350,ry:280},{name:'Silken Hollow',x:1100,y:550,rx:360,ry:250},{name:'Ancient Root Shrine',x:1900,y:350,rx:230,ry:170}] as const;
export const rootsTrails:readonly (readonly (readonly [number,number])[])[]=[[[1152,1450],[1152,1050],[500,1050]],[[1152,1050],[1800,1000]],[[500,1050],[500,550],[1100,550]],[[1100,550],[1800,1000]],[[1152,1450],[1152,550]],[[1800,1000],[1900,350]]];
const segmentDistance=(x:number,y:number,a:readonly[number,number],b:readonly[number,number])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
const floor=(x:number,y:number)=>rootsChambers.some(c=>((x-c.x)/c.rx)**2+((y-c.y)/c.ry)**2<1)||rootsTrails.some(trail=>trail.some((p,i)=>i>0&&segmentDistance(x,y,trail[i-1],p)<80));
function cells(walkable:boolean):MapPolygon[]{const out:MapPolygon[]=[];for(let y=0;y<rootsMap.height;y+=24){let start=-1;for(let x=0;x<=rootsMap.width;x+=24){const match=x<rootsMap.width&&floor(x+12,y+12)===walkable;if(match&&start<0)start=x;if(!match&&start>=0){out.push(rectangle(start,y,x-start,24));start=-1;}}}return out;}
export const rootsFloor=cells(true);
export const rootsGeometry={rivers:[rectangle(900,900,400,120)],cliffs:cells(false),bridges:[rectangle(1104,876,96,168)]};
export const rootsObjects:IslandObject[]=[];
// The cliff mask forms the solid roots; decorative props stay outside walkable routes.
for(let y=120;y<1640;y+=110)for(let x=100;x<2200;x+=115){
 if(floor(x,y)||![[-85,0],[85,0],[0,-85],[0,85]].some(([dx,dy])=>floor(x+dx,y+dy)))continue;
 rootsObjects.push(mapObject(`woods-${['stump','fern','mushrooms','log'][(Math.floor(x/115)+Math.floor(y/110))%4]}`,x-25,y-40,65,60));
}
for(const [x,y]of [[950,1440],[1300,1440],[280,1050],[660,820],[1510,1000],[2000,950],[890,500],[1270,530],[1800,350]])rootsObjects.push(mapObject('woods-lamp',x,y-90,28,90));
for(const [x,y]of [[300,1200],[650,1250],[950,650],[1300,400],[1750,800]])rootsObjects.push(mapObject('woods-mushrooms',x,y,60,50));
for(const [x,y]of [[900,430],[1250,400],[1290,600]])rootsObjects.push(mapObject('woods-web',x,y,90,85),mapObject('woods-egg-nest',x+65,y+65,45,35));
rootsObjects.push(mapObject('woods-den',300,850,130,100),mapObject('woods-ruin',1810,220,65,120),mapObject('woods-ruin',2050,300,65,120),mapObject('woods-flowers',1880,300,60,45));
rootsObjects.push(mapObject('caverns-stairs-up',1152-80,1420-150,160,170));
const collision=islandCollision(rootsMap.width,rootsMap.height,rootsGeometry,rootsObjects);
export function rootsFootprintBlocked(x:number,y:number,r=0){return collision(x*48,y*48,r*48);}
export const rootsSpawns=[...(['wolf','spider','boar'] as const).flatMap(kind=>{
 const c=rootsChambers[kind==='wolf'?1:kind==='spider'?3:2],count=6;
 return Array.from({length:count},(_,i)=>({id:`roots-${kind}-${i+1}`,kind,region:'woods-depths' as const,x:(c.x+(i%2-.5)*220)/48,y:(c.y+(Math.floor(i/2)-1)*150)/48}));
}),{id:'roots-shrine-spider',kind:'spider' as const,region:'woods-depths' as const,x:1900/48,y:400/48}];
