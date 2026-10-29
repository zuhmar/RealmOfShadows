import type Phaser from 'phaser';
import {woodsLedge,gridMap,stairsFor} from '@realm/game-data';
/** Shared by terrain previews and the depth-sorted outdoor floor overlay. */
export function paintLedge(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource){
 const l=woodsLedge,cells=gridMap('woods-upper').cells;
 for(let y=0;y<l.height+l.faceHeight;y++)for(let x=0;x<l.width;x++){
  const material=y<l.height?cells[l.y+y][l.x+x]:5;
  ctx.drawImage(atlas,material*36+2,2,32,32,x*32,y*32,32,32);
 }
 // Rock faces use stone courses instead of the Woods atlas's root-wall texture.
 ctx.fillStyle='#35494d';ctx.fillRect(0,l.height*32,l.width*32,l.faceHeight*32);
 const shades=['#687b7c','#76847b','#5d7071','#728183'];
 for(let row=0;row<2;row++)for(let col=0;col<6;col++){
  const x=col*32,y=l.height*32+row*32;
  ctx.beginPath();ctx.moveTo(x+4,y+2);ctx.lineTo(x+27,y+1);ctx.lineTo(x+31,y+7);ctx.lineTo(x+29,y+28);ctx.lineTo(x+5,y+31);ctx.lineTo(x+1,y+24);ctx.lineTo(x+2,y+7);ctx.closePath();ctx.fillStyle=shades[(row*3+col)%4];ctx.fill();ctx.strokeStyle='#2d4246';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+6,y+5);ctx.lineTo(x+25,y+4);ctx.strokeStyle='#aab39b77';ctx.lineWidth=1;ctx.stroke();
 }
 // Open stone treads connect the platform edge to the lower trail.
 for(let i=0;i<8;i++){
  const width=32+i*2,x=3.5*32-width/2,y=l.height*32+i*8;
  ctx.fillStyle='#41575a';ctx.fillRect(x,y,width,8);ctx.fillStyle='#8a998e';ctx.fillRect(x,y,width,5);
  ctx.strokeStyle='#bdc6ad';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+1,y+.5);ctx.lineTo(x+width-1,y+.5);ctx.stroke();
  ctx.strokeStyle='#293e43';ctx.beginPath();ctx.moveTo(x,y+7.5);ctx.lineTo(x+width,y+7.5);ctx.stroke();
 }
 ctx.strokeStyle='#536950';ctx.lineWidth=2;ctx.strokeRect(1,1,l.width*32-2,l.height*32-2);

}
export function drawRaisedFloor(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 if(region!=='woods'&&region!=='woods-upper')return;
 const l=woodsLedge,key='woods-visible-ledge';
 if(!scene.textures.exists(key)){const texture=scene.textures.createCanvas(key,l.width*32,(l.height+l.faceHeight)*32)!;paintLedge(texture.getContext(),scene.textures.get('terrain-woods-32').getSourceImage() as HTMLImageElement);texture.refresh();}
 scene.add.image(l.x*64,l.y*64,key).setOrigin(0).setScale(2).setDepth((l.y+l.height+l.faceHeight)*64-1).setData('raisedFloor','woods-upper');
 const stair=stairsFor(region).find(s=>s.id.startsWith('woods-ledge-'))!,up=stair.direction==='up',size=up?160:92;
 const zone=scene.add.zone(stair.x*64,(up?stair.y-1:stair.y+.75)*64,size,size).setInteractive({useHandCursor:true}).setDepth(2000).setData('stair',stair.id);
 zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(stair.id)});
 scene.add.text(stair.x*64,(up?stair.y-2.6:7.3)*64,stair.label,{fontSize:'12px',color:'#f0e2bc',backgroundColor:'#233d37'}).setOrigin(.5).setDepth(2001);
}
