import {paintCliffStudy} from './cliff-study';
import {paintCliffContour,paintCliffTile} from './cliff-tiles';
import type Phaser from 'phaser';
import {gridMap,elderwoodTown,elderwoodSize,elderwoodRimStairs,elderwoodStairTile,onElderwoodRim,onElderwoodLand,stairsFor} from '@realm/game-data';
/** Outdoor upper surfaces, including the short paved recesses through the cliff band. */
export function villageCliffSurface(x:number,y:number,cells=gridMap('elderwood-upper').cells){
 if(onElderwoodRim(x,y))return true;
 const lx=x-elderwoodTown.x,ly=y-elderwoodTown.y;
 const band=lx>=3&&lx<elderwoodTown.width-3&&ly>=3&&ly<elderwoodTown.height-3&&(lx<5||lx>=elderwoodTown.width-5||ly<5||ly>=elderwoodTown.height-5);
 return band&&cells[y]?.[x]===2;
}
/** A two-tile rock band assembled from native faces, edges and four corner parts. */
export function paintVillageCliffs(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,upperFloor=false){
 const{width:W,height:H}=elderwoodSize;const T=elderwoodTown,upper=gridMap('elderwood-upper').cells;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 if(!onElderwoodLand(x,y)){
  ctx.fillStyle='#172e35';ctx.fillRect(x*32,y*32,32,32);
  // Two native face rows descend from each exposed southern ledge, including inlet corners.
  if(onElderwoodLand(x,y-1))paintCliffTile(ctx,x*32,y*32,'face-top',true,x,'south','top',false);
  else if(onElderwoodLand(x,y-2))paintCliffTile(ctx,x*32,y*32,'face-bottom',true,x,'south','bottom',false);
  continue;
 }
 if(villageCliffSurface(x,y,upper)){ctx.drawImage(atlas,upper[y][x]*36+2,2,32,32,x*32,y*32,32,32);paintVillageOuterRim(ctx,x,y);continue;}
 const lx=x-T.x,ly=y-T.y;
 if(lx>=3&&lx<T.width-3&&ly>=3&&ly<T.height-3&&(lx<5||lx>=T.width-5||ly<5||ly>=T.height-5)){
 const north=ly<5,south=ly>=T.height-5,west=lx<5,east=lx>=T.width-5;
 const section=north?(ly===3?'top':'bottom'):south?(ly===T.height-5?'top':'bottom'):undefined;
 const cornerWest=west&&lx===3,cornerEast=east&&lx===T.width-4;
 const part=north&&cornerWest?'nw':north&&cornerEast?'ne':south&&cornerWest?'sw':south&&cornerEast?'se':section==='top'?'face-top':section==='bottom'?'face-bottom':'face-middle';
 paintCliffTile(ctx,x*32,y*32,part,true,x,north?'south':south?'north':west?'east':'west',section,false);}
 }
 paintCliffStudy(ctx,atlas,upperFloor);
}
/** One complete flight occupies exactly the clickable transition cell. */
export function paintCliffStairs(ctx:CanvasRenderingContext2D,s:typeof elderwoodRimStairs[number],_upper=false){
 const p=elderwoodStairTile(s);
 paintCliffTile(ctx,Math.floor(p.x)*32,Math.floor(p.y)*32,`stairs-${s.id}`,true);
}
export function drawVillageCliffStairs(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 if(region!=='elderwood'&&region!=='elderwood-upper')return;
 for(const s of elderwoodRimStairs){const up=region==='elderwood',stair=stairsFor(region).find(r=>r.id===`elderwood-rim-${s.id}-${up?'up':'down'}`)!;
 const {x,y}=elderwoodStairTile(s);
 const zone=scene.add.zone(x*64,y*64,64,64).setInteractive({useHandCursor:true}).setDepth(10000).setData('stair',stair.id);
 zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
 scene.add.text(x*64,y*64-45,up?'↑ Cliff walk':'↓ Village',{fontSize:'11px',color:'#eee4c3',backgroundColor:'#243f32'}).setOrigin(.5).setDepth(10001);
 }
}

/** Exposed cap edges follow the shared collision contour on both floors. */
export function paintVillageOuterRim(ctx:CanvasRenderingContext2D,x:number,y:number){
 const upper=gridMap('elderwood-upper').cells;
 // Paving replaces the earth lip at an opening; no grass border is painted over stone.
 if(upper[y]?.[x]===2)return;
 if(villageCliffSurface(x,y,upper))paintCliffContour(ctx,x,y,(xx,yy)=>villageCliffSurface(xx,yy,upper),true);
}
