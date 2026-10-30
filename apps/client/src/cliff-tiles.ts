/** Fixed native 32×32 cliff parts. Larger cliffs repeat parts, never resize artwork. */
export const CLIFF_TILE_SIZE=32;
export type CliffPart='face-top'|'face-bottom'|'north'|'south'|'east'|'west'|'nw'|'ne'|'sw'|'se'|'stairs-north'|'stairs-south'|'stairs-east'|'stairs-west';
const cache=new Map<string,HTMLCanvasElement>();
export function paintCliffTile(ctx:CanvasRenderingContext2D,x:number,y:number,part:CliffPart,village=false,variant=0){
 const key=`${part}:${village}:${variant%3}`;let tile=cache.get(key);
 if(!tile){tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d')!;
 const rock=village?['#707d6b','#808a76','#5e7061','#89907a']:['#657568','#758273','#53685e','#7e8875'];
 c.fillStyle='#354d40';c.fillRect(0,0,32,32);
 for(let band=0;band<3;band++){const top=band*13-5,shift=(band+variant)%2*13;
 for(let px=-32+shift;px<32;px+=32){c.beginPath();c.moveTo(px,top+2);c.lineTo(px+16,top);c.lineTo(px+33,top+4);c.lineTo(px+29,top+15);c.lineTo(px+8,top+17);c.lineTo(px-2,top+11);c.closePath();c.fillStyle=rock[(band+variant+3)%4];c.fill();}
 }
 c.strokeStyle='#344b3f';c.lineWidth=1;c.beginPath();c.moveTo(13+variant*2,8);c.lineTo(18,15);c.lineTo(14,23);c.stroke();
 if(part==='face-top'){c.fillStyle='#344c32';c.fillRect(0,0,32,3);c.fillStyle=village?'#789154':'#647e42';c.beginPath();c.moveTo(0,0);c.lineTo(32,0);c.lineTo(32,4);c.lineTo(24,3);c.lineTo(20,8);c.lineTo(17,4);c.lineTo(8,5);c.lineTo(4,8);c.lineTo(0,4);c.fill();}
 if(part==='face-bottom'){c.fillStyle='#213c3544';c.fillRect(0,27,32,5);}
 const edge=(side:string)=>{c.fillStyle='#344c32';if(side==='north')c.fillRect(0,5,32,2);if(side==='south')c.fillRect(0,25,32,2);if(side==='west')c.fillRect(5,0,2,32);if(side==='east')c.fillRect(25,0,2,32);};
 if(['north','south','east','west'].includes(part))edge(part);
 const corners:Record<string,string[]>={nw:['north','west'],ne:['north','east'],sw:['south','west'],se:['south','east']};for(const side of corners[part]??[])edge(side);
 if(part.startsWith('stairs-')){const direction=part.slice(7),horizontal=direction==='east'||direction==='west';c.fillStyle='#344b3f';c.fillRect(0,0,32,32);
 for(let i=0;i<4;i++){const p=i*8;c.fillStyle=i%2?'#95a084':'#87977f';if(horizontal)c.fillRect(p,3,6,26);else c.fillRect(3,p,26,5);c.fillStyle='#b8bda0';if(horizontal)c.fillRect(p+(direction==='west'?5:0),3,1,26);else c.fillRect(3,p+(direction==='north'?4:0),26,1);}
 c.fillStyle='#6e8068';if(horizontal){c.fillRect(0,0,32,3);c.fillRect(0,29,32,3);}else{c.fillRect(0,0,3,32);c.fillRect(29,0,3,32);}}
 cache.set(key,tile);}
 ctx.drawImage(tile,x,y);
}
/** Rock rim overlays a grass tile without resizing either tile. */
export function paintCliffRim(ctx:CanvasRenderingContext2D,x:number,y:number,side:'north'|'south'|'east'|'west',village=false){
 ctx.save();ctx.beginPath();if(side==='north')ctx.rect(x,y,32,8);if(side==='south')ctx.rect(x,y+24,32,8);if(side==='west')ctx.rect(x,y,8,32);if(side==='east')ctx.rect(x+24,y,8,32);ctx.clip();paintCliffTile(ctx,x,y,side,village);ctx.restore();
}
