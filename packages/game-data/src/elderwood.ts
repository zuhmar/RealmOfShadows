// Coordinates are measured on the original 1536 × 1024 Elderwood base image.
// Keep the original aspect ratio, centered inside the 32 × 24 tile world.
export const elderwoodMap={width:1536,height:1024,worldWidth:32,worldHeight:64/3,offsetY:4/3};
export const elderwoodObjects=[
 {key:'elderwood-tavern',x:310,y:25,w:280,h:280*1024/1536,footY:210},
 {key:'elderwood-blacksmith',x:935,y:22,w:290,h:290*1024/1536,footY:215},
 {key:'elderwood-portal',x:668,y:390,w:200,h:200*1187/1326,footY:570},
] as const;
type Polygon=readonly (readonly [number,number])[];
// Walkable lawns, roads and stone bridges. Areas outside these outlines are
// forest, cliffs or river. The artwork itself is never sampled for gameplay.
const clearings:readonly Polygon[]=[
 [[700,0],[830,0],[830,185],[890,245],[910,325],[950,335],[950,675],[830,705],[830,1024],[700,1024],[700,710],[580,675],[580,340],[640,325],[650,200],[700,160]],
 [[300,130],[540,130],[590,185],[625,250],[590,325],[585,390],[540,420],[540,555],[590,590],[640,665],[645,830],[560,865],[290,865],[240,815],[240,710],[195,660],[180,570],[185,425],[255,390],[275,310],[275,240]],
 [[950,170],[1200,170],[1260,200],[1340,200],[1380,255],[1380,375],[1350,430],[1380,500],[1340,595],[1250,610],[1210,680],[1200,825],[1100,885],[1030,925],[990,860],[945,830],[925,700],[940,590],[980,555],[990,450],[940,400],[930,310]],
 // Road connections across the eastern plaza edge.
 [[910,310],[1030,310],[1030,360],[910,360]],
 [[910,620],[1030,620],[1030,685],[910,685]],
 // Western gate and bridges; lower bridges end at small clearings, not water.
 [[70,460],[230,420],[280,450],[280,580],[90,590]],
 [[165,220],[245,220],[245,270],[165,270]],
 [[215,350],[305,350],[305,395],[215,395]],
 [[55,725],[255,725],[255,785],[55,785]],
 [[1310,720],[1410,720],[1410,775],[1310,775]],
 [[1300,455],[1460,455],[1460,590],[1300,590]],
];
// Building bases and raised planting beds. Roofs draw above players behind them.
const solids:readonly Polygon[]=[
 [[335,105],[565,105],[565,215],[335,215]],
 [[965,105],[1195,105],[1195,220],[965,220]],
 [[630,365],[700,365],[700,405],[665,425],[665,475],[625,475]],
 [[840,365],[900,365],[910,475],[865,475],[865,415],[835,405]],
 [[625,545],[665,545],[665,580],[700,590],[700,630],[625,630]],
 [[865,550],[910,550],[910,630],[840,630],[840,590],[865,580]],
 [[655,710],[700,710],[700,780],[660,790]],
 [[850,710],[895,710],[915,780],[860,790]],
];
function inside(x:number,y:number,polygon:Polygon){
 let result=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [ax,ay]=polygon[i],[bx,by]=polygon[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result;
 }
 return result;
}
export function elderwoodPositionBlocked(x:number,y:number){
 const px=x*48,py=(y-elderwoodMap.offsetY)*48;
 return !clearings.some(p=>inside(px,py,p))||solids.some(p=>inside(px,py,p));
}
// Tile queries use their centers; movement samples the actual player footprint.
export function elderwoodBlocked(x:number,y:number){return elderwoodPositionBlocked(x+.5,y+.5);}
// Retained for terrain consumers; Elderwood now renders its supplied base PNG.
export type ElderwoodTerrain='grass'|'dirt'|'stone'|'water';
export function elderwoodGround(x:number,y:number):ElderwoodTerrain{
 if(x>=12&&x<=19&&y>=8&&y<=15)return 'stone';
 return 'grass';
}
