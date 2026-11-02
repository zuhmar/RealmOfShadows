import {paintJoinedRockSection,polygon} from './stone-cliff-art';
// The same fractured cliff planes, with the Caverns' violet stone and cool light.
const purple:Readonly<Record<string,string>>={
 '#777967':'#655180','#535f4e':'#3a2d4f','#92937b':'#9781b0','#858b72':'#88709e','#97977d':'#a08cba','#818a70':'#79658e',
 '#5a6352':'#423453','#68715c':'#584568','#6b725e':'#5b466e','#77806a':'#6b557e','#899077':'#907aa5','#7f896e':'#7f6995',
 '#354333a6':'#291d3ca6','#bec0a04a':'#dbc3f34a','#e3dbaf18':'#dcc8ff18','#172d2810':'#24113d10','#172d2855':'#20113155',
 '#f6edc72b':'#ead2ff2b','#102c3445':'#1e0c3845','#e9f2da0d':'#e9dcff0d','#14251e18':'#220e3c18','#647b45':'#64507b','#152c2522':'#190c3022'
};
export function caveWallEdges(cells:number[][],x:number,y:number){
 const open=(dx:number,dy:number)=>cells[y+dy]?.[x+dx]!==undefined&&cells[y+dy][x+dx]!==5;
 return cells[y]?.[x]===5?{north:open(0,-1),east:open(1,0),south:open(0,1),west:open(-1,0)}:undefined;
}
const cache=new Map<string,HTMLCanvasElement>();
function crystal(c:CanvasRenderingContext2D,x:number,y:number,height:number,teal=false){
 const light=teal?'#b5f7ff':'#e3c5ff',mid=teal?'#5ccddd':'#a67ddd',dark=teal?'#276c98':'#59408e';
 polygon(c,[[x,y-height],[x+3,y-height+4],[x+2,y],[x-2,y],[x-3,y-height+4]],mid,'#24223e');
 polygon(c,[[x,y-height],[x,y],[x-2,y],[x-3,y-height+4]],light);polygon(c,[[x,y-height],[x+3,y-height+4],[x+2,y],[x,y]],dark);
 c.strokeStyle=light;c.lineWidth=.6;c.beginPath();c.moveTo(x,y-height+1);c.lineTo(x+2,y-height+4);c.stroke();
}
type Point=readonly[number,number];
/** One top-plane footprint shared by faces and contours; all dimensions are native pixels. */
export function caveCliffTopRect(cells:number[][],x:number,y:number){
 const e=caveWallEdges(cells,x,y);return e?{left:e.west?8:0,right:e.east?24:32,top:0,bottom:e.south?8:32}:undefined;
}
/** Trace closed contours around the union of top planes, including inward turns and holes. */
export function caveCliffContours(cells:number[][]):Point[][]{
 const occupied=new Set<string>(),key=(x:number,y:number)=>`${x},${y}`;
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){
  const r=caveCliffTopRect(cells,x,y);if(!r)continue;
  for(let v=r.top/8;v<r.bottom/8;v++)for(let u=r.left/8;u<r.right/8;u++)occupied.add(key(x*4+u,y*4+v));
 }
 const edges=new Map<string,Point[]>(),add=(x:number,y:number,tx:number,ty:number)=>{const k=key(x,y);edges.set(k,[...(edges.get(k)??[]),[tx,ty]])};
 for(const k of occupied){const[x,y]=k.split(',').map(Number);if(!occupied.has(key(x,y-1)))add(x,y,x+1,y);if(!occupied.has(key(x+1,y)))add(x+1,y,x+1,y+1);if(!occupied.has(key(x,y+1)))add(x+1,y+1,x,y+1);if(!occupied.has(key(x-1,y)))add(x,y+1,x,y);}
 const loops:Point[][]=[];
 while(edges.size){const start=edges.keys().next().value!,[sx,sy]=start.split(',').map(Number);let x=sx,y=sy,dx=1,dy=0;const loop:Point[]=[[x*8,y*8]];
  do{const k=key(x,y),choices=edges.get(k);if(!choices?.length)throw Error('Open cave cliff contour');
   // At a diagonal contact, turn right to keep independent contours separate.
   const priorities=[[ -dy,dx],[dx,dy],[dy,-dx],[-dx,-dy]];
   choices.sort((a,b)=>priorities.findIndex(([px,py])=>a[0]-x===px&&a[1]-y===py)-priorities.findIndex(([px,py])=>b[0]-x===px&&b[1]-y===py));
   const next=choices.shift()!;if(!choices.length)edges.delete(k);dx=next[0]-x;dy=next[1]-y;[x,y]=next;loop.push([x*8,y*8]);
  }while(x!==sx||y!==sy);
  loops.push(loop);
 }
 return loops;
}
function paintTopContours(ctx:CanvasRenderingContext2D,cells:number[][]){
 const layer=document.createElement('canvas');layer.width=ctx.canvas.width;layer.height=ctx.canvas.height;const c=layer.getContext('2d')!;
 c.lineJoin='round';c.lineCap='round';c.beginPath();for(const loop of caveCliffContours(cells)){c.moveTo(...loop[0]);for(const p of loop.slice(1))c.lineTo(...p);c.closePath();}
 c.strokeStyle='#2b1c40';c.lineWidth=6;c.stroke();c.strokeStyle='#806597';c.lineWidth=4;c.stroke();c.strokeStyle='#c2a9d4';c.lineWidth=1;c.stroke();
 // Keep the same rim width inside every top edge, including edges with hidden faces.
 c.globalCompositeOperation='destination-in';c.beginPath();for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){const r=caveCliffTopRect(cells,x,y);if(r)c.rect(x*32+r.left,y*32+r.top,r.right-r.left,r.bottom-r.top);}c.fillStyle='#fff';c.fill();ctx.drawImage(layer,0,0);
}
/** All faces, bevels and crystals stay inside blocked native 32px cells. */
export function paintCavernWalls(ctx:CanvasRenderingContext2D,cells:number[][],atlas?:CanvasImageSource){

 const solid=(x:number,y:number)=>cells[y]?.[x]===5;
 const face=(x:number,y:number,facing:string,section:'top'|'bottom'|'middle',cap=false)=>{
  if(!solid(x,y))return;const side=facing==='east'||facing==='west',variant=(side?y:x)%12,key=`${facing}:${section}:${cap}:${variant}`;let tile=cache.get(key);
  if(!tile){tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d')!;
   if(side){c.translate(16,16);c.rotate(Math.PI/2);c.translate(-16,-16);}
   paintJoinedRockSection(c,variant,facing,section,cap,purple);cache.set(key,tile);
  }
  ctx.save();ctx.beginPath();ctx.rect(x*32+(facing==='east'?24:0),y*32+(facing==='south'?8:0),side?8:32,facing==='south'?24:32);ctx.clip();ctx.drawImage(tile,x*32,y*32);ctx.restore();
 };
 // A visible horizontal rock floor crowns the whole cliff mass.
 // Keep it distinct from the darker vertical faces below its edge.
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++)if(solid(x,y)){
  ctx.save();ctx.translate(x*32,y*32);ctx.beginPath();ctx.rect(0,0,32,32);ctx.clip();
  if(atlas){ctx.drawImage(atlas,2,2,32,32,0,0,32,32);ctx.fillStyle='#b89edba6';ctx.fillRect(0,0,32,32);}
  else{ctx.fillStyle='#8b78a6';ctx.fillRect(0,0,32,32);}
  ctx.restore();
 }
 // A single vertical edge sits below the top floor, never a stack of faces.
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){
  const e=caveWallEdges(cells,x,y);if(!e)continue;
  if(e.west)face(x,y,'west','middle');if(e.east)face(x,y,'east','middle');if(e.south)face(x,y,'south','bottom');
 }
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){
  const edges=caveWallEdges(cells,x,y);if(!edges)continue;
  ctx.save();ctx.translate(x*32,y*32);ctx.beginPath();ctx.rect(0,0,32,32);ctx.clip();
  if(Object.values(edges).some(Boolean)&&(x*19+y*31)%5===0){crystal(ctx,12,25,12,(x+y)%2===0);crystal(ctx,19,27,8,(x+y)%2!==0);}
  ctx.restore();

 }
 paintTopContours(ctx,cells);
}
