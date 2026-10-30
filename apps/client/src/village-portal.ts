import type Phaser from 'phaser';
/** Stationary, one-grid portal with animated violet electrical static. */
export function paintVillagePortal(ctx:CanvasRenderingContext2D,time=0,clear=true){
 ctx.save();ctx.beginPath();ctx.rect(0,0,64,64);ctx.clip();if(clear)ctx.clearRect(0,0,64,64);
 const pulse=.5+.5*Math.sin(time*.003),gradient=ctx.createRadialGradient(32,34,3,32,34,28);
 gradient.addColorStop(0,'#f0c4ff');gradient.addColorStop(.3,'#a34bf2');gradient.addColorStop(.7,'#58229c');gradient.addColorStop(1,'#2b124f');
 ctx.fillStyle='#21132fbb';ctx.beginPath();ctx.ellipse(32,43,29,14,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(32,33,25,19,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#deb0ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(32,33,26,20,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#9c57e7';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(32,33,29,23,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle=`rgba(241,211,255,${.5+pulse*.4})`;ctx.lineWidth=1.4;
 for(let ring=0;ring<3;ring++){ctx.beginPath();for(let i=0;i<=15;i++){const a=i/15*Math.PI*2+time*.0004+ring*2,r=8+ring*7+Math.sin(i*4+Math.floor(time/100))*2,x=32+Math.cos(a)*r,y=33+Math.sin(a)*r*.65;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
 for(let i=0;i<5;i++){const a=i*1.25+Math.floor(time/120)*.37,x=32+Math.cos(a)*25,y=33+Math.sin(a)*21;ctx.strokeStyle=i%2?'#d9a6ff':'#b66eff';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(a)*3,y-5);ctx.lineTo(x-2,y-8);ctx.stroke();}
 ctx.restore();
}
export function drawVillagePortal(scene:Phaser.Scene,x:number,y:number){
 const key='village-purple-static';const texture=(scene.textures.exists(key)?scene.textures.get(key):scene.textures.createCanvas(key,64,64)) as Phaser.Textures.CanvasTexture;
 paintVillagePortal(texture.getContext());texture.refresh();const image=scene.add.image(x*64,y*64,key).setDisplaySize(64,64).setDepth(y*64+.1).setData('villagePortal',true);
 const timer=scene.time.addEvent({delay:90,loop:true,callback:()=>{paintVillagePortal(texture.getContext(),scene.time.now);texture.refresh();}});image.once('destroy',()=>timer.remove());return image;
}
