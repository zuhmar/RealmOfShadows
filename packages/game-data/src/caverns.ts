import {islandCollision,mapObject,rectangle,type MapPolygon,type IslandObject} from './island-layout';
export const cavernsMap={width:3072,height:2176,worldWidth:64,worldHeight:136/3,offsetY:4/3};
export const cavernsPortal={x:32,y:1850/48+4/3,radius:2.5,arrival:{x:32,y:1946/48+4/3}};
export const cavernsChambers=[
 {name:'Wayfarer Landing',x:1536,y:1850,rx:310,ry:200},
 {name:'Echoing Roost',x:650,y:1510,rx:500,ry:360,kind:'bat'},
 {name:'Shard Nest',x:650,y:600,rx:500,ry:360,kind:'crawler'},
 {name:'Golem Gallery',x:2250,y:1500,rx:500,ry:360,kind:'golem'},
 {name:'Prismatic Crossing',x:1536,y:1100,rx:240,ry:200},
 {name:'Forgotten Survey',x:1250,y:300,rx:150,ry:130},
 {name:'Miner’s Rest',x:350,y:1100,rx:160,ry:130},
 {name:'Deep Geode',x:2750,y:1850,rx:140,ry:130},
 {name:'Wyrm Sanctum',x:2250,y:500,rx:480,ry:320,kind:'wyrm'},
] as const;
export const cavernsTrails:readonly (readonly (readonly [number,number])[])[]=[
 [[1536,1850],[1536,1500],[650,1510]],[[650,1510],[650,600]],
 [[1536,1500],[2250,1500]],[[2250,1500],[2250,1050],[2250,500]],
 [[650,600],[1150,600],[1536,1100],[2250,1050]],[[1536,1100],[1536,1850]],
 [[650,600],[1050,600],[1250,300]],[[650,1100],[350,1100]],[[2250,1500],[2600,1650],[2750,1850]],
];
const segmentDistance=(x:number,y:number,a:readonly [number,number],b:readonly [number,number])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
const floor=(x:number,y:number)=>cavernsChambers.some(c=>((x-c.x)/c.rx)**2+((y-c.y)/c.ry)**2<1)||cavernsTrails.some(trail=>trail.some((p,i)=>i>0&&segmentDistance(x,y,trail[i-1],p)<100))||(x>=1740&&x<=2760&&y>=160&&y<=880);
// Shared 24-source-pixel cells become native 32px map tiles. Merge runs so the
// renderer and collision buckets use compact, identical floor/wall footprints.
function cells(walkable:boolean):MapPolygon[]{
 const output:MapPolygon[]=[],active=new Map<string,{x:number;y:number;w:number;h:number}>();
 for(let y=0;y<cavernsMap.height;y+=24){const present=new Set<string>();let start=-1;
  for(let x=0;x<=cavernsMap.width;x+=24){const match=x<cavernsMap.width&&floor(x+12,y+12)===walkable;if(match&&start<0)start=x;if(!match&&start>=0){const key=`${start}:${x}`,old=active.get(key),h=Math.min(24,cavernsMap.height-y);present.add(key);if(old)old.h+=h;else active.set(key,{x:start,y,w:x-start,h});start=-1;}}
  for(const [key,r]of active)if(!present.has(key)){output.push(rectangle(r.x,r.y,r.w,r.h));active.delete(key);}
 }
 for(const r of active.values())output.push(rectangle(r.x,r.y,r.w,r.h));return output;
}
export const cavernsFloor=cells(true);
export const cavernsBossWalls=[rectangle(1700,120,1100,40),rectangle(1700,120,40,800),rectangle(2760,120,40,800),rectangle(1700,880,450,40),rectangle(2350,880,450,40)];
export const cavernsGeometry={rivers:[rectangle(1260,1580,550,90),rectangle(1420,230,230,140)],cliffs:[...cells(false),...cavernsBossWalls],bridges:[rectangle(1480,1550,112,160)]};
export const cavernsSpawns=[...(['bat','crawler','golem'] as const).flatMap(kind=>{
 const c=cavernsChambers.find(c=>'kind'in c&&c.kind===kind)!;
 return Array.from({length:9},(_,i)=>({id:`${kind}-${i+1}`,kind,region:'caverns' as const,x:(c.x+(i%3-1)*220)/48,y:(c.y+(Math.floor(i/3)-1)*190)/48+cavernsMap.offsetY}));
}),{id:'wyrm-1',kind:'wyrm' as const,region:'caverns' as const,x:2250/48,y:500/48+cavernsMap.offsetY}];
export const cavernsObjects:IslandObject[]=[];
const add=(kind:string,x:number,y:number,w:number,h:number)=>cavernsObjects.push(mapObject(`caverns-${kind}`,x,y,w,h,['rock-large','mine-cart','old-crate','rune-obelisk','ancient-statue','crystal-large'].includes(kind)?rectangle(.15,.75,.7,.22):[]));
for(let y=140;y<2070;y+=140)for(let x=160;x<2960;x+=140){if(floor(x,y)||![[-100,0],[100,0],[0,-100],[0,100]].some(([dx,dy])=>floor(x+dx,y+dy)))continue;const n=(x*31+y*17)>>>0;const kind=['crystal-blue','crystal-violet','crystal-teal','stalagmite','ore-vein','rock-small'][n%6];add(kind,x-40,y-90,kind==='rock-small'||kind==='ore-vein'?100:80,kind==='rock-small'?65:100);}
for(const [x,y]of [[350,1440],[1020,1600],[310,610],[940,360],[1920,1450],[2600,1570],[1340,1070],[1740,1120]])add('lantern-blue',x,y,35,100);
for(const [x,y]of [[400,1580],[500,1800],[800,1240],[330,1180]])add('mushroom-luminous',x,y,65,48);
for(const x of [1830,1920,2010,2100])add('rail-straight',x,1470,90,32);
add('rail-curve',2180,1430,90,65);add('wood-support',1430,1410,212,160);
for(const [x,y]of [[400,1120],[760,1120],[350,220],[720,220],[2020,1110],[2400,1110],[1910,140],[2440,140]])add('stalactite',x,y,160,130);
for(const [x,y]of [[1310,1030],[1730,1030]])add('ruin-pillar',x,y,65,130);
for(const [x,y]of [[310,1850],[1170,200],[2780,1770]])add('shard-pile',x,y,65,45);
add('mine-cart',2600,1420,100,90);add('old-crate',2620,1540,60,60);add('old-crate',2690,1570,55,55);
for(const [x,y]of [[1190,260],[280,1030],[2720,1760]]){add('crystal-large',x,y,100,160);add('geode',x+65,y+100,80,80);}
add('ancient-statue',2040,850,85,140);add('ancient-statue',2370,850,85,140);add('broken-arch',2110,750,280,180);
add('rune-obelisk',1880,250,80,140);add('rune-obelisk',2540,250,80,140);add('crystal-large',2210,220,130,180);
for(const [x,y]of [[1860,740],[2530,740],[980,570]])add('bones',x,y,65,45);
cavernsObjects.push(mapObject('elderwood-portal',1536-100,1850-179,200,179));
cavernsObjects.push(mapObject('caverns-stairs-down',1456,1020,160,120));
const collision=islandCollision(cavernsMap.width,cavernsMap.height,cavernsGeometry,cavernsObjects);
export function cavernsFootprintBlocked(x:number,y:number,r=0){return collision(x*48,(y-cavernsMap.offsetY)*48,r*48);}
