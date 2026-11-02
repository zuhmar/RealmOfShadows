import {polygon} from './stone-cliff-art';
// Native cave faces use broad rounded fractures, with one continuous field per facing.
const faceFields=new Map<string,HTMLCanvasElement>();
const variation=(x:number,y:number)=>{let n=Math.imul(x+83,374761393)^Math.imul(y+41,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
function caveFaceField(facing:string){
 let field=faceFields.get(facing);if(field)return field;
 field=document.createElement('canvas');field.width=384;field.height=64;const c=field.getContext('2d')!;c.fillStyle='#564360';c.fillRect(0,0,384,64);
 for(let row=-1;row<4;row++)for(let col=-1;col<13;col++){
  const repeat=((col%12)+12)%12,n=variation(repeat,row),x=col*32+(row%2)*17+(n-.5)*8,y=row*24+(variation(repeat+17,row)-.5)*7,w=31+n*12,h=22+variation(repeat,row+71)*8;
  const points:Point[]=[[x+5,y+2],[x+w*.6,y],[x+w-2,y+5],[x+w,y+h*.6],[x+w-7,y+h],[x+w*.3,y+h+1],[x,y+h-5],[x-2,y+7]];
  c.beginPath();for(let i=0;i<points.length;i++){const prev=points[(i+points.length-1)%points.length],v=points[i],next=points[(i+1)%points.length],start=[(prev[0]+v[0])/2,(prev[1]+v[1])/2];if(i===0)c.moveTo(start[0],start[1]);c.quadraticCurveTo(v[0],v[1],(v[0]+next[0])/2,(v[1]+next[1])/2);}c.closePath();
  const tone=c.createLinearGradient(x,y,x+w*.35,y+h);tone.addColorStop(0,n>.5?'#8a739b':'#816b92');tone.addColorStop(1,n>.5?'#665171':'#604b6c');c.fillStyle=tone;c.fill();c.strokeStyle='#49365399';c.lineWidth=.85;c.stroke();
  c.strokeStyle='#b59ac344';c.lineWidth=.65;c.beginPath();c.moveTo(x+7,y+4);c.quadraticCurveTo(x+w*.4,y+1,x+w*.65,y+3);c.stroke();
 }
 const shade=c.createLinearGradient(0,0,0,64);shade.addColorStop(0,'#c4a8db0d');shade.addColorStop(1,'#24163155');c.fillStyle=shade;c.fillRect(0,0,384,64);c.fillStyle=facing==='east'?'#261c3b2b':facing==='west'?'#d0b4e010':'#20142d14';c.fillRect(0,0,384,64);faceFields.set(facing,field);return field;
}
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
 const e=caveWallEdges(cells,x,y);return e?{left:e.west?12:0,right:e.east?20:32,top:0,bottom:e.south?8:32}:undefined;
}
/** Trace closed contours around the union of top planes, including inward turns and holes. */
export function caveCliffContours(cells:number[][]):Point[][]{
 const occupied=new Set<string>(),key=(x:number,y:number)=>`${x},${y}`;
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){
  const r=caveCliffTopRect(cells,x,y);if(!r)continue;
  for(let v=r.top/4;v<r.bottom/4;v++)for(let u=r.left/4;u<r.right/4;u++)occupied.add(key(x*8+u,y*8+v));
 }
 const edges=new Map<string,Point[]>(),add=(x:number,y:number,tx:number,ty:number)=>{const k=key(x,y);edges.set(k,[...(edges.get(k)??[]),[tx,ty]])};
 for(const k of occupied){const[x,y]=k.split(',').map(Number);if(!occupied.has(key(x,y-1)))add(x,y,x+1,y);if(!occupied.has(key(x+1,y)))add(x+1,y,x+1,y+1);if(!occupied.has(key(x,y+1)))add(x+1,y+1,x,y+1);if(!occupied.has(key(x-1,y)))add(x,y+1,x,y);}
 const loops:Point[][]=[];
 while(edges.size){const start=edges.keys().next().value!,[sx,sy]=start.split(',').map(Number);let x=sx,y=sy,dx=1,dy=0;const loop:Point[]=[[x*4,y*4]];
  do{const k=key(x,y),choices=edges.get(k);if(!choices?.length)throw Error('Open cave cliff contour');
   // At a diagonal contact, turn right to keep independent contours separate.
   const priorities=[[ -dy,dx],[dx,dy],[dy,-dx],[-dx,-dy]];
   choices.sort((a,b)=>priorities.findIndex(([px,py])=>a[0]-x===px&&a[1]-y===py)-priorities.findIndex(([px,py])=>b[0]-x===px&&b[1]-y===py));
   const next=choices.shift()!;if(!choices.length)edges.delete(k);dx=next[0]-x;dy=next[1]-y;[x,y]=next;loop.push([x*4,y*4]);
  }while(x!==sx||y!==sy);
  loops.push(loop);
 }
 return loops;
}
function paintTopContours(ctx:CanvasRenderingContext2D,cells:number[][]){
 const layer=document.createElement('canvas');layer.width=ctx.canvas.width;layer.height=ctx.canvas.height;const c=layer.getContext('2d')!;
 c.lineJoin='round';c.lineCap='round';c.beginPath();for(const loop of caveCliffContours(cells)){c.moveTo(...loop[0]);for(const p of loop.slice(1))c.lineTo(...p);c.closePath();}
 c.strokeStyle='#3f2c50';c.lineWidth=6;c.stroke();c.strokeStyle='#79618e';c.lineWidth=4;c.stroke();c.strokeStyle='#ad93c0aa';c.lineWidth=1;c.stroke();
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
   c.drawImage(caveFaceField(facing),variant*32,section==='bottom'?32:16,32,32,0,0,32,32);cache.set(key,tile);
  }
  ctx.save();ctx.beginPath();ctx.rect(x*32+(facing==='east'?20:0),y*32+(facing==='south'?8:0),side?12:32,facing==='south'?24:32);ctx.clip();ctx.drawImage(tile,x*32,y*32);ctx.restore();
 };
 // A visible horizontal rock floor crowns the whole cliff mass.
 // Keep it distinct from the darker vertical faces below its edge.
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++)if(solid(x,y)){
  ctx.save();ctx.translate(x*32,y*32);ctx.beginPath();ctx.rect(0,0,32,32);ctx.clip();
  if(atlas){ctx.drawImage(atlas,2,2,32,32,0,0,32,32);ctx.fillStyle='#9072af99';ctx.fillRect(0,0,32,32);}
  else{ctx.fillStyle='#756088';ctx.fillRect(0,0,32,32);}
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
