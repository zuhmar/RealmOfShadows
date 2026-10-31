import {paintRecessedStair,paintRockFace,polygon} from './stone-cliff-art';
/** Fixed native 32×32 cliff parts. Larger cliffs repeat parts, never resize artwork. */
export const CLIFF_TILE_SIZE=32;
export type CliffPart='face-top'|'face-bottom'|'north'|'south'|'east'|'west'|'nw'|'ne'|'sw'|'se'|'stairs-north'|'stairs-south'|'stairs-east'|'stairs-west';
export type CliffFacing='north'|'south'|'east'|'west';
const cache=new Map<string,HTMLCanvasElement>();
export function paintCliffTile(ctx:CanvasRenderingContext2D,x:number,y:number,part:CliffPart,village=false,variant=0,facing:CliffFacing='south'){
 const key=`${part}:${village}:${variant%3}:${facing}`;let tile=cache.get(key);
 if(!tile){
  tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d')!;
  if(part.startsWith('stairs-')){
   c.translate(16,16);c.rotate(({north:0,south:Math.PI,east:Math.PI/2,west:-Math.PI/2} as Record<string,number>)[part.slice(7)]);c.translate(-16,-16);paintRecessedStair(c,0,0);
  }else{
   paintRockFace(c,variant,facing,part==='face-top');
   if(part==='face-bottom'){c.fillStyle='#152c2533';c.fillRect(0,29,32,3);}
   const edge=(side:string)=>{
    const near=side==='north'||side==='west',horizontal=side==='north'||side==='south',pos=near?0:24;
    c.fillStyle=near?'#a2a17b':'#515b44';if(horizontal)c.fillRect(0,pos,32,8);else c.fillRect(pos,0,8,32);
    c.fillStyle='#687d47';if(horizontal)c.fillRect(0,pos,32,4);else c.fillRect(pos,0,4,32);
    c.fillStyle=near?'#b4ba8c':'#8f9a6c';if(horizontal)c.fillRect(0,pos,32,1);else c.fillRect(pos,0,1,32);
   };
   if(['north','south','east','west'].includes(part))edge(part);
   if(['nw','ne','sw','se'].includes(part)){
    const west=part.endsWith('w'),north=part.startsWith('n');
    polygon(c,[[west?0:32,north?0:32],[west?0:32,16],[16,north?0:32]],west?'#b2b29466':'#233b3c55');
   }
  }
  cache.set(key,tile);
 }
 ctx.drawImage(tile,x,y);
}
/** Rock and turf shoulders overlay grass without resizing either tile. */
export function paintCliffRim(ctx:CanvasRenderingContext2D,x:number,y:number,side:CliffFacing,village=false){
 ctx.save();ctx.beginPath();if(side==='north')ctx.rect(x,y,32,8);if(side==='south')ctx.rect(x,y+24,32,8);if(side==='west')ctx.rect(x,y,8,32);if(side==='east')ctx.rect(x+24,y,8,32);ctx.clip();paintCliffTile(ctx,x,y,side,village);ctx.restore();
}
