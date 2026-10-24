import {mapObject,rectangle,islandCollision,pointInPolygon,type IslandObject,type IslandGeometry,type MapPolygon} from './island-layout';
// Reference.png is the island plan. Coordinates stay in its 1536 × 1024 space.
export const elderwoodMap={width:1536,height:1024,worldWidth:32,worldHeight:64/3,offsetY:4/3};
export const elderwoodTerrainGeometry:IslandGeometry={
 rivers:[
 [[0,0],[80,0],[110,80],[160,130],[150,235],[120,285],[120,360],[70,420],[0,440]],
 [[0,490],[65,505],[95,580],[80,665],[100,745],[70,830],[0,850]],
 [[0,830],[130,865],[235,895],[330,890],[435,895],[560,935],[665,950],[665,1024],[400,1024],[380,995],[320,980],[240,980],[220,1005],[220,1024],[0,1024]],
 [[865,945],[970,920],[1075,915],[1170,880],[1240,830],[1370,840],[1450,820],[1536,820],[1536,1024],[1270,1024],[1250,1005],[1220,980],[1150,980],[1120,1010],[1120,1024],[865,1024]],
 [[1485,0],[1536,0],[1536,845],[1470,820],[1440,760],[1435,665],[1460,620],[1470,555],[1510,495],[1495,410],[1450,350],[1440,245],[1465,180],[1470,90]],
 ],
 cliffs:[[[130,875],[235,910],[435,915],[560,955],[650,975],[650,995],[550,980],[430,950],[220,935],[130,905]],[[875,960],[1000,940],[1140,900],[1235,850],[1250,880],[1150,920],[1000,965],[875,985]]],
 bridges:[rectangle(65,195,75,38),rectangle(1420,660,95,40),rectangle(250,880,45,115),rectangle(1160,850,45,150)],
};
const body=rectangle(.08,.5,.84,.43),smallFoot=rectangle(.3,.78,.4,.18);
const objects:IslandObject[]=[];
const add=(asset:string,x:number,y:number,w:number,h:number,collision:MapPolygon=[],name?:string)=>{const object=mapObject(`elderwood-${asset}`,x,y,w,h,collision,name);objects.push(object);return object;};
add('tavern',285,100,300,210,rectangle(.05,.48,.9,.42),'The Copperleaf Tavern');
add('blacksmith',970,95,235,205,body,'Willow & Anvil');
add('apothecary',1005,405,150,170,body,'Moonpetal Apothecary');
add('general-store',1155,405,165,170,body,'Elderwood General Store');
add('workshop',320,625,205,175,body,'The Makers’ Workshop');
add('hall',985,625,155,170,body,'Adventurers’ Hall');
add('bank',1170,625,190,170,body,'The Copperleaf Bank');
add('portal',668,390,200,179);
// Gates leave a central walking passage; the stone piers have solid footprints.
for(const y of [12,770]){add('gate',665,y,210,110);add('gate-pier',665,y+25,38,85,rectangle(.1,.55,.8,.4));add('gate-pier',837,y+25,38,85,rectangle(.1,.55,.8,.4));}
for(const x of [95,1360]){add('gate-side',x,390,80,210);add('gate-pier',x+20,390,40,55,rectangle(.1,.55,.8,.4));add('gate-pier',x+20,555,40,55,rectangle(.1,.55,.8,.4));}
const fenceH=(x:number,y:number,w:number)=>{for(let offset=0;offset<w;offset+=120)add('fence-h',x+offset,y,Math.min(120,w-offset),25,rectangle(0,.64,1,.28));};
const fenceV=(x:number,y:number,h:number)=>{for(let offset=0;offset<h;offset+=100)add('fence-v',x,y+offset,22,Math.min(100,h-offset),rectangle(.3,0,.4,1));};
for(const [x,w] of [[230,420],[880,450]])fenceH(x,59,w);
// Small open passages connect the two southern footbridges to the village.
for(const [x,w] of [[230,20],[310,340],[880,260],[1220,110]])fenceH(x,827,w);
add('gate',240,815,70,55);add('gate',1135,815,95,55);
for(const x of [160,1435]){fenceV(x,120,265);fenceV(x,612,200);}
// Market, fenced training yard, and farm from the reference.
for(const [asset,x,y] of [['stall-red',275,385],['stall-blue',370,408],['stall-red',460,427],['stall-blue',295,490],['stall-green',440,510]] as const)add(asset,x,y,83,83,rectangle(.09,.64,.82,.33),'Market stall');
fenceH(1275,142,150);fenceV(1270,142,145);fenceV(1410,142,145);fenceH(1340,287,70);
for(const [x,y] of [[1312,190],[1370,220],[1345,255]])add('dummy',x,y,25,44,smallFoot);
for(let y=643;y<770;y+=45)add('crops',163,y,77,36);
fenceV(145,632,151);fenceV(247,660,123);fenceH(145,779,102);
// Furniture occupies the edges of the square and building terraces.
for(const [x,y] of [[673,245],[812,245],[720,332],[690,594],[355,283],[510,277],[985,565],[1288,565]])add('bench',x,y,82,28,rectangle(.05,.55,.9,.4));
for(const [x,y] of [[660,300],[850,300],[650,440],[860,440],[660,600],[850,600],[720,200],[802,200],[270,250],[1230,250],[270,560],[1305,560],[350,740],[1320,720]])add('lamp',x,y,22,75,rectangle(.35,.86,.3,.12));
for(const x of [620,881])add('banner',x,443,27,95,rectangle(.4,.9,.2,.09));
for(const [x,y] of [[305,274],[545,268],[980,263],[1170,265],[1030,550],[1285,548],[340,750],[500,755],[990,754],[1310,755]])add('barrel',x,y,25,30,rectangle(.1,.48,.8,.5));
for(const [x,y] of [[635,319],[868,319],[630,578],[870,578]])add('planter',x,y,28,26,rectangle(.1,.5,.8,.46));
// Tree canopies sort by trunk feet, so players can walk behind foliage.
const tree=(x:number,ground:number,height:number,pine=false)=>add(pine?'pine':'oak',x-height*.4,ground-height,height*.8,height,rectangle(.43,.82,.14,.15));
// Boundary woodland is deterministic and leaves gates, bridges and shore approaches clear.
for(let row=0;row<3;row++)for(let x=20;x<1536;x+=64){const ground=44+row*29;if(x>630&&x<900)continue;tree(x+(row%2)*23,ground,78+(x%3)*7,(x+row)%3===0);}
for(let x=22;x<1536;x+=68){if((x>600&&x<930)||(x>245&&x<315)||(x>1130&&x<1220))continue;tree(x,908+(x%4)*8,85,x%3===0);}
for(let y=150;y<835;y+=65){if(y>365&&y<620)continue;for(const x of [35,185,1487]){if(geometryWater(x,y))continue;tree(x,y,80+(y%3)*6,(x+y)%3===0);}}
for(const [x,y,h,pine] of [
 [230,187,105,1],[615,154,110,1],[652,239,93,0],[604,326,90,1],[219,352,84,0],[330,349,74,0],[535,355,83,0],
 [910,176,95,1],[945,280,88,0],[1224,166,101,1],[1240,343,90,0],[1370,356,88,1],[988,357,73,0],[1130,354,80,1],
 [221,610,89,0],[267,682,89,1],[270,735,85,0],[574,710,99,1],[576,805,88,0],[625,761,90,1],
 [942,695,85,1],[941,811,84,0],[1138,650,78,0],[1367,670,94,1],[1346,811,95,0],
 [659,732,75,0],[871,732,75,1],
] as const)tree(x,y,h,Boolean(pine));
for(const [x,y] of [[435,61],[1080,65],[117,807],[1440,118],[580,872],[937,876]])add('boulder',x,y,45,48,rectangle(.15,.52,.7,.44));
export const elderwoodObjects=objects;
function geometryWater(x:number,y:number){return elderwoodTerrainGeometry.rivers.some(p=>pointInPolygon(x,y,p));}
const collide=islandCollision(elderwoodMap.width,elderwoodMap.height,elderwoodTerrainGeometry,elderwoodObjects);
export function elderwoodFootprintBlocked(x:number,y:number,radius:number){return collide(x*48,(y-elderwoodMap.offsetY)*48,radius*48);}
export function elderwoodPositionBlocked(x:number,y:number){return collide(x*48,(y-elderwoodMap.offsetY)*48);}
export function elderwoodBlocked(x:number,y:number){return elderwoodPositionBlocked(x+.5,y+.5);}
export type ElderwoodTerrain='grass'|'dirt'|'stone'|'water';
export function elderwoodGround(x:number,y:number):ElderwoodTerrain{return x>=12&&x<=19&&y>=8&&y<=15?'stone':'grass';}
