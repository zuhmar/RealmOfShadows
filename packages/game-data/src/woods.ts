import {islandCollision,mapObject,rectangle,type IslandObject} from './island-layout';
export const woodsMap={width:1536,height:1024,worldWidth:32,worldHeight:64/3,offsetY:4/3};
export const woodsGeometry={rivers:[rectangle(0,0,105,1024),rectangle(1430,0,106,1024),rectangle(0,940,1536,84)],cliffs:[rectangle(0,0,1536,45)],bridges:[rectangle(35,480,125,65),rectangle(1380,480,125,65)]};
export const woodsObjects:IslandObject[]=[];
const add=(kind:string,x:number,y:number,w:number,h:number,solid=true)=>woodsObjects.push(mapObject(`woods-${kind}`,x,y,w,h,solid?(kind==='boulder'?[[.08,.4],[.88,.4],[.96,.93],[.08,.93]]:kind==='log'?[[.05,.5],[.95,.5],[.95,.95],[.05,.95]]:[[.36,.83],[.64,.83],[.64,.98],[.36,.98]]):[]));
// Dense woodland frames four open habitats, linked by broad paths to the sanctuary.
let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let y=65;y<930;y+=62)for(let x=110;x<1430;x+=58){const px=x+random()*24,py=y+random()*18;
 const clearings=[[768,215,170,165],[340,485,195,145],[1210,485,165,145],[790,815,175,115],[792,540,165,120]];
 const clear=clearings.some(([cx,cy,rx,ry])=>((px-cx)/rx)**2+((py-cy)/ry)**2<1.25);
 const path=Math.abs(px-790)<62||Math.abs(py-510)<90;
 if(!clear&&!path)add(random()>.45?'oak':'pine',px-36,py-80,80+random()*20,110);
}
for(const [x,y] of [[180,230],[560,365],[970,330],[1360,690],[450,730],[1020,845],[210,760]])add('boulder',x,y,65,65);
for(const [x,y] of [[640,360],[910,360],[630,625],[930,625],[600,760],[980,760]])add('lamp',x,y,28,90);
for(const [x,y] of [[230,380],[390,420],[260,530]])add('web',x,y,100,95,false);
for(const [x,y] of [[1090,360],[1300,540],[1120,590]])add('log',x,y,100,45);
for(const [x,y] of [[620,750],[970,750],[620,900],[970,900]])add('ruin',x,y,48,95);
for(const [x,y]of [[590,85],[880,85],[650,290]])add('log',x,y,80,38);
for(const [x,y]of [[610,110],[875,260],[1110,470]])add('stump',x,y,42,40);
for(const [x,y]of [[675,780],[880,860],[690,875]])add('bones',x,y,50,35,false);
for(let i=0;i<45;i++){const x=160+(i*137)%1200,y=140+(i*83)%740;if(Math.abs(x-790)<85||Math.abs(y-510)<75)continue;add(i%2?'mushrooms':'fern',x,y,30,32,false);}
add('portal',700,420,184,164,false);
const collision=islandCollision(1536,1024,woodsGeometry,woodsObjects);
export function woodsFootprintBlocked(x:number,y:number,r=0){return collision(x*48,(y-woodsMap.offsetY)*48,r*48);}
