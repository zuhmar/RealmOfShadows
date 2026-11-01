import {paintJoinedRockSection,polygon} from './stone-cliff-art';
// The same fractured cliff planes, with the Caverns' violet stone and cool light.
const purple:Readonly<Record<string,string>>={
 '#777967':'#655180','#535f4e':'#3a2d4f','#92937b':'#9781b0','#858b72':'#88709e','#97977d':'#a08cba','#818a70':'#79658e',
 '#5a6352':'#423453','#68715c':'#584568','#6b725e':'#5b466e','#77806a':'#6b557e','#899077':'#907aa5','#7f896e':'#7f6995',
 '#354333a6':'#291d3ca6','#bec0a04a':'#dbc3f34a','#e3dbaf18':'#dcc8ff18','#172d2810':'#24113d10','#172d2855':'#20113155',
 '#f6edc72b':'#ead2ff2b','#102c3445':'#1e0c3845','#e9f2da0d':'#e9dcff0d','#14251e18':'#220e3c18','#647b45':'#64507b','#152c2522':'#190c3022'
};
export function caveWallEdges(cells:number[][],x:number,y:number){
 const open=(dx:number,dy:number)=>cells[y+dy]?.[x+dx]!==undefined&&cells[y+dy][x+dx]!==5;
 return cells[y]?.[x]===5?{north:open(0,-1),east:open(1,0),south:open(0,1),west:open(-1,0)}:undefined;
}
const cache=new Map<string,HTMLCanvasElement>();
function crystal(c:CanvasRenderingContext2D,x:number,y:number,height:number,teal=false){
 const light=teal?'#b5f7ff':'#e3c5ff',mid=teal?'#5ccddd':'#a67ddd',dark=teal?'#276c98':'#59408e';
 polygon(c,[[x,y-height],[x+3,y-height+4],[x+2,y],[x-2,y],[x-3,y-height+4]],mid,'#24223e');
 polygon(c,[[x,y-height],[x,y],[x-2,y],[x-3,y-height+4]],light);polygon(c,[[x,y-height],[x+3,y-height+4],[x+2,y],[x,y]],dark);
 c.strokeStyle=light;c.lineWidth=.6;c.beginPath();c.moveTo(x,y-height+1);c.lineTo(x+2,y-height+4);c.stroke();
}
/** A broken stone lip keeps the upper floor edge readable when its face is hidden. */
function paintTopRim(c:CanvasRenderingContext2D,side:'north'|'east'|'west'){
 const at=(t:number,d:number):readonly[number,number]=>side==='north'?[t,d]:side==='west'?[d,t]:[32-d,t];
 const line=[[1,5],[6,4],[13,6],[20,4],[26,5],[31,5]] as const;
 polygon(c,[at(0,0),at(32,0),...[...line].reverse().map(([t,d])=>at(t,d))],'#534064');
 c.strokeStyle='#c1a5d4';c.lineWidth=1;c.beginPath();line.forEach(([t,d],i)=>{const p=at(t,d);i?c.lineTo(...p):c.moveTo(...p)});c.stroke();
 c.strokeStyle='#291d3d';c.lineWidth=1.4;c.beginPath();c.moveTo(...at(1,1.4));c.lineTo(...at(31,1.4));c.stroke();
}
/** All faces, bevels and crystals stay inside blocked native 32px cells. */
export function paintCavernWalls(ctx:CanvasRenderingContext2D,cells:number[][],atlas?:CanvasImageSource){

 const solid=(x:number,y:number)=>cells[y]?.[x]===5;
 const face=(x:number,y:number,facing:string,section:'top'|'bottom'|'middle',cap=false)=>{
  if(!solid(x,y))return;const side=facing==='east'||facing==='west',variant=(side?y:x)%12,key=`${facing}:${section}:${cap}:${variant}`;let tile=cache.get(key);
  if(!tile){tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d')!;
   if(side){c.translate(16,16);c.rotate(Math.PI/2);c.translate(-16,-16);}
   paintJoinedRockSection(c,variant,facing,section,cap,purple);cache.set(key,tile);
  }
  ctx.save();ctx.beginPath();ctx.rect(x*32,y*32,32,32);ctx.clip();ctx.drawImage(tile,x*32,y*32);ctx.restore();
 };
 // A visible horizontal rock floor crowns the whole cliff mass.
 // Keep it distinct from the darker vertical faces below its edge.
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++)if(solid(x,y)){
  ctx.save();ctx.translate(x*32,y*32);ctx.beginPath();ctx.rect(0,0,32,32);ctx.clip();
  if(atlas){ctx.drawImage(atlas,2,2,32,32,0,0,32,32);ctx.fillStyle='#b89edba6';ctx.fillRect(0,0,32,32);}
  else{ctx.fillStyle='#8b78a6';ctx.fillRect(0,0,32,32);}
  ctx.restore();
 }
 // A single vertical edge sits below the top floor, never a stack of faces.
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){
  const e=caveWallEdges(cells,x,y);if(!e)continue;
  if(e.south)face(x,y,'south','bottom');
  else if(e.north){/* The foreground edge exposes its horizontal top floor. */}
  else if(e.west)face(x,y,'west','middle');else if(e.east)face(x,y,'east','middle');
 }
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){
  const edges=caveWallEdges(cells,x,y);if(!edges)continue;
  ctx.save();ctx.translate(x*32,y*32);ctx.beginPath();ctx.rect(0,0,32,32);ctx.clip();
  if(edges.north){paintTopRim(ctx,'north');if(edges.west)paintTopRim(ctx,'west');if(edges.east)paintTopRim(ctx,'east');}
  if(edges.south){polygon(ctx,[[0,0],[32,0],[32,3],[25,5],[17,3],[9,5],[0,3]],'#9681ad');}
  ctx.strokeStyle='#d1b3ea66';ctx.lineWidth=1;ctx.beginPath();if(edges.north){ctx.moveTo(0,.5);ctx.lineTo(32,.5)}if(edges.west){ctx.moveTo(.5,0);ctx.lineTo(.5,32)}ctx.stroke();
  ctx.strokeStyle='#1a102e';ctx.lineWidth=1.4;ctx.beginPath();if(edges.south){ctx.moveTo(0,31);ctx.lineTo(32,31)}if(edges.east){ctx.moveTo(31,0);ctx.lineTo(31,32)}ctx.stroke();
  if(Object.values(edges).some(Boolean)&&(x*19+y*31)%5===0){crystal(ctx,12,25,12,(x+y)%2===0);crystal(ctx,19,27,8,(x+y)%2!==0);}
  ctx.restore();
  for(const [dx,dy]of [[-1,-1],[1,-1],[-1,1],[1,1]] as const){
   const sideX=dx<0?edges.west:edges.east,sideY=dy<0?edges.north:edges.south,diagonal=cells[y+dy]?.[x+dx];
   if(!(sideX&&sideY)&&!(diagonal!==undefined&&diagonal!==5&&!sideX&&!sideY))continue;
   ctx.save();ctx.beginPath();ctx.rect(x*32,y*32,32,32);ctx.clip();ctx.translate(x*32+(dx>0?32:0),y*32+(dy>0?32:0));ctx.scale(dx>0?-1:1,dy>0?-1:1);polygon(ctx,[[0,0],[6,0],[4,3],[3,4],[0,6]],'#9a80b5');polygon(ctx,[[0,0],[3,0],[0,3]],'#30203f');ctx.restore();
  }
 }
}
