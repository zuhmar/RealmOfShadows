import {paintCliffBoulder,cliffStone} from './cliff-rock-art';
import {polygon} from './stone-cliff-art';
import type {StairPart} from './cliff-stair-art';
/** Side flights share the fixed camera: north inner wall is visible; the near lip occludes the floor. */
export function paintSideStairRecess(c:CanvasRenderingContext2D,side:'east'|'west',part:StairPart){
 c.save();c.beginPath();c.rect(0,0,32,32);c.clip();
 c.fillStyle=cliffStone.dark;c.fillRect(0,0,32,32);
 const wall=c.createLinearGradient(0,2,0,13);wall.addColorStop(0,cliffStone.base);wall.addColorStop(1,'#25372f');
 polygon(c,[[0,2],[9,5],[18,3],[26,5],[32,2],[32,13],[0,13]],cliffStone.shadow);c.fillStyle=wall;c.fillRect(0,5,32,7);
 const floor=c.createLinearGradient(0,10,0,26);floor.addColorStop(0,'#152521');floor.addColorStop(1,'#647060');c.fillStyle=floor;c.fillRect(0,11,32,15);
 // Upper rock edge belongs to the same stone field as the cliff, not to a metal stair rail.
 for(const x of [-5,9,23])paintCliffBoulder(c,x,-3,16,10,Math.floor(x));
 const at=(x:number,y:number):readonly[number,number]=>[side==='east'?x:32-x,y];
 for(let i=0;i<4;i++){
  const x=i*8;
  polygon(c,[at(x,14),at(x+6,12),at(x+6,22),at(x,24)],i%2?cliffStone.face:'#a1a99d');
  polygon(c,[at(x+6,12),at(x+8,13),at(x+8,24),at(x+6,22)],side==='east'?'#35483d':'#647265');
  c.strokeStyle=cliffStone.light;c.lineWidth=.7;c.beginPath();c.moveTo(...at(x+.5,14));c.lineTo(...at(x+5.5,12.4));c.stroke();
 }
 // Cast shadows remain on the north wall in both directions instead of rotating with the flight.
 const contact=c.createLinearGradient(0,9,0,15);contact.addColorStop(0,'#0b1917ee');contact.addColorStop(1,'#0b191700');c.fillStyle=contact;c.fillRect(0,9,32,6);
 if(part==='down'){
  const depth=c.createLinearGradient(side==='east'?32:0,0,side==='east'?0:32,0);depth.addColorStop(0,'#10231c00');depth.addColorStop(1,'#071612cc');c.fillStyle=depth;c.fillRect(0,12,32,14);
 }
 // A low foreground lip reveals the height of the cut and hides the lower tread edges.
 polygon(c,[[0,25],[8,26],[16,24],[24,26],[32,25],[32,32],[0,32]],cliffStone.base);
 for(const x of [-6,10,25])paintCliffBoulder(c,x,27,15,10,x+39);
 c.strokeStyle=cliffStone.light;c.lineWidth=.7;c.beginPath();c.moveTo(0,25);c.lineTo(8,26);c.lineTo(16,24);c.lineTo(24,26);c.lineTo(32,25);c.stroke();
 if(part==='top'||part==='single'){
  const x=side==='east'?29:0;c.fillStyle=cliffStone.light;c.fillRect(x,13,3,11);c.fillStyle=cliffStone.shadow;c.fillRect(x,24,3,2);
 }
 c.restore();
}
