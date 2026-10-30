import type Phaser from 'phaser';
import {elderwoodSize,elderwoodRimStairs,onElderwoodRim,stairsFor} from '@realm/game-data';
export function paintVillageCliffs(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource){
 const {width,height}=elderwoodSize;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(x>=5&&x<width-5&&y>=5&&y<height-5)continue;
  const px=x*32,py=y*32;
  ctx.fillStyle='#354b40';ctx.fillRect(px,py,32,32);
  for(let i=0;i<2;i++){const j=(x*11+y*7+i*5)%9,top=py+i*17;
   ctx.beginPath();ctx.moveTo(px-3,top+3);ctx.lineTo(px+12+j,top-2);ctx.lineTo(px+34,top+3);ctx.lineTo(px+30,top+17);ctx.lineTo(px+8,top+21);ctx.lineTo(px-2,top+15);ctx.closePath();ctx.fillStyle=['#657568','#758273','#53685e','#7e8875'][(x+y+i)%4];ctx.fill();ctx.strokeStyle='#354b40';ctx.lineWidth=1;ctx.stroke();
  }
  if(onElderwoodRim(x,y)){ctx.drawImage(atlas,2,2,32,32,px,py,32,32);ctx.strokeStyle='#506c38';ctx.lineWidth=2;ctx.strokeRect(px+1,py+1,30,30);}
 }
 for(const s of elderwoodRimStairs){ctx.save();ctx.translate(s.top.x*32,s.top.y*32);ctx.rotate(Math.atan2(s.y-s.top.y,s.x-s.top.x)-Math.PI/2);
  ctx.fillStyle='#354b40';ctx.fillRect(-19,0,38,96);
  for(let i=0;i<12;i++){const w=28+i*.7,y=i*8;ctx.fillStyle='#3b5145';ctx.fillRect(-w/2,y,w,8);ctx.fillStyle=i%2?'#91a084':'#819477';ctx.fillRect(-w/2,y,w,5);ctx.fillStyle='#b8c3a0';ctx.fillRect(-w/2+1,y,w-2,1);}
  ctx.restore();
 }
}
export function drawVillageCliffStairs(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 if(region!=='elderwood'&&region!=='elderwood-upper')return;
 for(const s of elderwoodRimStairs){const up=region==='elderwood',stair=stairsFor(region).find(r=>r.id===`elderwood-rim-${s.id}-${up?'up':'down'}`)!;
 const x=up?(s.x+s.top.x)/2:s.top.x,y=up?(s.y+s.top.y)/2:s.top.y;
 const zone=scene.add.zone(x*64,y*64,110,110).setInteractive({useHandCursor:true}).setDepth(10000).setData('stair',stair.id);
 zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
 scene.add.text(x*64,y*64-45,up?'↑ Cliff walk':'↓ Village',{fontSize:'11px',color:'#eee4c3',backgroundColor:'#243f32'}).setOrigin(.5).setDepth(10001);
 }
}
