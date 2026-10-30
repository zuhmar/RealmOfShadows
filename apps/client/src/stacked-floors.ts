import {paintForestRock} from './forest-rock';
import type Phaser from 'phaser';
import {woodsLedge,woodsCliffs,woodsRidges,ridgeCells,type WoodsRidge,gridMap,stairsFor} from '@realm/game-data';
/** Shared by terrain previews and the depth-sorted outdoor floor overlay. */
export function paintLedge(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,scenic=false,cells=gridMap('woods-upper').cells){
 const l=woodsLedge,W=l.width*32,H=l.height*32,B=(l.height+l.faceHeight)*32;
 const polygon=(points:number[][],fill:string,stroke?:string)=>{
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke();}
 };
 // An irregular silhouette and continuous escarpment replace the rectangular brick slab.
 const outline=[[10,2],[46,0],[73,4],[110,1],[149,3],[180,1],[190,12],[188,48],[192,79],[189,115],[192,147],[187,179],[175,B-2],[139,B],[104,B-3],[69,B],[36,B-2],[8,B-5],[1,177],[4,141],[1,108],[3,76],[0,43],[3,13]];
 ctx.save();ctx.beginPath();outline.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
 ctx.fillStyle='#293b39';ctx.fillRect(0,0,W,B);
 // The north, west and east faces remain exposed around the turf cap.
 const cap=[[15,15],[46,12],[73,16],[110,12],[148,15],[177,12],[180,43],[177,76],[181,105],[174,H-8],[145,H-5],[116,H-10],[85,H-6],[55,H-10],[19,H-7],[12,103],[15,74],[11,44]];
 for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++)ctx.drawImage(atlas,(scenic?0:cells[l.y+y][l.x+x])*36+2,2,32,32,x*32,y*32,32,32);
 // Each face is built from long fractured strata, with broad vertical facets rather than masonry courses.
 const rock=['#657568','#758273','#53685e','#7e8875','#5b7067','#6a7b6d'];
 for(let band=0;band<3;band++)for(let i=0;i<5;i++){
  const x=i*47-19+(band%2)*21,y=H-8+band*24,j=(i*7+band*3)%9;
  polygon([[x,y+3],[x+26,y-2],[x+52,y+4],[x+44,y+19+j],[x+12,y+26],[x-3,y+18]],rock[(i+band*2)%rock.length]);
  polygon([[x+1,y+4],[x+18,y],[x+30,y+5],[x+16,y+8]],'#a3aa8877');
 }
 // Side and rear cliffs: narrow from this elevated view, but joined to the full-height south face.
 for(let i=0;i<6;i++){
  const y=i*23;
  polygon([[1,y],[15,y+3],[11,y+14],[16,y+24],[12,y+39],[3,y+35]],rock[(i+2)%6],'#354b43');
  polygon([[178,y+2],[191,y],[187,y+17],[190,y+34],[177,y+40],[181,y+20]],rock[(i+4)%6],'#354b43');
  const x=i*33;
  polygon([[x,0],[x+34,2],[x+39,15],[x+26,12],[x+17,16],[x,13]],rock[i%6],'#354b43');
 }
 // Turf is clipped separately so the rocky perimeter is visible on every side.
 ctx.save();ctx.beginPath();cap.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
 for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++)ctx.drawImage(atlas,(scenic?0:cells[l.y+y][l.x+x])*36+2,2,32,32,x*32,y*32,32,32);
 ctx.restore();
 ctx.beginPath();cap.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.strokeStyle='#344c32';ctx.lineWidth=3;ctx.stroke();
 for(let i=0;i<12;i++){const x=21+i*13,y=H-9+(i%3)*2;if(x>94&&x<130)continue;polygon([[x-6,y-2],[x+8,y-3],[x+5,y+3],[x+2,y+2],[x,y+8],[x-3,y+3]],i%2?'#526d37':'#647e42');}
 // Small moss shelves and mineral cracks continue around corners without a hard tile seam.
 for(let i=0;i<15;i++){
  const x=8+(i*43)%177,y=H+12+(i*19)%56;
  if(x>86&&x<139)continue;
  ctx.strokeStyle='#293f38';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5,y+7);ctx.lineTo(x+2,y+12);ctx.stroke();
  if(i%3===0)polygon([[x-3,y-2],[x+8,y-4],[x+12,y],[x+2,y+3]],'#607548');
 }
 if(!scenic){
 // A flared stone staircase is cut into the south face; retaining cheeks meet the cliff.
 polygon([[97,H-9],[102,H-7],[102,B-1],[97,B-2]],'#495d50','#30463e');
 polygon([[122,H-8],[127,H-7],[127,B-2],[122,B-1]],'#536858','#30463e');
 for(let i=0;i<8;i++){
  const width=20+i*.5,x=3.5*32-width/2,y=H-6+i*8.5;
  polygon([[x,y],[x+width,y],[x+width+1,y+8],[x-1,y+8]],'#455a50','#2d443b');
  polygon([[x,y],[x+width,y],[x+width+.5,y+5],[x-.5,y+5]],i%2?'#95a084':'#87977f');
  ctx.strokeStyle='#b8bda0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+1,y+.5);ctx.lineTo(x+width-1,y+.5);ctx.stroke();
 }
 }
 ctx.restore();

}
/** Joined tile footprints share one turf cap: no dividing walls where ridges meet. */
export function paintRidge(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,ridge:WoodsRidge,upperCells=gridMap('woods-upper').cells){
 const cells=ridgeCells(ridge),has=(x:number,y:number)=>cells.has(`${x},${y}`);
 // Each uninterrupted face is one fractured rock mass, with no seams at tile joins.
 const fronts=[...cells].map(k=>k.split(',').map(Number)).filter(([x,y])=>!has(x,y+1)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 for(let i=0;i<fronts.length;){const [start,y]=fronts[i];let end=start;i++;while(i<fronts.length&&fronts[i][1]===y&&fronts[i][0]===end+1){end++;i++;}
  const px=start*32,py=(y+1)*32,width=(end-start+1)*32;
  ctx.save();ctx.beginPath();ctx.rect(px,py,width,64);ctx.clip();ctx.fillStyle='#354d40';ctx.fillRect(px,py,width,64);
  paintForestRock(ctx,px,py,width,64);
  ctx.restore();
 }
 for(const key of cells){const[x,y]=key.split(',').map(Number),px=x*32,py=y*32;
  ctx.drawImage(atlas,upperCells[y][x]*36+2,2,32,32,px,py,32,32);
  // Exposed rim only; shared edges between adjoining parts remain open grass.
  for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]])if(!has(x+dx,y+dy)){
   ctx.fillStyle='#687969';if(dy)ctx.fillRect(px,py+(dy===1?26:0),32,6);else ctx.fillRect(px+(dx===1?26:0),py,6,32);
   ctx.strokeStyle='#3e5835';ctx.lineWidth=2;ctx.beginPath();if(dy){ctx.moveTo(px,py+(dy===1?25:7));ctx.lineTo(px+16,py+(dy===1?23:9));ctx.lineTo(px+32,py+(dy===1?25:7));}else{ctx.moveTo(px+(dx===1?25:7),py);ctx.lineTo(px+(dx===1?23:9),py+16);ctx.lineTo(px+(dx===1?25:7),py+32);}ctx.stroke();
  }
 }
 const cx=ridge.stair.x*32,top=(ridge.stair.y+.5)*32;
 for(let i=0;i<8;i++){const w=24;ctx.fillStyle='#354d40';ctx.fillRect(cx-w/2-2,top+i*8,w+4,9);ctx.fillStyle=i%2?'#95a084':'#87977f';ctx.fillRect(cx-w/2,top+i*8,w,5);ctx.fillStyle='#bbc0a1';ctx.fillRect(cx-w/2+1,top+i*8,w-2,1);}
}
/** Boundary cliffs share the ledge's stone palette, with joined corners and no root-wall tiles. */
export function paintWoodsCliffs(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,upperCells=gridMap('woods-upper').cells){
 const map=gridMap('woods'),W=map.width,H=map.height;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||y===0||x===W-1||y===H-1){
  ctx.save();ctx.translate(x*32,y*32);
  ctx.fillStyle='#33483f';ctx.fillRect(0,0,32,32);
  const shades=['#657568','#758273','#53685e','#7e8875'];
  for(let i=0;i<3;i++){
   const a=(x*7+y*11+i*3)%7,b=i*11;
   ctx.beginPath();ctx.moveTo(-3,b+2);ctx.lineTo(12+a,b-2);ctx.lineTo(34,b+3);ctx.lineTo(32,b+12);ctx.lineTo(9,b+9);ctx.lineTo(-2,b+13);ctx.closePath();ctx.fillStyle=shades[(x+y+i)%4];ctx.fill();
   ctx.strokeStyle='#394e41';ctx.lineWidth=1;ctx.stroke();
  }
  // Moss joins the rock to the playable forest-facing side of the boundary.
  ctx.strokeStyle='#506b39';ctx.lineWidth=4;ctx.beginPath();
  if(y===0){ctx.moveTo(0,30);ctx.lineTo(32,30);}if(y===H-1){ctx.moveTo(0,2);ctx.lineTo(32,2);}
  if(x===0){ctx.moveTo(30,0);ctx.lineTo(30,32);}if(x===W-1){ctx.moveTo(2,0);ctx.lineTo(2,32);}ctx.stroke();ctx.restore();
 }
 for(const r of woodsRidges)paintRidge(ctx,atlas,r,upperCells);
 for(const c of woodsCliffs){ctx.save();ctx.translate(c.x*32,c.y*32);ctx.scale(c.size/6,c.size/6);paintLedge(ctx,atlas,true);ctx.restore();}
}
export function drawRaisedFloor(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 if(region!=='woods'&&region!=='woods-upper')return;
 const l=woodsLedge,key='woods-visible-ledge';
 for(const r of woodsRidges){
  const minX=Math.min(...r.parts.map(p=>p.x)),minY=Math.min(...r.parts.map(p=>p.y)),maxX=Math.max(...r.parts.map(p=>p.x+p.w)),maxY=Math.max(...r.parts.map(p=>p.y+p.h))+2,key=`woods-ridge-${r.id}`;
  if(!scene.textures.exists(key)){const t=scene.textures.createCanvas(key,(maxX-minX)*32,(maxY-minY)*32)!;const ctx=t.getContext();ctx.translate(-minX*32,-minY*32);paintRidge(ctx,scene.textures.get('terrain-woods-32').getSourceImage() as HTMLImageElement,r);t.refresh();}
  scene.add.image(minX*64,minY*64,key).setOrigin(0).setScale(2).setDepth(maxY*64-1).setData('raisedRidge',r.id);
  const stair=stairsFor(region).find(s=>s.id===`woods-ridge-${r.id}-${region==='woods'?'up':'down'}`)!;
  const zone=scene.add.zone(r.stair.x*64,(r.stair.y+(region==='woods'?1.5:0))*64,96,128).setInteractive({useHandCursor:true}).setDepth(maxY*64+1).setData('stair',stair.id);
  zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
  scene.add.text(r.stair.x*64,(r.stair.y+.5)*64,stair.label,{fontSize:'12px',color:'#f0e2bc',backgroundColor:'#233d37'}).setOrigin(.5).setDepth(maxY*64+2);
 }

 const scenicKey='woods-scenic-cliff';
 if(!scene.textures.exists(scenicKey)){const t=scene.textures.createCanvas(scenicKey,192,192)!;paintLedge(t.getContext(),scene.textures.get('terrain-woods-32').getSourceImage() as HTMLImageElement,true);t.refresh();}
 for(const c of woodsCliffs)scene.add.image(c.x*64,c.y*64,scenicKey).setOrigin(0).setDisplaySize(c.size*64,c.size*64).setDepth((c.y+c.size)*64-1).setData('scenicCliff',true);

 if(!scene.textures.exists(key)){const texture=scene.textures.createCanvas(key,l.width*32,(l.height+l.faceHeight)*32)!;paintLedge(texture.getContext(),scene.textures.get('terrain-woods-32').getSourceImage() as HTMLImageElement);texture.refresh();}
 scene.add.image(l.x*64,l.y*64,key).setOrigin(0).setScale(2).setDepth((l.y+l.height+l.faceHeight)*64-1).setData('raisedFloor','woods-upper');
 const stair=stairsFor(region).find(s=>s.id.startsWith('woods-ledge-'))!,up=stair.direction==='up',size=up?160:92;
 const zone=scene.add.zone(stair.x*64,(up?stair.y-1:stair.y+.75)*64,size,size).setInteractive({useHandCursor:true}).setDepth(2000).setData('stair',stair.id);
 zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
 scene.add.text(stair.x*64,(up?stair.y-2.6:7.3)*64,stair.label,{fontSize:'12px',color:'#f0e2bc',backgroundColor:'#233d37'}).setOrigin(.5).setDepth(2001);
}
