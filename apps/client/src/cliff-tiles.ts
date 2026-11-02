import {cliffStairSprite} from './cliff-stair-art';
import {paintRockFace,paintJoinedRockSection,polygon} from './stone-cliff-art';
/** Fixed native 32×32 cliff parts. Larger cliffs repeat parts, never resize artwork. */
export const CLIFF_TILE_SIZE=32;
export type CliffPart='face-top'|'face-bottom'|'face-middle'|'north'|'south'|'east'|'west'|'nw'|'ne'|'sw'|'se'|'stairs-north'|'stairs-south'|'stairs-east'|'stairs-west';
export type CliffFacing='north'|'south'|'east'|'west';
const cache=new Map<string,HTMLCanvasElement>();
export function paintCliffTile(ctx:CanvasRenderingContext2D,x:number,y:number,part:CliffPart,village=false,variant=0,facing:CliffFacing='south',section?:'top'|'bottom',cap=true){
 const key=`${part}:${village}:${variant%12}:${facing}:${section??''}:${cap}`;let tile=cache.get(key);
 if(!tile){
  tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d')!;
  if(part.startsWith('stairs-')){
   c.drawImage(cliffStairSprite(part.slice(7) as CliffFacing,'single'),0,0);
  }else{
   const band=section??(part==='face-top'?'top':part==='face-bottom'?'bottom':part==='face-middle'?'middle':undefined);
   if(band)paintJoinedRockSection(c,variant,facing,band,cap);else paintRockFace(c,variant,facing);
   if(['nw','ne','sw','se'].includes(part)){
    const west=part.endsWith('w');
    // Finished side plane continues through the top/bottom face sections.
    polygon(c,west?[[0,0],[6,3],[6,32],[0,32]]:[[32,0],[26,3],[26,32],[32,32]],west?'#b2b29422':'#233b3c55');
    c.strokeStyle=west?'#8b947066':'#2e413766';c.lineWidth=1;c.beginPath();c.moveTo(west?.5:31.5,0);c.lineTo(west?.5:31.5,32);c.stroke();
   }
  }
  cache.set(key,tile);
 }
 ctx.drawImage(tile,x,y);
}
/** Narrow broken earth/stone shoulders preserve the grass beneath them. */
export function paintCliffRim(c:CanvasRenderingContext2D,x:number,y:number,side:CliffFacing,_village=false){
 const at=(t:number,d:number):readonly[number,number]=>side==='north'?[t,d]:side==='south'?[t,32-d]:side==='west'?[d,t]:[32-d,t];
 c.save();c.translate(x,y);c.beginPath();c.rect(0,0,32,32);c.clip();
 const line=[[0,4],[6,3],[11,5],[17,3],[23,4],[28,3],[32,4]] as const;
 polygon(c,[at(0,0),at(32,0),...[...line].reverse().map(([t,d])=>at(t,d))],side==='east'?'#505957':'#737c78');
 c.strokeStyle='#343c3b';c.lineWidth=1;c.beginPath();line.forEach(([t,d],i)=>{const p=at(t,d);i?c.lineTo(...p):c.moveTo(...p)});c.stroke();
 c.strokeStyle=side==='north'||side==='west'?'#b2b8aa99':'#343c3b99';c.lineWidth=.7;c.beginPath();c.moveTo(...at(1,.5));c.lineTo(...at(9,.5));c.moveTo(...at(19,.5));c.lineTo(...at(29,.5));c.stroke();c.restore();
}

/** Four bevelled outer corners and four inward joints share the same narrow earth lip. */
export function paintCliffContour(ctx:CanvasRenderingContext2D,x:number,y:number,has:(x:number,y:number)=>boolean,village=false){
 for(const[dx,dy,side]of [[0,-1,'north'],[1,0,'east'],[0,1,'south'],[-1,0,'west']] as const)if(!has(x+dx,y+dy))paintCliffRim(ctx,x*32,y*32,side,village);
 for(const[dx,dy]of [[-1,-1],[1,-1],[-1,1],[1,1]] as const){
  const a=has(x+dx,y),b=has(x,y+dy),convex=!a&&!b,concave=a&&b&&!has(x+dx,y+dy);
  if(!convex&&!concave)continue;
  ctx.save();ctx.translate(x*32+(dx<0?0:32),y*32+(dy<0?0:32));ctx.scale(dx<0?1:-1,dy<0?1:-1);ctx.beginPath();ctx.rect(0,0,8,8);ctx.clip();
  const stone=dx<0?'#737c78':'#505957';
  if(convex){
   polygon(ctx,[[0,0],[8,0],[8,4],[5,4],[4,5],[4,8],[0,8]],stone);
   polygon(ctx,[[0,0],[3,0],[0,3]],'#343c3b');
   ctx.strokeStyle='#343c3b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(8,4);ctx.lineTo(5,4);ctx.lineTo(4,5);ctx.lineTo(4,8);ctx.stroke();
  }else{
   polygon(ctx,[[0,0],[6,0],[5,2],[3,4],[0,6]],stone);
   polygon(ctx,[[0,0],[2,0],[0,2]],'#343c3b');
   ctx.strokeStyle='#343c3b';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(5,2);ctx.lineTo(3,4);ctx.lineTo(0,6);ctx.stroke();
  }
  ctx.restore();
 }
}
