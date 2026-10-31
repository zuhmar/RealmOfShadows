type Point=readonly[number,number];
export function polygon(c:CanvasRenderingContext2D,points:readonly Point[],fill:string,stroke?:string){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}}
/** Complete reference-inspired flight, with the cutout and side cheeks inside ONE tile. */
export function paintRecessedStair(c:CanvasRenderingContext2D,x:number,y:number){
 c.save();c.translate(x,y);c.beginPath();c.rect(0,0,32,32);c.clip();
 // The dark opening belongs to the cliff; it is not a freestanding stair icon.
 polygon(c,[[4,0],[28,0],[30,32],[2,32]],'#222921');
 polygon(c,[[26,0],[28,0],[30,32],[27,32]],'#515b61');
 for(let i=0;i<6;i++){
  const sx=6-i*.4,sy=i*5,w=20+i*.8;
  polygon(c,[[sx,sy+2.7],[sx+w,sy+2.7],[sx+w+1.3,sy+5],[sx+1.3,sy+5]],'#59666e');
  polygon(c,[[sx+w,sy],[sx+w+1.3,sy+2.7],[sx+w+1.3,sy+5],[sx+w,sy+2.7]],'#87969c');
  polygon(c,[[sx,sy],[sx+w,sy],[sx+w+1.3,sy+2.7],[sx+1.3,sy+2.7]],i%2?'#b9c6ca':'#c8d2d4');
  c.strokeStyle='#edf3f2';c.lineWidth=.65;c.beginPath();c.moveTo(sx+.3,sy+.4);c.lineTo(sx+w-.3,sy+.4);c.stroke();
  // Recessed seams and a restrained chip avoid a flat ladder of identical bars.
  c.fillStyle='#8e9ea4';if(i===1||i===4)c.fillRect(sx+5+i,sy+1,1.4,.7);
 }
 polygon(c,[[4,0],[6,0],[4,32],[2,32]],'#929fa3');
 c.strokeStyle='#cbd6d8';c.lineWidth=1;c.beginPath();c.moveTo(4.5,1);c.lineTo(2.5,30);c.stroke();
 c.restore();
}

/** Approved fractured rock planes, rendered as a native cell with fixed upper-left light. */
export function paintRockFace(c:CanvasRenderingContext2D,variant=0,facing='south',cap=false){
 const q=(variant%3-1)*2;
 c.save();c.translate(0,-32);
  // Continuous full-height vertical plane; no horizontal mortar-like grid.
  const face=c.createLinearGradient(0,30,0,64);face.addColorStop(0,'#888775');face.addColorStop(.3,'#777967');face.addColorStop(1,'#454c40');c.fillStyle=face;c.fillRect(0,32,32,32);
  polygon(c,[[0,32],[12+q,33],[9+q,45],[4,50],[0,48]],'#97977d');
  polygon(c,[[12+q,33],[24,30],[29,41+q],[22,52],[10+q,49],[9+q,45]],['#858775','#96947b','#8a8b72'][variant%3]);
  polygon(c,[[24,32],[32,32],[32,57],[25,61],[22,52],[29,41+q]],'#5a6352');
  polygon(c,[[0,48],[4,50],[10+q,49],[22,52],[25,61],[13,59],[6,62],[0,59]],'#6b725e');
  polygon(c,[[0,59],[6,62],[13,59],[25,61],[32,57],[32,64],[0,64]],'#3b4639');
  c.strokeStyle='#303c32';c.lineWidth=.8;c.beginPath();c.moveTo(12+q,33);c.lineTo(9+q,45);c.lineTo(10+q,49);c.lineTo(22,52);c.lineTo(25,61);c.stroke();
  c.strokeStyle='#bec0a0';c.lineWidth=.7;c.beginPath();c.moveTo(1,33);c.lineTo(11+q,34);c.lineTo(8+q,43);c.stroke();
  const shade=c.createLinearGradient(0,32,25,64);shade.addColorStop(0,'#fff1b31c');shade.addColorStop(.5,'#ffffff00');shade.addColorStop(1,'#172d284d');c.fillStyle=shade;c.fillRect(0,32,32,32);

 c.restore();
 c.fillStyle=facing==='west'?'#f6edc72b':facing==='east'?'#102c3445':facing==='north'?'#e9f2da0d':'#14251e18';c.fillRect(0,0,32,32);
 if(cap){
  polygon(c,[[0,0],[32,0],[32,4],[26,7],[21,4],[15,6],[9,3],[4,5],[0,4]],'#677f46');
  c.strokeStyle='#a5b27b';c.lineWidth=1;c.beginPath();c.moveTo(0,.5);c.lineTo(32,.5);c.stroke();
  c.strokeStyle='#303e2d';c.beginPath();c.moveTo(0,5);c.lineTo(9,4);c.lineTo(15,7);c.lineTo(23,5);c.lineTo(32,6);c.stroke();
 }
}

