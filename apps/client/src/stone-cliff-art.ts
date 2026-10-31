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
