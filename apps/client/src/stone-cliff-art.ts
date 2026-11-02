import {paintCliffBoulder,cliffStone} from './cliff-rock-art';
type Point=readonly[number,number];
export function polygon(c:CanvasRenderingContext2D,points:readonly Point[],fill:string,stroke?:string){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}}
/** Complete reference-inspired flight, with the cutout and side cheeks inside ONE tile. */
export function paintRecessedStair(c:CanvasRenderingContext2D,x:number,y:number){
 c.save();c.translate(x,y);c.beginPath();c.rect(0,0,32,32);c.clip();
 // The dark opening belongs to the cliff; it is not a freestanding stair icon.
 polygon(c,[[4,0],[28,0],[30,32],[2,32]],'#222921');
 polygon(c,[[26,0],[28,0],[30,32],[27,32]],'#515b61');
 for(let i=0;i<6;i++){
  const sx=6-i*.4,sy=i*5,w=20+i*.8;
  polygon(c,[[sx,sy+2.7],[sx+w,sy+2.7],[sx+w+1.3,sy+5],[sx+1.3,sy+5]],'#59666e');
  polygon(c,[[sx+w,sy],[sx+w+1.3,sy+2.7],[sx+w+1.3,sy+5],[sx+w,sy+2.7]],'#87969c');
  polygon(c,[[sx,sy],[sx+w,sy],[sx+w+1.3,sy+2.7],[sx+1.3,sy+2.7]],i%2?'#b9c6ca':'#c8d2d4');
  c.strokeStyle='#edf3f2';c.lineWidth=.65;c.beginPath();c.moveTo(sx+.3,sy+.4);c.lineTo(sx+w-.3,sy+.4);c.stroke();
  // Recessed seams and a restrained chip avoid a flat ladder of identical bars.
  c.fillStyle='#8e9ea4';if(i===1||i===4)c.fillRect(sx+5+i,sy+1,1.4,.7);
 }
 polygon(c,[[4,0],[6,0],[4,32],[2,32]],'#929fa3');
 c.strokeStyle='#cbd6d8';c.lineWidth=1;c.beginPath();c.moveTo(4.5,1);c.lineTo(2.5,30);c.stroke();
 c.restore();
}

/** Approved fractured rock planes, rendered as a native cell with fixed upper-left light. */
export function paintRockFace(c:CanvasRenderingContext2D,variant=0,facing='south',cap=false){
 paintJoinedRockSection(c,variant,facing,'middle',cap);
}

const rockFields=new Map<string,HTMLCanvasElement>();
const noise=(x:number,y:number)=>{let n=Math.imul(x+271,374761393)^Math.imul(y+117,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
/** A shared fracture field crosses native cell seams, with the approved stone palette and scale. */
export function paintJoinedRockSection(c:CanvasRenderingContext2D,variant:number,facing:string,section:'top'|'bottom'|'middle',cap=true,palette?:Readonly<Record<string,string>>){
 const ink=(color:string)=>palette?.[color]??color,key=facing+(palette?JSON.stringify(palette):'');
 let field=rockFields.get(key);
 if(!field){
  field=document.createElement('canvas');field.width=384;field.height=64;const g=field.getContext('2d')!;
  g.fillStyle=ink('#354333');g.fillRect(0,0,384,64);
  const colors=palette?{dark:ink('#354333'),shadow:ink('#535f4e'),base:ink('#858b72'),face:ink('#97977d'),light:ink('#bec0a0'),rim:ink('#647b45')}:cliffStone;
  // Overlapping staggered boulders cross cell and face-section seams as one shared wall.
  for(let row=-1;row<6;row++)for(let col=-2;col<25;col++){
   const seed=col+row*37,n=noise(col+17,row+21),w=15+n*8,h=13+noise(col,row+9)*7;
   paintCliffBoulder(g,col*18+(row%2)*9+(noise(col,row)-.5)*4,row*13-3+(noise(col+7,row)-.5)*5,w,h,seed,colors);
  }
  const shade=g.createLinearGradient(0,0,0,64);shade.addColorStop(0,ink('#e3dbaf18'));shade.addColorStop(.5,ink('#172d2810'));shade.addColorStop(1,ink('#172d2855'));g.fillStyle=shade;g.fillRect(0,0,384,64);
  g.fillStyle=facing==='west'?ink('#f6edc72b'):facing==='east'?ink('#102c3445'):facing==='north'?ink('#e9f2da0d'):ink('#14251e18');g.fillRect(0,0,384,64);rockFields.set(key,field);
 }
 const v=((variant%12)+12)%12;
 c.drawImage(field,v*32,section==='top'?0:section==='bottom'?32:16,32,32,0,0,32,32);
 if(section==='top'&&cap){
  polygon(c,[[0,0],[32,0],[32,3],[26,4],[21,2],[15,4],[9,2],[4,4],[0,3]],ink('#647b45'));
 }else if(section==='bottom'){c.fillStyle=ink('#152c2522');c.fillRect(0,30,32,2);}
}

/** A separate upper-floor stairwell, with treads descending into a shadowed opening. */
export function paintDescendingStair(c:CanvasRenderingContext2D,x:number,y:number){
 c.save();c.translate(x,y);c.beginPath();c.rect(0,0,32,32);c.clip();
 polygon(c,[[2,1],[30,1],[30,31],[2,31]],'#202d2b');
 const shades=['#b7c4c7','#9aaeb4','#7c939b','#617b85','#455f6b','#2c424d'];
 for(let i=0;i<6;i++){
  const sy=3+i*4.3,inset=4+i*.4,w=24-i*.8;
  polygon(c,[[inset,sy],[inset+w,sy],[inset+w,sy+2.8],[inset,sy+2.8]],shades[i]);
  polygon(c,[[inset,sy+2.8],[inset+w,sy+2.8],[inset+w,sy+4.3],[inset,sy+4.3]],i<3?'#536c75':'#243a44');
  c.strokeStyle=i<2?'#d1dddc':'#8ba1a455';c.lineWidth=.6;c.beginPath();c.moveTo(inset,sy+.3);c.lineTo(inset+w,sy+.3);c.stroke();
 }
 polygon(c,[[0,0],[4,0],[4,28],[0,32]],'#889b9e');
 polygon(c,[[28,0],[32,0],[32,32],[28,28]],'#536a72');
 polygon(c,[[0,0],[32,0],[28,3],[4,3]],'#d0d9d7');
 polygon(c,[[0,32],[4,28],[28,28],[32,32]],'#33474e');
 c.restore();
}
