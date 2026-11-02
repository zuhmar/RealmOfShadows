import {paintCliffStudy} from './cliff-study';
import {paintCliffContour,paintCliffTile} from './cliff-tiles';
import type Phaser from 'phaser';
import {gridMap,elderwoodTown,elderwoodSize,elderwoodRimStairs,elderwoodStairTile,onElderwoodRim,onElderwoodLand,onElderwoodLowland,elderwoodCliffDistance,stairsFor} from '@realm/game-data';
export {villageCliffFace} from './village-cliff-facing';
import {villageCliffFace} from './village-cliff-facing';
/** Outdoor upper surfaces, including hidden rear/side slopes and paved stair recesses. */
export function villageCliffSurface(x:number,y:number,cells=gridMap('elderwood-upper').cells){
 return onElderwoodRim(x,y)||onElderwoodLand(x,y)&&!onElderwoodLowland(x,y)&&(cells[y]?.[x]===2||elderwoodCliffDistance(x,y)<=2&&!villageCliffFace(x,y));
}
/** Rounded contact profiles remain inside each native tile; stone scale is unchanged. */
function paintVillageFace(c:CanvasRenderingContext2D,atlas:CanvasImageSource,x:number,y:number,facing:'north'|'south'|'east'|'west',section:'top'|'bottom',foot:boolean,water=false){
 c.save();c.translate(x*32,y*32);
 if(water){c.fillStyle='#172e35';c.fillRect(0,0,32,32);}else c.drawImage(atlas,2,2,32,32,0,0,32,32);
 const at=(t:number,d:number):[number,number]=>facing==='south'?[t,d]:facing==='north'?[t,32-d]:facing==='east'?[d,t]:[32-d,t];
 c.save();if(foot){c.beginPath();c.moveTo(...at(0,0));c.lineTo(...at(32,0));c.lineTo(...at(32,27));c.quadraticCurveTo(...at(28,32),...at(23,29));c.lineTo(...at(20,30));c.quadraticCurveTo(...at(15,32),...at(11,29));c.lineTo(...at(8,30));c.quadraticCurveTo(...at(3,31),...at(0,27));c.closePath();c.clip();}
 paintCliffTile(c,0,0,section==='top'?'face-top':'face-bottom',true,x+y*3,facing,section,false);c.restore();
 if(foot){c.strokeStyle='#263c3199';c.lineWidth=1.3;c.beginPath();c.moveTo(...at(0,27));c.quadraticCurveTo(...at(3,31),...at(8,30));c.lineTo(...at(11,29));c.quadraticCurveTo(...at(15,32),...at(20,30));c.lineTo(...at(23,29));c.quadraticCurveTo(...at(28,32),...at(32,27));c.stroke();}
 c.restore();
}
/** The cliff and collision contours share the same scalloped village footprint. */
export function paintVillageCliffs(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource,upperFloor=false){
 const{width:W,height:H}=elderwoodSize,upper=gridMap('elderwood-upper').cells;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  if(!onElderwoodLand(x,y)){
   ctx.fillStyle='#172e35';ctx.fillRect(x*32,y*32,32,32);
   if(onElderwoodLand(x,y-1))paintVillageFace(ctx,atlas,x,y,'south','top',false,true);
   else if(onElderwoodLand(x,y-2))paintVillageFace(ctx,atlas,x,y,'south','bottom',true,true);
   continue;
  }
  if(villageCliffSurface(x,y,upper)){ctx.drawImage(atlas,(upper[y][x]===2?2:0)*36+2,2,32,32,x*32,y*32,32,32);paintVillageOuterRim(ctx,x,y);continue;}
  const distance=elderwoodCliffDistance(x,y);if(!distance||distance>2)continue;
  const section=villageCliffFace(x,y);
  if(section)paintVillageFace(ctx,atlas,x,y,'south',section,section==='bottom');
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
