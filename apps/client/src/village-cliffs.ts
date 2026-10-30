import {paintCliffTile} from './cliff-tiles';
import type Phaser from 'phaser';
import {elderwoodSize,elderwoodRimStairs,onElderwoodRim,stairsFor} from '@realm/game-data';
/** A two-tile rock band assembled from native faces, edges and four corner parts. */
export function paintVillageCliffs(ctx:CanvasRenderingContext2D,atlas:CanvasImageSource){
 const{width:W,height:H}=elderwoodSize;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 if(x===0||y===0||x===W-1||y===H-1){paintCliffTile(ctx,x*32,y*32,'face-bottom',true,(x+y)%3);continue;}
 if(onElderwoodRim(x,y)){ctx.drawImage(atlas,2,2,32,32,x*32,y*32,32,32);continue;}
 if(x<5||x>=W-5||y<5||y>=H-5){const north=y<5,south=y>=H-5,west=x<5,east=x>=W-5;
 const part=north&&west?'nw':north&&east?'ne':south&&west?'sw':south&&east?'se':(north?y===3:south?y===H-5:west?x===3:x===W-5)?'face-top':'face-bottom';
 paintCliffTile(ctx,x*32,y*32,part,true,(x+y)%3);}
 }
 for(const s of elderwoodRimStairs)paintCliffStairs(ctx,s);
}
/** Direction-specific stair parts occupy a one-cell-wide run, with no artwork scaling. */
export function paintCliffStairs(ctx:CanvasRenderingContext2D,s:typeof elderwoodRimStairs[number]){
 const horizontal=s.x!==s.top.x,part=`stairs-${s.id}` as const;
 const start=Math.floor(horizontal?Math.min(s.x,s.top.x):Math.min(s.y,s.top.y)),end=Math.floor(horizontal?Math.max(s.x,s.top.x):Math.max(s.y,s.top.y));
 for(let t=start;t<=end;t++)paintCliffTile(ctx,(horizontal?t:Math.floor(s.x))*32,(horizontal?Math.floor(s.y):t)*32,part,true);
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
