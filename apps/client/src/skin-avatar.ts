import Phaser from 'phaser';
import {skinDefinitions,wingDefinitions,auraDefinitions,type CosmeticLook,type Facing} from '@realm/game-data';
const files=import.meta.glob('../../../assets/skins/reference-runtime/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const skinAssets=Object.entries(files).map(([path,url])=>({key:path.split('/').at(-1)!.replace('.webp',''),url}));
const directions=['down','left','right','up'] as const;
export function installSkinAnimations(scene:Phaser.Scene){
 for(const skin of Object.keys(skinDefinitions)){
  const key=`skin-${skin}`;if(!scene.textures.exists(key))continue;const texture=scene.textures.get(key);
  for(const [row,direction]of directions.entries()){
   for(let i=0;i<6;i++)if(!texture.has(`${direction}-${i}`))texture.add(`${direction}-${i}`,0,i*160,row*160,160,160);
   for(const action of ['idle','walk']){const animation=`skin-${skin}-${action}-${direction}`;if(!scene.anims.exists(animation))scene.anims.create({key:animation,frames:(action==='idle'?[0]:[2,3,4,5]).map(i=>({key,frame:`${direction}-${i}`})),frameRate:action==='idle'?2:8,repeat:-1});}
  }
 }
 for(const wing of Object.keys(wingDefinitions))if(wing!=='none'&&scene.textures.exists(`wings-${wing}`)){const t=scene.textures.get(`wings-${wing}`);for(const [i,direction]of directions.entries())if(!t.has(direction))t.add(direction,0,i*192,0,192,160);}
 for(const aura of Object.keys(auraDefinitions))if(aura!=='none'&&scene.textures.exists(`aura-${aura}`)){const t=scene.textures.get(`aura-${aura}`);for(const [layerIndex,layer]of ['back','front'].entries())for(let i=0;i<3;i++)if(!t.has(`${layer}-${i}`))t.add(`${layer}-${i}`,0,(layerIndex*3+i)*192,0,192,192);}
}
/** Reference-based complete outfits; shared directional wings and layered animated auras. */
export class SkinAvatar extends Phaser.GameObjects.Container{
 sprite:Phaser.GameObjects.Sprite;wings:Phaser.GameObjects.Image;aura:Phaser.GameObjects.Image;auraFront:Phaser.GameObjects.Image;
 look:CosmeticLook={skin:'citizen',wings:'none',aura:'none'};
 constructor(scene:Phaser.Scene){super(scene,0,0);this.sprite=scene.make.sprite({key:'skin-citizen',frame:'down-0',add:false}).setOrigin(.5,154/160).setScale(.5);this.wings=scene.make.image({key:'__WHITE',add:false}).setVisible(false);this.aura=scene.make.image({key:'__WHITE',add:false}).setVisible(false);this.auraFront=scene.make.image({key:'__WHITE',add:false}).setVisible(false);this.add([this.aura,this.wings,this.sprite,this.auraFront]);}
 pose(look:CosmeticLook,facing:Facing,moving:boolean,time:number){
  this.look={...look};const key=`skin-${look.skin}-${moving?'walk':'idle'}-${facing}`;
  if(this.scene.anims.exists(key)){
   if(moving)this.sprite.play(key,true);
   else if(this.sprite.anims.currentAnim?.key!==key||this.sprite.anims.isPlaying){
    // Generated breathing poses can change stance. Keep the neutral pose planted.
    this.sprite.play(key);this.sprite.anims.pause(this.sprite.anims.currentAnim!.frames[0]);
   }
  }
  const wingKey=`wings-${look.wings}`;this.wings.setVisible(look.wings!=='none'&&this.scene.textures.exists(wingKey));
  if(this.wings.visible){this.wings.setTexture(wingKey,facing).setOrigin(.5,90/160).setPosition(facing==='left'?8:facing==='right'?-8:0,-skinDefinitions[look.skin].backHeight).setScale(.6);if(facing==='up')this.bringToTop(this.wings);else this.bringToTop(this.sprite);}
  const auraKey=`aura-${look.aura}`,visible=look.aura!=='none'&&this.scene.textures.exists(auraKey),phase=[0,1,2,1][Math.floor(time/220)%4];this.aura.setVisible(visible);this.auraFront.setVisible(visible);
  if(visible){this.aura.setTexture(auraKey,`back-${phase}`).setOrigin(.5,162/192).setScale(.6).setAlpha(.9);this.auraFront.setTexture(auraKey,`front-${phase}`).setOrigin(.5,162/192).setScale(.6).setAlpha(.9);}
  this.bringToTop(this.auraFront);
 }
 portrait(canvas:HTMLCanvasElement){const ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();const factor=Math.min(canvas.width/(this.look.wings==='none'&&this.look.aura==='none'?85:140),(canvas.height-24)/115);ctx.translate(canvas.width/2,canvas.height-20);ctx.scale(factor,factor);
  for(const part of this.list as (Phaser.GameObjects.Image|Phaser.GameObjects.Sprite)[]){if(!part.visible)continue;const frame=part.frame;ctx.save();ctx.translate(part.x,part.y);ctx.scale(part.scaleX,part.scaleY);ctx.globalAlpha=part.alpha;ctx.drawImage(frame.source.image as CanvasImageSource,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,-part.originX*part.width+(frame.trimmed?frame.x:0),-part.originY*part.height+(frame.trimmed?frame.y:0),frame.cutWidth,frame.cutHeight);ctx.restore();}ctx.restore();
 }
}
