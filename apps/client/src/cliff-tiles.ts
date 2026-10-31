/** Fixed native 32×32 cliff parts. Larger cliffs repeat parts, never resize artwork. */
export const CLIFF_TILE_SIZE=32;
export type CliffPart='face-top'|'face-bottom'|'north'|'south'|'east'|'west'|'nw'|'ne'|'sw'|'se'|'stairs-north'|'stairs-south'|'stairs-east'|'stairs-west';
export type CliffFacing='north'|'south'|'east'|'west';
const cache=new Map<string,HTMLCanvasElement>();
export function paintCliffTile(ctx:CanvasRenderingContext2D,x:number,y:number,part:CliffPart,village=false,variant=0,facing:CliffFacing='south'){
 const key=`${part}:${village}:${variant%3}:${facing}`;let tile=cache.get(key);
 if(!tile){tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d')!;
 const rock=village?['#707d6b','#808a76','#5e7061','#89907a']:['#657568','#758273','#53685e','#7e8875'];
 c.fillStyle='#354d40';c.fillRect(0,0,32,32);
 for(let band=0;band<3;band++){const top=band*13-5,shift=(band+variant)%2*13;
 for(let px=-32+shift;px<32;px+=32){c.beginPath();c.moveTo(px,top+2);c.lineTo(px+16,top);c.lineTo(px+33,top+4);c.lineTo(px+29,top+15);c.lineTo(px+8,top+17);c.lineTo(px-2,top+11);c.closePath();c.fillStyle=rock[(band+variant+3)%4];c.fill();}
 }
 // Layered stone shelves: a lit lip, vertical shadow and occasional recessed fissure.
 for(let row=0;row<3;row++){const yy=row*11+2;c.fillStyle='#bac2a532';c.fillRect(0,yy,32,1);c.fillStyle='#20362e66';c.fillRect(0,yy+8,32,2);const xx=(row*13+variant*7)%28;c.fillRect(xx,yy+2,2,6);}
 c.strokeStyle='#344b3f';c.lineWidth=1;c.beginPath();c.moveTo(13+variant*2,8);c.lineTo(18,15);c.lineTo(14,23);c.stroke();
 if(part==='face-top'){c.fillStyle='#344c32';c.fillRect(0,0,32,3);c.fillStyle=village?'#789154':'#647e42';c.beginPath();c.moveTo(0,0);c.lineTo(32,0);c.lineTo(32,4);c.lineTo(24,3);c.lineTo(20,8);c.lineTo(17,4);c.lineTo(8,5);c.lineTo(4,8);c.lineTo(0,4);c.fill();}
 if(part==='face-bottom'){c.fillStyle='#213c3544';c.fillRect(0,27,32,5);}
 // Keep strata upright for every face. Direction changes lighting, never rotates the material.
 if(!part.startsWith('stairs-')){
  const light=facing==='west'?'#dce4b91f':facing==='east'?'#142d314d':facing==='north'?'#dce4b90f':'#152e2930';c.fillStyle=light;c.fillRect(0,0,32,32);
  const depth=c.createLinearGradient(0,0,0,32);depth.addColorStop(0,'#1b302800');depth.addColorStop(1,'#172d2b40');c.fillStyle=depth;c.fillRect(0,0,32,32);
 }
 const edge=(side:string)=>{
  const horizontal=side==='north'||side==='south',near=side==='north'||side==='west',position=near?0:24;
  c.fillStyle=near?'#a0ad87':'#344b3f';if(horizontal)c.fillRect(0,position,32,8);else c.fillRect(position,0,8,32);
  c.fillStyle=near?'#b3b99a':'#728469';if(horizontal)c.fillRect(0,position,32,2);else c.fillRect(position,0,2,32);
  c.fillStyle='#283e35';if(horizontal)c.fillRect(0,position+6,32,2);else c.fillRect(position+6,0,2,32);
 };
 if(['north','south','east','west'].includes(part))edge(part);
 const corners:Record<string,string[]>={nw:['north','west'],ne:['north','east'],sw:['south','west'],se:['south','east']};
 if(corners[part]){
  // Beveled shoulders join the planes; no cross-shaped seams through corner cells.
  const west=part.endsWith('w'),north=part.startsWith('n');
  c.beginPath();c.moveTo(west?0:32,north?0:32);c.lineTo(west?0:32,north?24:8);c.lineTo(west?24:8,north?0:32);c.closePath();c.fillStyle=west?'#a0ad873d':'#172e3159';c.fill();
  c.strokeStyle=west?'#adb697':'#344b3f';c.lineWidth=1;c.beginPath();c.moveTo(west?0:32,north?24:8);c.lineTo(west?24:8,north?0:32);c.stroke();
 }
 if(part.startsWith('stairs-')){
  // A complete staircase is ONE transparent 32px tile, not a strip of repeated treads.
  c.clearRect(0,0,32,32);c.save();c.translate(16,16);
  const direction=part.slice(7);c.rotate(({south:0,north:Math.PI,east:-Math.PI/2,west:Math.PI/2} as Record<string,number>)[direction]);c.translate(-16,-16);
  // Solid right-hand stringer and base distinguish the raised flight from painted stripes.
  c.fillStyle='#514b37';c.beginPath();c.moveTo(21,2);c.lineTo(31,26);c.lineTo(31,31);c.lineTo(12,31);c.lineTo(2,7);c.closePath();c.fill();
  for(let i=0;i<6;i++){
   const x=2+i*1.6,y=2+i*4.5,w=19;
   c.fillStyle='#655e46';c.beginPath();c.moveTo(x,y+2.5);c.lineTo(x+w,y+2.5);c.lineTo(x+w+1.5,y+5);c.lineTo(x+1.5,y+5);c.closePath();c.fill();
   c.fillStyle='#bcb58c';c.beginPath();c.moveTo(x+w,y);c.lineTo(x+w+1.5,y+2.5);c.lineTo(x+w+1.5,y+5);c.lineTo(x+w,y+2.5);c.closePath();c.fill();
   c.fillStyle=i%2?'#e0d9ac':'#d6cfa2';c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w+1.5,y+2.5);c.lineTo(x+1.5,y+2.5);c.closePath();c.fill();
   c.strokeStyle='#fff2c3';c.lineWidth=.7;c.beginPath();c.moveTo(x+.6,y+.4);c.lineTo(x+w-.4,y+.4);c.stroke();
  }
  c.restore();
 }
 cache.set(key,tile);}
 ctx.drawImage(tile,x,y);
}
/** Rock rim overlays a grass tile without resizing either tile. */
export function paintCliffRim(ctx:CanvasRenderingContext2D,x:number,y:number,side:'north'|'south'|'east'|'west',village=false){
 ctx.save();ctx.beginPath();if(side==='north')ctx.rect(x,y,32,8);if(side==='south')ctx.rect(x,y+24,32,8);if(side==='west')ctx.rect(x,y,8,32);if(side==='east')ctx.rect(x+24,y,8,32);ctx.clip();paintCliffTile(ctx,x,y,side,village);ctx.restore();
}
