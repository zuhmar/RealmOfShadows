import {paintCliffBoulder,cliffStone} from './cliff-rock-art';
import {polygon} from './stone-cliff-art';
import type {StairFacing} from './cliff-stair-layout';
export type StairPart='single'|'bottom'|'middle'|'top'|'down';
const sprites=new Map<string,HTMLCanvasElement>();
/** Direction changes the stone geometry, while highlights and risers keep a fixed screen light. */
export function cliffStairSprite(side:StairFacing,part:StairPart){
 const key=`${side}:${part}`;let sprite=sprites.get(key);if(sprite)return sprite;
 sprite=document.createElement('canvas');sprite.width=sprite.height=32;const c=sprite.getContext('2d')!;
 const at=(u:number,v:number):readonly[number,number]=>side==='north'?[u,v]:side==='south'?[32-u,32-v]:side==='east'?[32-v,u]:[v,32-u];
 const shape=(points:readonly (readonly[number,number])[],ink:string)=>polygon(c,points.map(([u,v])=>at(u,v)),ink);
 shape([[0,0],[32,0],[32,32],[0,32]],cliffStone.dark);
 // A deep recess joins directly to the boulder shoulders, rather than sitting over them.
 shape([[6,0],[26,0],[26,32],[6,32]],'#252e2d');
 // Four broad treads per native cell. Interior sections meet without another end cap.
 for(let i=0;i<4;i++){
  const v=i*8,down=part==='down',ink=down?[cliffStone.face,cliffStone.base,cliffStone.shadow,cliffStone.dark][i]:i%2?'#a4aaa0':'#929a92';
  const a=at(5,v),b=at(27,v),d=at(6.3,v+5.5),e=at(28.3,v+5.5);
  polygon(c,[a,b,e,d],ink);
  const edgeA=at(6.3,v+5.5),edgeB=at(28.3,v+5.5);
  polygon(c,[edgeA,edgeB,[edgeB[0]+1.3,edgeB[1]+2.5],[edgeA[0]+1.3,edgeA[1]+2.5]],down&&i>1?'#263c32':cliffStone.shadow);
  c.strokeStyle=down&&i>1?'#6b725e':cliffStone.light;c.lineWidth=.7;c.beginPath();c.moveTo(a[0]+.4,a[1]+.4);c.lineTo(b[0]-.4,b[1]+.4);c.stroke();
  // Chips and broken seams share the fractured cliff's scale rather than a polished marble finish.
  if(i===1||i===3){const chip=at(7+(i%2)*2,v+2);c.strokeStyle='#68715c';c.lineWidth=.65;c.beginPath();c.moveTo(chip[0],chip[1]);c.lineTo(chip[0]+2,chip[1]+1);c.stroke();}
 }
 // Rock cheeks are part of the opening. They share the face material and have no straight rail.
 for(const u of [0,26])for(let i=0;i<4;i++){
  const p=at(u,i*9-2);c.save();
  // Keep lighting fixed even on east/west views; no rotated rock texture.
  const horizontal=side==='east'||side==='west';
  paintCliffBoulder(c,horizontal?p[0]-7:p[0]-1,horizontal?p[1]-1:p[1]-2,horizontal?12:8,horizontal?8:13,i+u);
  c.restore();
 }
 const light=c.createLinearGradient(0,0,32,32);light.addColorStop(0,'#fff1b32a');light.addColorStop(1,'#172d2838');c.save();c.globalCompositeOperation='source-atop';c.fillStyle=light;c.fillRect(0,0,32,32);c.restore();
 if(part==='top'||part==='single'||part==='down')shape([[1,0],[31,0],[27,2],[5,2]],cliffStone.light);
 if(part==='bottom'||part==='single')shape([[1,31],[31,31],[29,32],[3,32]],'#354333');
 sprites.set(key,sprite);return sprite;
}
