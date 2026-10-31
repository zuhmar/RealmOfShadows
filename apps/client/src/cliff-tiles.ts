import {paintRecessedStair,paintRockFace,paintJoinedRockSection,polygon} from './stone-cliff-art';
/** Fixed native 32×32 cliff parts. Larger cliffs repeat parts, never resize artwork. */
export const CLIFF_TILE_SIZE=32;
export type CliffPart='face-top'|'face-bottom'|'face-middle'|'north'|'south'|'east'|'west'|'nw'|'ne'|'sw'|'se'|'stairs-north'|'stairs-south'|'stairs-east'|'stairs-west';
export type CliffFacing='north'|'south'|'east'|'west';
const cache=new Map<string,HTMLCanvasElement>();
export function paintCliffTile(ctx:CanvasRenderingContext2D,x:number,y:number,part:CliffPart,village=false,variant=0,facing:CliffFacing='south',section?:'top'|'bottom',cap=true){
 const key=`${part}:${village}:${variant%3}:${facing}:${section??''}:${cap}`;let tile=cache.get(key);
 if(!tile){
  tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d')!;
  if(part.startsWith('stairs-')){
   c.translate(16,16);c.rotate(({north:0,south:Math.PI,east:Math.PI/2,west:-Math.PI/2} as Record<string,number>)[part.slice(7)]);c.translate(-16,-16);paintRecessedStair(c,0,0);
  }else{
   const band=section??(part==='face-top'?'top':part==='face-bottom'?'bottom':part==='face-middle'?'middle':undefined);
   if(band)paintJoinedRockSection(c,variant,facing,band,cap);else paintRockFace(c,variant,facing);
   const edge=(side:string)=>{
    const horizontal=side==='north'||side==='south',near=side==='north'||side==='west',pos=near?0:24;
    for(let i=0;i<8;i++){
     const depth=near?i:7-i;
     c.fillStyle=depth===0?'#34483b':depth===1?'#6b725e':depth<6?'#a2a17b':'#677f46';
     if(horizontal)c.fillRect(0,pos+i,32,1);else c.fillRect(pos+i,0,1,32);
    }
   };
   if(['north','south','east','west'].includes(part))edge(part);
   if(['nw','ne','sw','se'].includes(part)){
    const west=part.endsWith('w');
    // Finished side plane continues through the top/bottom face sections.
    polygon(c,west?[[0,0],[6,3],[6,32],[0,32]]:[[32,0],[26,3],[26,32],[32,32]],west?'#b2b29466':'#233b3c77');
    c.strokeStyle=west?'#b6b79b':'#2e4137';c.lineWidth=1;c.beginPath();c.moveTo(west?.5:31.5,0);c.lineTo(west?.5:31.5,32);c.stroke();
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

/** Connected contour: cardinal shoulders plus four convex and four concave corners. */
export function paintCliffContour(ctx:CanvasRenderingContext2D,x:number,y:number,has:(x:number,y:number)=>boolean,village=false){
 for(const[dx,dy,side]of [[0,-1,'north'],[1,0,'east'],[0,1,'south'],[-1,0,'west']] as const)if(!has(x+dx,y+dy))paintCliffRim(ctx,x*32,y*32,side,village);
 for(const[dx,dy]of [[-1,-1],[1,-1],[-1,1],[1,1]] as const){
  const a=has(x+dx,y),b=has(x,y+dy),convex=!a&&!b,concave=a&&b&&!has(x+dx,y+dy);
  if(!convex&&!concave)continue;
  ctx.save();ctx.translate(x*32+(dx<0?0:32),y*32+(dy<0?0:32));ctx.scale(dx<0?1:-1,dy<0?1:-1);
  ctx.beginPath();ctx.rect(0,0,8,8);ctx.clip();
  const cx=convex?8:0,cy=convex?8:0;
  if(convex){ctx.fillStyle='#34483b';ctx.fillRect(0,0,8,8);}
  const sector=(r:number,fill:string)=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,convex?Math.PI:0,convex?Math.PI*1.5:Math.PI/2);ctx.closePath();ctx.fillStyle=fill;ctx.fill();};
  sector(8,'#6b725e');sector(6,'#a2a17b');sector(2,convex?'#677f46':'#34483b');
  ctx.strokeStyle=convex?'#34483b':'#93a56c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,7.5,convex?Math.PI:0,convex?Math.PI*1.5:Math.PI/2);ctx.stroke();ctx.restore();
 }
}
