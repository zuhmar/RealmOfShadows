import {paintCliffTile,paintCliffContour} from './cliff-tiles';
import type Phaser from 'phaser';
import {woodsLedge,woodsCliffs,woodsRidges,ridgeCells,type WoodsRidge,gridMap,stairsFor} from '@realm/game-data';
/** All upper footprints assemble native tiles; exposed south faces are two rows. */
function paintPlateau(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,cells:Set<string>,terrain:(x:number,y:number)=>number,stair?:{x:number,y:number}){
 const has=(x:number,y:number)=>cells.has(`${x},${y}`);
 for(const key of cells){const[x,y]=key.split(',').map(Number);if(!has(x,y+1)){const end=!has(x-1,y)?'sw':!has(x+1,y)?'se':undefined;paintCliffTile(ctx,x*32,(y+1)*32,end??'face-top',false,x%3,'south','top',false);paintCliffTile(ctx,x*32,(y+2)*32,end??'face-bottom',false,x%3,'south','bottom');}}
 for(const key of cells){const[x,y]=key.split(',').map(Number);ctx.drawImage(atlas,terrain(x,y)*36+2,2,32,32,x*32,y*32,32,32);
 paintCliffContour(ctx,x,y,has);}
 if(stair)paintCliffTile(ctx,Math.floor(stair.x)*32,Math.floor(stair.y)*32,'stairs-north');
}
export function paintLedge(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,scenic=false,cells=gridMap('woods-upper').cells,upper=false){
 const l=woodsLedge,parts=new Set<string>();for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++)parts.add(`${x},${y}`);
 paintPlateau(ctx,atlas,parts,(x,y)=>scenic?0:cells[l.y+y][l.x+x],scenic?undefined:{x:3.5,y:upper?2:l.height+2});
}
export function paintRidge(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,ridge:WoodsRidge,upperCells=gridMap('woods-upper').cells,upper=false){
 paintPlateau(ctx,atlas,ridgeCells(ridge),(x,y)=>upperCells[y][x],{x:ridge.stair.x,y:ridge.stair.y+(upper?0:3)});
}
/** Scenic footprints retain their authored size; two rows are reserved for rock faces. */
export function paintScenicCliff(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,size:number){
 const cells=new Set<string>();for(let y=0;y<size-2;y++)for(let x=0;x<size;x++)cells.add(`${x},${y}`);paintPlateau(ctx,atlas,cells,()=>0);
}
export function paintWoodsCliffs(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,upperCells=gridMap('woods-upper').cells){
 const map=gridMap('woods');for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(x===0||y===0||x===map.width-1||y===map.height-1)paintCliffTile(ctx,x*32,y*32,y===0?'face-top':y===map.height-1?'face-bottom':'face-middle',false,x%3);
 for(const r of woodsRidges)paintRidge(ctx,atlas,r,upperCells);
 for(const c of woodsCliffs){ctx.save();ctx.translate(c.x*32,c.y*32);paintScenicCliff(ctx,atlas,c.size);ctx.restore();}
}
export function drawRaisedFloor(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 if(region!=='woods'&&region!=='woods-upper')return;
 const l=woodsLedge,key=`woods-visible-ledge-${region}`;
 for(const r of woodsRidges){
  const minX=Math.min(...r.parts.map(p=>p.x)),minY=Math.min(...r.parts.map(p=>p.y)),maxX=Math.max(...r.parts.map(p=>p.x+p.w)),maxY=Math.max(...r.parts.map(p=>p.y+p.h))+2,key=`woods-ridge-${r.id}-${region}`;
  if(!scene.textures.exists(key)){const t=scene.textures.createCanvas(key,(maxX-minX)*32,(maxY-minY)*32)!;const ctx=t.getContext();ctx.translate(-minX*32,-minY*32);paintRidge(ctx,scene.textures.get('terrain-woods-32').getSourceImage() as HTMLImageElement,r,undefined,region==='woods-upper');t.refresh();}
  scene.add.image(minX*64,minY*64,key).setOrigin(0).setScale(2).setDepth(maxY*64-1).setData('raisedRidge',r.id);
  const stair=stairsFor(region).find(s=>s.id===`woods-ridge-${r.id}-${region==='woods'?'up':'down'}`)!;
  const zone=scene.add.zone(stair.x*64,stair.y*64,64,64).setInteractive({useHandCursor:true}).setDepth(maxY*64+1).setData('stair',stair.id);
  zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
  scene.add.text(r.stair.x*64,(r.stair.y+.5)*64,stair.label,{fontSize:'12px',color:'#f0e2bc',backgroundColor:'#233d37'}).setOrigin(.5).setDepth(maxY*64+2);
 }

 for(const c of woodsCliffs){const scenicKey=`woods-scenic-cliff-${c.size}`;
 if(!scene.textures.exists(scenicKey)){const t=scene.textures.createCanvas(scenicKey,c.size*32,c.size*32)!;paintScenicCliff(t.getContext(),scene.textures.get('terrain-woods-32').getSourceImage() as HTMLImageElement,c.size);t.refresh();}
 scene.add.image(c.x*64,c.y*64,scenicKey).setOrigin(0).setScale(2).setDepth((c.y+c.size)*64-1).setData('scenicCliff',true);}

 if(!scene.textures.exists(key)){const texture=scene.textures.createCanvas(key,l.width*32,(l.height+l.faceHeight+1)*32)!;paintLedge(texture.getContext(),scene.textures.get('terrain-woods-32').getSourceImage() as HTMLImageElement,false,undefined,region==='woods-upper');texture.refresh();}
 scene.add.image(l.x*64,l.y*64,key).setOrigin(0).setScale(2).setDepth((l.y+l.height+l.faceHeight)*64-1).setData('raisedFloor','woods-upper');
 const stair=stairsFor(region).find(s=>s.id.startsWith('woods-ledge-'))!,up=stair.direction==='up',size=64;
 const zone=scene.add.zone(stair.x*64,stair.y*64,size,size).setInteractive({useHandCursor:true}).setDepth(2000).setData('stair',stair.id);
 zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
 scene.add.text(stair.x*64,(up?stair.y-2.6:7.3)*64,stair.label,{fontSize:'12px',color:'#f0e2bc',backgroundColor:'#233d37'}).setOrigin(.5).setDepth(2001);
}
