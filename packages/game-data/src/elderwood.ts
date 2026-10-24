// Coordinates use the original 1536 × 1024 Elderwood layout.
// Keep the original aspect ratio, centered inside the 32 × 24 tile world.
export const elderwoodMap={width:1536,height:1024,worldWidth:32,worldHeight:64/3,offsetY:4/3};
export const elderwoodObjects=[
 {key:'elderwood-tavern',x:310,y:25,w:280,h:280*1024/1536,footY:210,collision:[[335,105],[565,105],[565,215],[335,215]]},
 {key:'elderwood-blacksmith',x:935,y:22,w:290,h:290*1024/1536,footY:215,collision:[[965,105],[1195,105],[1195,220],[965,220]]},
 {key:'elderwood-portal',x:668,y:390,w:200,h:200*1187/1326,footY:570},
] as const;
type Polygon=readonly (readonly [number,number])[];
// Base-only collision: rivers include their rocky banks; cliff strips follow
// the elevation changes. Grass, flowers and former tree/boulder sites are open.
// Keep placed-object footprints with their placements above, separate from base.
const rivers:readonly Polygon[]=[
 [[95,0],[170,0],[165,70],[215,100],[280,95],[305,140],[275,200],[270,270],[300,320],[315,375],[270,410],[235,440],[155,440],[150,400],[110,405],[80,365],[45,350],[0,300],[0,165],[35,130],[35,65]],
 [[0,590],[100,600],[140,630],[185,650],[215,700],[210,790],[190,825],[185,920],[215,1024],[0,1024]],
 [[1360,120],[1440,150],[1536,170],[1536,430],[1470,420],[1450,375],[1400,350],[1380,300],[1400,260],[1360,220]],
 [[1235,610],[1310,625],[1370,605],[1450,615],[1536,640],[1536,1024],[1340,1024],[1320,965],[1330,900],[1290,850],[1295,785],[1280,740],[1230,710],[1190,675]],
];
const cliffs:readonly Polygon[]=[
 [[175,35],[280,40],[350,10],[430,50],[510,50],[590,85],[675,70],[675,125],[590,140],[510,105],[430,105],[350,70],[280,95],[200,95]],
 [[835,65],[910,95],[1000,55],[1090,0],[1140,15],[1230,65],[1310,50],[1380,80],[1400,130],[1370,170],[1300,130],[1230,135],[1140,95],[1100,65],[1020,100],[910,150],[835,120]],
 [[185,840],[280,865],[380,900],[500,895],[580,880],[675,840],[675,910],[590,950],[500,975],[380,970],[280,940],[200,905]],
 [[835,865],[910,880],[1000,900],[1025,880],[1025,935],[1000,960],[900,940],[835,930]],
 [[1120,880],[1220,850],[1300,875],[1340,925],[1330,970],[1240,925],[1140,945],[1120,935]],
];
// Bridges span the river/bank outlines; their walking decks override base only.
const bridges:readonly Polygon[]=[
 [[115,135],[185,135],[185,175],[115,175]],
 [[165,220],[250,220],[250,275],[165,275]],
 [[215,350],[305,350],[305,395],[215,395]],
 [[55,725],[185,725],[185,780],[55,780]],
 [[1315,720],[1415,720],[1415,780],[1315,780]],
];
// The SVG art generator consumes these same outlines; no separate collision map.
export const elderwoodTerrainGeometry={rivers,cliffs,bridges};
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
 if(px<0||py<0||px>=elderwoodMap.width||py>=elderwoodMap.height)return true;
 const baseBlocked=!bridges.some(p=>inside(px,py,p))&&(rivers.some(p=>inside(px,py,p))||cliffs.some(p=>inside(px,py,p)));
 return baseBlocked||elderwoodObjects.some(object=>'collision' in object&&inside(px,py,object.collision));
}
// Tile queries use their centers; movement samples the actual player footprint.
export function elderwoodBlocked(x:number,y:number){return elderwoodPositionBlocked(x+.5,y+.5);}
// Retained for terrain consumers; Elderwood renders its SVG base.
export type ElderwoodTerrain='grass'|'dirt'|'stone'|'water';
export function elderwoodGround(x:number,y:number):ElderwoodTerrain{
 if(x>=12&&x<=19&&y>=8&&y<=15)return 'stone';
 return 'grass';
}
