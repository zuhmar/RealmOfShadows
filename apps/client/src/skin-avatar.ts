import Phaser from 'phaser';
import {type CosmeticLook,type Facing} from '@realm/game-data';
const files=import.meta.glob('../../../assets/skins/runtime/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const skinAssets=Object.entries(files).map(([path,url])=>({key:path.split('/').at(-1)!.replace('.webp',''),url}));
export function installSkinAnimations(scene:Phaser.Scene){for(const skin of ['citizen','knight','archer','mage','rogue'])for(const direction of ['down','left','right','up'])for(const action of ['idle','walk']){const key=`skin-${skin}-${action}-${direction}`,indices=action==='idle'?[0,1]:[2,3,4,5];if(scene.textures.exists(`skin-${skin}-${direction}-0`))scene.anims.create({key,frames:indices.map(i=>({key:`skin-${skin}-${direction}-${i}`})),frameRate:action==='idle'?2:8,repeat:-1});}}
/** One fully drawn animated character; accessories are independent cosmetic overlays. */
export class SkinAvatar extends Phaser.GameObjects.Container{
 sprite:Phaser.GameObjects.Sprite;wings:Phaser.GameObjects.Image;aura:Phaser.GameObjects.Image;
 look:CosmeticLook={skin:'citizen',wings:'none',aura:'none'};
 constructor(scene:Phaser.Scene){super(scene,0,0);this.sprite=scene.make.sprite({key:'skin-citizen-down-0',add:false}).setOrigin(.5,1).setScale(.5);this.wings=scene.make.image({key:'__WHITE',add:false}).setPosition(0,-40).setVisible(false);this.aura=scene.make.image({key:'__WHITE',add:false}).setPosition(0,0).setVisible(false);this.add([this.aura,this.wings,this.sprite]);}
 pose(look:CosmeticLook,facing:Facing,moving:boolean,time:number){this.look={...look};const key=`skin-${look.skin}-${moving?'walk':'idle'}-${facing}`;
 this.sprite.setScale(.5).setOrigin(.5,154/160);if(this.scene.anims.exists(key))this.sprite.play(key,true);
 const wingKey=`wings-${look.wings}-${facing}`;this.wings.setVisible(look.wings!=='none'&&this.scene.textures.exists(wingKey));if(this.wings.visible){
  // Anchor the actual wing root to the upper back; never scale around the artwork center.
  const backHeight={citizen:34,knight:35,archer:36,mage:32,rogue:34}[look.skin];
  this.wings.setTexture(wingKey).setOrigin(.5,90/160).setPosition(facing==='left'?8:facing==='right'?-8:0,-backHeight).setScale(.6);
  if(facing==='up')this.bringToTop(this.wings);else this.bringToTop(this.sprite);
 }
 const auraKey=`aura-${look.aura}`;this.aura.setVisible(look.aura!=='none'&&this.scene.textures.exists(auraKey));if(this.aura.visible)this.aura.setTexture(auraKey).setScale(.5+Math.sin(time/500)*.012).setAlpha(.8+Math.sin(time/400)*.12);
 }
 portrait(canvas:HTMLCanvasElement){const ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();const factor=Math.min(canvas.width/(this.look.wings==='none'?85:130),(canvas.height-24)/90);ctx.translate(canvas.width/2,canvas.height-20);ctx.scale(factor,factor);
 for(const part of this.list as (Phaser.GameObjects.Image|Phaser.GameObjects.Sprite)[]){if(!part.visible)continue;const frame=part.frame;ctx.save();ctx.translate(part.x,part.y);ctx.scale(part.scaleX,part.scaleY);ctx.globalAlpha=part.alpha;ctx.drawImage(frame.source.image as CanvasImageSource,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,-part.originX*part.width+(frame.trimmed?frame.x:0),-part.originY*part.height+(frame.trimmed?frame.y:0),frame.cutWidth,frame.cutHeight);ctx.restore();}ctx.restore();}
}