const rockFields=new Map<string,HTMLCanvasElement>();
const noise=(x:number,y:number)=>{let n=Math.imul(x+271,374761393)^Math.imul(y+117,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
/** A shared fracture field crosses native cell seams, with the approved stone palette and scale. */
export function paintJoinedRockSection(c:CanvasRenderingContext2D,variant:number,facing:string,section:'top'|'bottom'|'middle',cap=true){
 let field=rockFields.get(facing);
 if(!field){
  field=document.createElement('canvas');field.width=384;field.height=64;const g=field.getContext('2d')!;
  g.fillStyle='#777967';g.fillRect(0,0,384,64);
  const point=(col:number,row:number):Point=>[col*22+(row%2)*9+(noise(col,row)-.5)*12,row*18-10+(noise(col+99,row)-.5)*12];
  for(let row=0;row<5;row++)for(let col=-2;col<19;col++){
   const a=point(col,row),b=point(col+1,row),d=point(col,row+1),e=point(col+1,row+1),n=noise(col+17,row+21);
   const between=(p:Point,q:Point,t:number):Point=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
   const tl=between(a,b,.1),tr=between(a,b,.85),right=between(b,e,.5),foot=between(e,d,.22),left=between(d,a,.6);
   polygon(g,[a,b,e,d],'#535f4e');
   polygon(g,[tl,tr,right,foot,left],['#92937b','#858b72','#97977d','#818a70'][Math.floor(n*4)]);
   polygon(g,[tr,b,e,foot,right],n>.6?'#5a6352':'#68715c');
   polygon(g,[left,foot,e,d],n>.3?'#6b725e':'#77806a');
   polygon(g,[a,tl,left,d],n>.45?'#899077':'#7f896e');
   g.strokeStyle='#354333a6';g.lineWidth=.7;g.beginPath();g.moveTo(...a);g.lineTo(...d);g.lineTo(...e);g.stroke();
   g.strokeStyle='#bec0a04a';g.lineWidth=.65;g.beginPath();g.moveTo(a[0]+1,a[1]+1);g.lineTo(b[0]-2,b[1]+1);g.stroke();
  }
  const shade=g.createLinearGradient(0,0,0,64);shade.addColorStop(0,'#e3dbaf18');shade.addColorStop(.5,'#172d2810');shade.addColorStop(1,'#172d2855');g.fillStyle=shade;g.fillRect(0,0,384,64);
  g.fillStyle=facing==='west'?'#f6edc72b':facing==='east'?'#102c3445':facing==='north'?'#e9f2da0d':'#14251e18';g.fillRect(0,0,384,64);rockFields.set(facing,field);
 }
 const v=((variant%12)+12)%12;
 c.drawImage(field,v*32,section==='top'?0:section==='bottom'?32:16,32,32,0,0,32,32);
 if(section==='top'&&cap){
  polygon(c,[[0,0],[32,0],[32,3],[26,4],[21,2],[15,4],[9,2],[4,4],[0,3]],'#647b45');
 }else if(section==='bottom'){c.fillStyle='#152c2522';c.fillRect(0,30,32,2);}
}
