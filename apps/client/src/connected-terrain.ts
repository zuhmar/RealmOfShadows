export const usesConnectedTerrain=(region:string)=>['elderwood','elderwood-upper','woods','woods-depths','caverns','caverns-depths'].includes(region);
/** Visual terrain connectivity follows the same cells used for movement and fishing. */
export function connectedCellPath(ctx:CanvasRenderingContext2D,cells:number[][],x:number,y:number,size:number){
 const material=cells[y][x],same=(dx:number,dy:number)=>cells[y+dy]?.[x+dx]===material;
 const n=same(0,-1),e=same(1,0),s=same(0,1),w=same(-1,0),r=size*.25;
 const tl=!n&&!w?r:0,tr=!n&&!e?r:0,br=!s&&!e?r:0,bl=!s&&!w?r:0;
 const left=x*size,top=y*size,right=left+size,bottom=top+size;
 ctx.beginPath();ctx.moveTo(left+tl,top);ctx.lineTo(right-tr,top);ctx.quadraticCurveTo(right,top,right,top+tr);ctx.lineTo(right,bottom-br);ctx.quadraticCurveTo(right,bottom,right-br,bottom);ctx.lineTo(left+bl,bottom);ctx.quadraticCurveTo(left,bottom,left,bottom-bl);ctx.lineTo(left,top+tl);ctx.quadraticCurveTo(left,top,left+tl,top);ctx.closePath();
 return {n,e,s,w,tl,tr,br,bl,left,top,right,bottom};
}
export function paintConnectedTerrain(ctx:CanvasRenderingContext2D,cells:number[][],atlas:CanvasImageSource){
 // Phaser pools canvases, so discard any clip/paint state left by a previous texture.
 ctx.reset();
 const size=32;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const tile=(m:number,x:number,y:number)=>ctx.drawImage(atlas,m*36+2,2,32,32,x*size,y*size,size,size);
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++)tile(0,x,y);
 // Bridges are painted last, over water; ground is the common transition underlay.
 for(const material of [5,3,1,2,4])for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){
  if(cells[y][x]!==material)continue;
  ctx.save();const p=connectedCellPath(ctx,cells,x,y,size);ctx.clip();tile(material,x,y);ctx.restore();
  if(material!==3&&material!==5)continue;
  // Outline only exposed edges, never the joints between equal adjacent cells.
  ctx.strokeStyle=material===3?'#a99b69':'#515748';ctx.lineWidth=material===3?2:1.5;ctx.beginPath();
  const {left:l,top:t,right:r,bottom:b,tl,tr,br,bl}=p;
  if(!p.n){ctx.moveTo(l+tl,t);ctx.lineTo(r-tr,t);}
  if(!p.e){ctx.moveTo(r,t+tr);ctx.lineTo(r,b-br);}
  if(!p.s){ctx.moveTo(r-br,b);ctx.lineTo(l+bl,b);}
  if(!p.w){ctx.moveTo(l,b-bl);ctx.lineTo(l,t+tl);}
  if(tl){ctx.moveTo(l,t+tl);ctx.quadraticCurveTo(l,t,l+tl,t);}if(tr){ctx.moveTo(r-tr,t);ctx.quadraticCurveTo(r,t,r,t+tr);}
  if(br){ctx.moveTo(r,b-br);ctx.quadraticCurveTo(r,b,r-br,b);}if(bl){ctx.moveTo(l+bl,b);ctx.quadraticCurveTo(l,b,l,b-bl);}
  ctx.stroke();
 }
}
