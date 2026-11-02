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
 shape([[2,0],[30,0],[30,32],[2,32]],part==='down'?'#263c32':'#535f4e');
 // Four broad treads per native cell. Interior sections meet without another end cap.
 for(let i=0;i<4;i++){
  const v=i*8,down=part==='down',ink=down?['#97977d','#858b72','#68715c','#354333'][i]:i%2?'#97977d':'#92937b';
  const a=at(5,v),b=at(27,v),d=at(5,v+5.5),e=at(27,v+5.5);
  polygon(c,[a,b,e,d],ink);
  const edgeA=at(5,v+5.5),edgeB=at(27,v+5.5);
  polygon(c,[edgeA,edgeB,[edgeB[0]+1.3,edgeB[1]+2.5],[edgeA[0]+1.3,edgeA[1]+2.5]],down&&i>1?'#263c32':'#535f4e');
  c.strokeStyle=down&&i>1?'#6b725e':'#bec0a0';c.lineWidth=.7;c.beginPath();c.moveTo(a[0]+.4,a[1]+.4);c.lineTo(b[0]-.4,b[1]+.4);c.stroke();
  // Chips and broken seams share the fractured cliff's scale rather than a polished marble finish.
  if(i===1||i===3){const chip=at(7+(i%2)*2,v+2);c.strokeStyle='#68715c';c.lineWidth=.65;c.beginPath();c.moveTo(chip[0],chip[1]);c.lineTo(chip[0]+2,chip[1]+1);c.stroke();}
 }
 shape([[1,0],[5,0],[5,32],[1,32]],side==='west'?'#97977d':'#858b72');
 shape([[27,0],[31,0],[31,32],[27,32]],'#5a6352');
 // Fractured cheek stones tie the stair shoulders into the surrounding rock.
 for(const v of [6,21]){shape([[1,v],[5,v+2],[4,v+7],[1,v+5]],'#97977d');shape([[27,v+3],[31,v],[31,v+8],[28,v+10]],'#354333');}
 const light=c.createLinearGradient(0,0,32,32);light.addColorStop(0,'#fff1b32a');light.addColorStop(1,'#172d2838');c.save();c.globalCompositeOperation='source-atop';c.fillStyle=light;c.fillRect(0,0,32,32);c.restore();
 if(part==='top'||part==='single'||part==='down')shape([[1,0],[31,0],[27,2],[5,2]],'#bec0a0');
 if(part==='bottom'||part==='single')shape([[1,31],[31,31],[29,32],[3,32]],'#354333');
 sprites.set(key,sprite);return sprite;
}
