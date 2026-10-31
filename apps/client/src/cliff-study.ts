/** North entrance art study: one-cell stairs cut into a joined cap and rock face.
 * Artwork only: shared floor coordinates, collision and housing are unchanged.
 */
import {elderwoodRimStairs} from '@realm/game-data';
const stair=elderwoodRimStairs.find(s=>s.id==='north')!;
export const cliffStudy={x:Math.floor(stair.x)-3,y:Math.floor(stair.y)-2,width:7,height:3,stairX:Math.floor(stair.x),stairY:Math.floor(stair.y)-1};
type Point=readonly[number,number];
function polygon(c:CanvasRenderingContext2D,points:readonly Point[],fill:string,stroke?:string){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}}
/** Complete reference-inspired flight, with the cutout and side cheeks inside ONE tile. */
export function paintRecessedStair(c:CanvasRenderingContext2D,x:number,y:number){
 c.save();c.translate(x,y);c.beginPath();c.rect(0,0,32,32);c.clip();
 // The dark opening belongs to the cliff; it is not a freestanding stair icon.
 polygon(c,[[4,0],[28,0],[30,32],[2,32]],'#222921');
 polygon(c,[[26,0],[28,0],[30,32],[27,32]],'#5b5948');
 for(let i=0;i<6;i++){
  const sx=6-i*.4,sy=i*5,w=20+i*.8;
  polygon(c,[[sx,sy+2.7],[sx+w,sy+2.7],[sx+w+1.3,sy+5],[sx+1.3,sy+5]],'#655c43');
  polygon(c,[[sx+w,sy],[sx+w+1.3,sy+2.7],[sx+w+1.3,sy+5],[sx+w,sy+2.7]],'#a29a75');
  polygon(c,[[sx,sy],[sx+w,sy],[sx+w+1.3,sy+2.7],[sx+1.3,sy+2.7]],i%2?'#ded5a7':'#e8dfb4');
  c.strokeStyle='#fff1c6';c.lineWidth=.65;c.beginPath();c.moveTo(sx+.3,sy+.4);c.lineTo(sx+w-.3,sy+.4);c.stroke();
  // Recessed seams and a restrained chip avoid a flat ladder of identical bars.
  c.fillStyle='#b1a77e';if(i===1||i===4)c.fillRect(sx+5+i,sy+1,1.4,.7);
 }
 polygon(c,[[4,0],[6,0],[4,32],[2,32]],'#a09d7c');
 c.strokeStyle='#d0c5a0';c.lineWidth=1;c.beginPath();c.moveTo(4.5,1);c.lineTo(2.5,30);c.stroke();
 c.restore();
}
/** Native cap and face parts: broad fractured planes rather than horizontal brick courses. */
export function paintCliffStudy(c:CanvasRenderingContext2D,atlas:CanvasImageSource,upper=false){
 const {x,y,width,stairX,stairY}=cliffStudy;
 c.save();c.beginPath();c.rect(x*32,y*32,width*32,64);c.clip();
 for(let i=0;i<width;i++){
  const px=(x+i)*32,py=y*32,q=(i%3-1)*2;
  c.save();c.translate(px,py);
  // Grass is the horizontal plane; the last 10px roll into the stone shoulder.
  c.drawImage(atlas,2,2,32,32,0,0,32,32);
  polygon(c,[[0,24],[9,22],[18,25],[25,22],[32,24],[32,36],[0,36]],'#a2a17b');
  polygon(c,[[0,29],[9,26],[18,29],[26,26],[32,29],[32,34],[0,35]],'#525b44');
  // Continuous full-height vertical plane; no horizontal mortar-like grid.
  const face=c.createLinearGradient(0,30,0,64);face.addColorStop(0,'#888775');face.addColorStop(.3,'#777967');face.addColorStop(1,'#454c40');c.fillStyle=face;c.fillRect(0,32,32,32);
  polygon(c,[[0,32],[12+q,33],[9+q,45],[4,50],[0,48]],'#97977d');
  polygon(c,[[12+q,33],[24,30],[29,41+q],[22,52],[10+q,49],[9+q,45]],['#858775','#96947b','#8a8b72'][i%3]);
  polygon(c,[[24,32],[32,32],[32,57],[25,61],[22,52],[29,41+q]],'#5a6352');
  polygon(c,[[0,48],[4,50],[10+q,49],[22,52],[25,61],[13,59],[6,62],[0,59]],'#6b725e');
  polygon(c,[[0,59],[6,62],[13,59],[25,61],[32,57],[32,64],[0,64]],'#3b4639');
  c.strokeStyle='#303c32';c.lineWidth=.8;c.beginPath();c.moveTo(12+q,33);c.lineTo(9+q,45);c.lineTo(10+q,49);c.lineTo(22,52);c.lineTo(25,61);c.stroke();
  c.strokeStyle='#bec0a0';c.lineWidth=.7;c.beginPath();c.moveTo(1,33);c.lineTo(11+q,34);c.lineTo(8+q,43);c.stroke();
  const shade=c.createLinearGradient(0,32,25,64);shade.addColorStop(0,'#fff1b31c');shade.addColorStop(.5,'#ffffff00');shade.addColorStop(1,'#172d284d');c.fillStyle=shade;c.fillRect(0,32,32,32);
  // Turf overhang and a narrow occlusion shadow connect top to vertical face.
  polygon(c,[[0,21],[7,22],[11,19],[16,22],[22,20],[27,23],[32,21],[32,27],[26,28],[21,25],[15,27],[9,24],[4,26],[0,25]],'#647b45');
  c.strokeStyle='#93a56c';c.lineWidth=1;c.beginPath();c.moveTo(0,21);c.lineTo(7,22);c.lineTo(11,19);c.lineTo(16,22);c.lineTo(22,20);c.lineTo(27,23);c.lineTo(32,21);c.stroke();
  c.restore();
 }
 // A stone landing meets the very top of the recessed flight: no rock blocking its head.
 const sx=stairX*32,sy=stairY*32;
 c.drawImage(atlas,2*36+2,2,32,32,sx,sy-32,32,32);
 c.fillStyle='#bab490';c.fillRect(sx+2,sy-5,23,5);c.fillStyle='#e3d9ad';c.fillRect(sx+2,sy-5,23,1);
 paintRecessedStair(c,sx,sy);
 c.restore();
 // Ground contact shadow is broken at the open stair foot.
 for(let i=0;i<width;i++)if(x+i!==stairX){c.fillStyle='#182e233b';c.fillRect((x+i)*32,(y+2)*32,32,2);}
 if(upper){
  // Downward stair mouth on the upper interaction tile; the flight is in the face below.
  const ux=Math.floor(stair.top.x)*32,uy=Math.floor(stair.top.y)*32;
  c.fillStyle='#424b36';c.fillRect(ux+4,uy+23,24,9);c.fillStyle='#c3bc94';c.fillRect(ux+4,uy+23,24,2);c.fillStyle='#7f8062';c.fillRect(ux+5,uy+27,22,2);
 }
}
