import {paintForestRock} from './forest-rock';
import type Phaser from 'phaser';
import {elderwoodSize,elderwoodRimStairs,onElderwoodRim,stairsFor} from '@realm/game-data';
type Vertex=readonly [number,number];
function shape(ctx:CanvasRenderingContext2D,points:readonly Vertex[],fill:string|CanvasGradient,stroke?:string){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
/** Fixed world lighting: northwest highlights, cool occlusion under the turf and at the base. */
export function paintVillageCliffs(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource){
 const {width,height}=elderwoodSize,S=32,W=width*S,H=height*S;
 ctx.save();
 // A single grass cap joins around the perimeter, without a border around each tile.
 ctx.fillStyle='#3c4b41';ctx.fillRect(0,0,W,S);ctx.fillRect(0,H-S,W,S);ctx.fillRect(0,0,S,H);ctx.fillRect(W-S,0,S,H);
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)if(onElderwoodRim(x,y))ctx.drawImage(atlas,2,2,32,32,x*S,y*S,S,S);
 const faces=[
  {points:[[96,96],[W-96,96],[W-160,160],[160,160]],side:'north',base:'#788275',dark:'#384b44'},
  {points:[[96,96],[160,160],[160,H-160],[96,H-96]],side:'west',base:'#5b7068',dark:'#293e39'},
  {points:[[W-96,96],[W-96,H-96],[W-160,H-160],[W-160,160]],side:'east',base:'#8a907b',dark:'#4b6050'},
  {points:[[96,H-96],[160,H-160],[W-160,H-160],[W-96,H-96]],side:'south',base:'#64776c',dark:'#30473f'},
 ] as const;
 for(const face of faces){
  ctx.save();ctx.beginPath();face.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  const horizontal=face.side==='north'||face.side==='south',length=horizontal?W:H;
  const gradient=horizontal?ctx.createLinearGradient(0,face.side==='north'?96:H-160,0,face.side==='north'?160:H-96):ctx.createLinearGradient(face.side==='west'?96:W-160,0,face.side==='west'?160:W-96,0);
  gradient.addColorStop(0,face.base);gradient.addColorStop(.55,face.side==='east'?'#788771':'#607568');gradient.addColorStop(1,face.dark);ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  // The same broad fractured strata used by Whispering Woods, with warmer village stone.
  const x=face.side==='east'?W-160:96,y=face.side==='south'?H-160:96;
  ctx.save();ctx.translate(x,y);
  if(!horizontal){ctx.rotate(Math.PI/2);ctx.translate(0,-64);}
  paintForestRock(ctx,0,0,length-192,64,true);
  ctx.restore();
  ctx.restore();
 }
 // Turf overhang follows the mitered corner silhouette, casting one continuous shadow.
 const lip:Vertex[]=[[96,96],[W-96,96],[W-96,H-96],[96,H-96]];
 ctx.strokeStyle='#213d2c88';ctx.lineWidth=8;ctx.lineJoin='bevel';ctx.beginPath();lip.forEach(([x,y],i)=>i?ctx.lineTo(x,y+5):ctx.moveTo(x,y+5));ctx.closePath();ctx.stroke();
 ctx.strokeStyle='#789154';ctx.lineWidth=5;ctx.beginPath();lip.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();
 for(let i=0;i<width-6;i++){const x=(i+3)*32+7+(i*7%16),drop=5+(i*13%12);shape(ctx,[[x-7,94],[x+9,96],[x+5,101],[x+2,99],[x-1,96+drop],[x-4,102]],i%2?'#607947':'#829657');}
 // Contact shade on the lower village floor anchors the rock to the ground.
 for(const [x,y,w,h,dx,dy]of [[160,160,W-320,14,0,14],[160,160,14,H-320,14,0],[W-174,160,14,H-320,-14,0],[160,H-174,W-320,14,0,-14]]){
  const g=ctx.createLinearGradient(dx<0?x+w:x,dy<0?y+h:y,dx<0?x:x+dx,dy<0?y:y+dy);g.addColorStop(0,'#142c244d');g.addColorStop(1,'#142c2400');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
 }
 // Four hand-authored corner shoulders fill the diagonal joins between face orientations.
 for(const [x,y,sx,sy]of [[96,96,1,1],[W-96,96,-1,1],[96,H-96,1,-1],[W-96,H-96,-1,-1]]){
  shape(ctx,[[x,y],[x+sx*17,y+sy*6],[x+sx*48,y+sy*40],[x+sx*64,y+sy*64],[x+sx*37,y+sy*49],[x+sx*8,y+sy*18]],sx===1?'#6c7e6b':'#87917b','#415b48');
  ctx.save();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+sx*17,y+sy*6);ctx.lineTo(x+sx*48,y+sy*40);ctx.lineTo(x+sx*64,y+sy*64);ctx.lineTo(x+sx*37,y+sy*49);ctx.lineTo(x+sx*8,y+sy*18);ctx.closePath();ctx.clip();ctx.restore();
  ctx.strokeStyle='#a6b18b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+sx*5,y+sy*4);ctx.lineTo(x+sx*27,y+sy*22);ctx.lineTo(x+sx*47,y+sy*40);ctx.stroke();
 }
 for(const s of elderwoodRimStairs)paintCliffStairs(ctx,s);
 ctx.restore();
}
/** Actual step faces projected with a vertical height; artwork is never rotated as a flat stamp. */
export function paintCliffStairs(ctx:CanvasRenderingContext2D,s:typeof elderwoodRimStairs[number]){
 const tx=s.top.x*32,ty=s.top.y*32,gx=s.x*32,gy=s.y*32,dx=gx-tx,dy=gy-ty,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length,rise=30,count=10;
 const point=(t:number,side:number,z:number):Vertex=>[tx+dx*t+nx*side,ty+rise+(dy-rise)*t+ny*side-z];
 ctx.save();
 // Stair runs use consecutive tile parts; their cross-axis footprint is exactly one cell.
 ctx.beginPath();if(dx===0)ctx.rect(Math.floor(s.x)*32,Math.min(ty,gy)-64,32,Math.abs(dy)+128);else ctx.rect(Math.min(tx,gx)-32,Math.floor(s.y)*32,Math.abs(dx)+64,32);ctx.clip();
 const shadow=[point(0,-15,rise),point(0,15,rise),point(1,15,0),point(1,-15,0)].map(([x,y])=>[x+5,y+7] as Vertex);shape(ctx,shadow,'#102a2355');
 // A recessed cut and tapered retaining walls connect the upper turf to the lower landing.
 shape(ctx,[point(0,-15,rise),point(0,15,rise),point(1,15,0),point(1,-15,0)],'#293f37');
 type Face={points:Vertex[];fill:string;edge?:string;depth:number;foundation?:boolean};const faces:Face[]=[];
 const add=(points:Vertex[],fill:string,edge?:string,foundation=false)=>faces.push({points,fill,edge,foundation,depth:Math.max(...points.map(p=>p[1]))});
 for(let i=0;i<count;i++){
  const t=i/count,next=(i+1)/count,z=rise*(1-t),zNext=rise*(1-next),w=11+t;
  const a=point(t,-w,z),b=point(t,w,z),c=point(next,w,z),d=point(next,-w,z),lowC=point(next,w,zNext),lowD=point(next,-w,zNext);
  add([a,b,c,d],i%2?'#9ca58a':'#8e9b83','#697864');
  add([d,c,lowC,lowD],dx<0||dy<0?'#7c8876':'#526453','#344c40');
 }
 // Stone cheek walls have visible side faces and narrow lit caps, rather than painted stripes.
 for(const side of [-1,1]){
  const inner=side*13,outer=side*15;
  const a=point(0,outer,rise+5),b=point(1,outer,5),c=point(1,outer,-1),d=point(0,outer,0);
  add([a,b,c,d],side*nx<0?'#87947a':'#4b6255','#344f40',true);
  add([a,b,point(1,outer,-1),point(0,outer,rise-1)],side*nx<0?'#87947a':'#4b6255','#344f40');
  add([point(0,inner,rise+5),a,b,point(1,inner,5)],'#b8bda0','#7b876e');
 }
 faces.sort((a,b)=>a.depth-b.depth);for(const face of faces){ctx.save();if(face.foundation){ctx.beginPath();const W=elderwoodSize.width*32,H=elderwoodSize.height*32;if(s.id==='north')ctx.rect(0,96,W,64);else if(s.id==='south')ctx.rect(0,H-160,W,64);else if(s.id==='west')ctx.rect(96,0,64,H);else ctx.rect(W-160,0,64,H);ctx.clip();}shape(ctx,face.points,face.fill,face.edge);ctx.save();ctx.beginPath();face.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.restore();ctx.strokeStyle=face.edge??'#61715c';ctx.lineWidth=.8;ctx.beginPath();face.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();ctx.restore();}
 // The landing remains centered on the original walkable tile and transition point.
 ctx.restore();
}
export function drawVillageCliffStairs(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 if(region!=='elderwood'&&region!=='elderwood-upper')return;
 for(const s of elderwoodRimStairs){const up=region==='elderwood',stair=stairsFor(region).find(r=>r.id===`elderwood-rim-${s.id}-${up?'up':'down'}`)!;
 const x=up?(s.x+s.top.x)/2:s.top.x,y=up?(s.y+s.top.y)/2:s.top.y;
 const zone=scene.add.zone(x*64,y*64,64,64).setInteractive({useHandCursor:true}).setDepth(10000).setData('stair',stair.id);
 zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
 scene.add.text(x*64,y*64-45,up?'↑ Cliff walk':'↓ Village',{fontSize:'11px',color:'#eee4c3',backgroundColor:'#243f32'}).setOrigin(.5).setDepth(10001);
 }
}
