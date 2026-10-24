import {islandCollision,mapObject,rectangle,type IslandObject,type MapPolygon} from './island-layout';
export const woodsMap={width:1536,height:1024,worldWidth:32,worldHeight:64/3,offsetY:4/3};
// Coastlines are shared by the painted banks and full-footprint collision.
const leftBank=Array.from({length:18},(_,i)=>[104+Math.sin(i*1.15)*19,i*64] as const);
const rightBank=Array.from({length:18},(_,i)=>[1434+Math.sin(i*.95)*19,i*64] as const);
const southBank=Array.from({length:25},(_,i)=>[i*64,951+Math.sin(i*.8)*13] as const);
export const woodsGeometry={rivers:[[[0,0],...leftBank,[0,1088]] as MapPolygon,[[1536,0],...rightBank,[1536,1088]] as MapPolygon,[...southBank,[1536,1024],[0,1024]] as MapPolygon],cliffs:[rectangle(0,0,1536,45)],bridges:[rectangle(35,480,125,65),rectangle(1380,480,125,65)]};
export const woodsObjects:IslandObject[]=[];
const add=(kind:string,x:number,y:number,w:number,h:number,solid=true)=>woodsObjects.push(mapObject(`woods-${kind}`,x,y,w,h,solid?(kind==='boulder'?[[.08,.4],[.88,.4],[.96,.93],[.08,.93]]:kind==='log'?[[.05,.5],[.95,.5],[.95,.95],[.05,.95]]:kind==='fence'?[[.03,.65],[.98,.65],[.98,.98],[.03,.98]]:kind==='ruin'||kind==='torch'||kind==='stump'||kind==='cart'||kind==='den'?[[.12,.75],[.88,.75],[.88,.98],[.12,.98]]:[[.36,.83],[.64,.83],[.64,.98],[.36,.98]]):[]));
// Dense woodland frames four open habitats, linked by broad paths to the sanctuary.
let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let y=65;y<930;y+=62)for(let x=110;x<1430;x+=58){const px=x+random()*24,py=y+random()*18;
 const clearings=[[768,215,170,165],[340,485,195,145],[1210,485,165,145],[790,815,175,115],[792,540,165,120]];
 const clear=clearings.some(([cx,cy,rx,ry])=>((px-cx)/rx)**2+((py-cy)/ry)**2<1.25);
 const path=Math.abs(px-790)<74||Math.abs(py-510)<100;
 if(!clear&&!path)add(random()>.55?'oak':random()>.17?'pine':'ancient',px-36,py-80,80+random()*25,110+random()*15);
}
for(const [x,y] of [[180,230],[560,365],[970,330],[1360,690],[450,730],[1020,845],[210,760]])add('boulder',x,y,65,65);
for(const [x,y] of [[640,360],[910,360],[630,625],[930,625],[600,760],[980,760]])add('lamp',x,y,28,90);
for(const [x,y] of [[230,380],[390,420],[260,530]])add('web',x,y,100,95,false);
for(const [x,y] of [[1090,360],[1300,540],[1120,590]])add('log',x,y,100,45);
for(const [x,y] of [[620,750],[970,750],[620,875],[970,875]])add('ruin',x,y,48,95);
for(const [x,y]of [[590,85],[880,85],[650,290]])add('log',x,y,80,38);
for(const [x,y]of [[610,110],[875,260],[1110,470]])add('stump',x,y,42,40);
for(const [x,y]of [[675,780],[880,860],[690,875]])add('bones',x,y,50,35,false);
for(let i=0;i<45;i++){const x=160+(i*137)%1200,y=140+(i*83)%740;if(Math.abs(x-790)<85||Math.abs(y-510)<75)continue;add(i%2?'mushrooms':'fern',x,y,30,32,false);}
// Set pieces sit at habitat edges, preserving spawn and combat lanes.
for(const [x,y]of [[175,350],[410,535],[260,560]])add('egg-nest',x,y,64,48,false);
for(const [x,y]of [[140,300],[430,300],[180,570]])add('ancient',x,y,120,155);
for(const [x,y]of [[600,65],[880,65],[585,275],[920,275]])add('fence',x,y,85,45);
for(const [x,y]of [[1050,345],[1260,340],[1080,605],[1280,605]])add('fence',x,y,100,50);
for(const [x,y]of [[635,700],[935,700],[625,850],[945,850]])add('torch',x,y,38,95);
for(const [x,y]of [[615,365],[930,365]])add('banner',x,y,38,125);
for(const [x,y]of [[600,425],[950,425],[700,315],[835,315]])add('ruin',x,y,45,85);
add('den',718,36,120,95);add('cart',1325,345,85,80);
add('sign',985,505,60,58);add('sign',555,505,60,58);
for(let i=0;i<100;i++){const x=150+(i*151)%1215,y=100+(i*107)%810;if(Math.abs(x-790)<100||Math.abs(y-510)<85)continue;add(i%3===0?'flowers':i%3===1?'mushrooms':'fern',x,y,26+i%12,28+i%10,false);}
add('portal',700,420,184,164,false);
const collision=islandCollision(1536,1024,woodsGeometry,woodsObjects);
export function woodsFootprintBlocked(x:number,y:number,r=0){return collision(x*48,(y-woodsMap.offsetY)*48,r*48);}
