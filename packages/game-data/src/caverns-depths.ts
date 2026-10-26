import {islandCollision,mapObject,rectangle,type MapPolygon,type IslandObject} from './island-layout';
export const depthsMap={width:2304,height:1728,worldWidth:48,worldHeight:36,offsetY:0};
export const depthsChambers=[{name:'Lower Landing',x:1152,y:1450,rx:260,ry:180},{name:'Sunken Roost',x:500,y:1050,rx:380,ry:300},{name:'Deep Crystal Gallery',x:1800,y:1000,rx:350,ry:280},{name:'Violet Hollow',x:1100,y:550,rx:360,ry:250},{name:'Forgotten Vault',x:1900,y:350,rx:230,ry:170}] as const;
export const depthsTrails:readonly (readonly (readonly [number,number])[])[]=[[[1152,1450],[1152,1050],[500,1050]],[[1152,1050],[1800,1000]],[[500,1050],[500,550],[1100,550]],[[1100,550],[1800,1000]],[[1152,1450],[1152,550]],[[1800,1000],[1900,350]]];
const segmentDistance=(x:number,y:number,a:readonly[number,number],b:readonly[number,number])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
const floor=(x:number,y:number)=>depthsChambers.some(c=>((x-c.x)/c.rx)**2+((y-c.y)/c.ry)**2<1)||depthsTrails.some(trail=>trail.some((p,i)=>i>0&&segmentDistance(x,y,trail[i-1],p)<80));
function cells(walkable:boolean):MapPolygon[]{const out:MapPolygon[]=[];for(let y=0;y<depthsMap.height;y+=24){let start=-1;for(let x=0;x<=depthsMap.width;x+=24){const match=x<depthsMap.width&&floor(x+12,y+12)===walkable;if(match&&start<0)start=x;if(!match&&start>=0){out.push(rectangle(start,y,x-start,24));start=-1;}}}return out;}
export const depthsFloor=cells(true);
export const depthsGeometry={rivers:[rectangle(900,900,400,120)],cliffs:cells(false),bridges:[rectangle(1104,876,96,168)]};
export const depthsObjects:IslandObject[]=[];
for(let y=120;y<1640;y+=130)for(let x=100;x<2200;x+=130){if(floor(x,y)||![[-90,0],[90,0],[0,-90],[0,90]].some(([dx,dy])=>floor(x+dx,y+dy)))continue;depthsObjects.push(mapObject(`caverns-${['crystal-violet','crystal-teal','stalagmite','ore-vein'][(x+y)%4]}`,x-30,y-70,70,95));}
for(const [x,y]of [[950,1440],[1300,1440],[280,1050],[660,820],[1510,1000],[2000,950],[890,500],[1270,530],[1800,350]])depthsObjects.push(mapObject('caverns-lantern-blue',x,y-100,35,100));
for(const [x,y]of [[300,1200],[650,1250],[950,650],[1300,400]])depthsObjects.push(mapObject('caverns-mushroom-luminous',x,y,70,55));
depthsObjects.push(mapObject('caverns-geode',1840,230,110,110),mapObject('caverns-rune-obelisk',2050,300,70,130),mapObject('caverns-old-crate',1350,1480,65,65));
depthsObjects.push(mapObject('caverns-stairs-up',1152-80,1420-150,160,170));
const collision=islandCollision(depthsMap.width,depthsMap.height,depthsGeometry,depthsObjects);
export function depthsFootprintBlocked(x:number,y:number,r=0){return collision(x*48,y*48,r*48);}
export const depthsSpawns=[...(['bat','crawler','golem'] as const).flatMap(kind=>{const c=depthsChambers[kind==='bat'?1:kind==='crawler'?3:2],count=kind==='golem'?4:6;return Array.from({length:count},(_,i)=>({id:`depths-${kind}-${i+1}`,kind,region:'caverns-depths' as const,x:(c.x+(i%2-.5)*220)/48,y:(c.y+(Math.floor(i/2)-(count===4?.5:1))*150)/48}));}),{id:'depths-vault-golem',kind:'golem' as const,region:'caverns-depths' as const,x:1900/48,y:400/48}];
