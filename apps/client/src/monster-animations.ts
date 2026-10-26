import type Phaser from 'phaser';
import wolfUrl from '../../../assets/monsters/generated/wolf-animations.png?url';
import spiderUrl from '../../../assets/monsters/generated/spider-animations.png?url';
import boarUrl from '../../../assets/monsters/generated/boar-animations.png?url';
import bearUrl from '../../../assets/monsters/generated/bear-animations.png?url';
import batUrl from '../../../assets/monsters/generated/bat-animations.webp?url';
import crawlerUrl from '../../../assets/monsters/generated/crawler-animations.webp?url';
import golemUrl from '../../../assets/monsters/generated/golem-animations.webp?url';
import wyrmUrl from '../../../assets/monsters/generated/wyrm-animations.webp?url';
import {monsterFrames} from './monster-frames';
import {cavernsMonsterFrames} from './caverns-monster-frames';
import type {Facing} from '@realm/game-data';
export type AnimatedMonster='wolf'|'spider'|'boar'|'bear'|'bat'|'crawler'|'golem'|'wyrm';
const frames={...monsterFrames,...cavernsMonsterFrames};
export const animatedMonsters=[{kind:'wolf',key:'painted-wolf',url:wolfUrl,scale:.48,width:112,height:106},{kind:'spider',key:'painted-spider',url:spiderUrl,scale:.55,width:130,height:112},{kind:'boar',key:'painted-boar',url:boarUrl,scale:.62,width:140,height:130},{kind:'bear',key:'painted-bear',url:bearUrl,scale:1,width:220,height:220},{kind:'bat',key:'painted-bat',url:batUrl,frameSize:128,scale:.86,width:104,height:104},{kind:'crawler',key:'painted-crawler',url:crawlerUrl,frameSize:128,scale:1.06,width:128,height:126},{kind:'golem',key:'painted-golem',url:golemUrl,frameSize:192,scale:.96,width:174,height:174},{kind:'wyrm',key:'painted-wyrm',url:wyrmUrl,scale:1,width:240,height:240}] as const;
export function installMonsterAnimations(scene:Phaser.Scene){
 for(const sheet of animatedMonsters){
  const image=scene.textures.get(sheet.key).getSourceImage() as HTMLImageElement;
  for(const direction of ['down','left','right','up'] as const){
   for(let i=0;i<8;i++){
    const frame=frames[sheet.kind][direction][i],key=`${sheet.key}-${direction}-${i}`;
    const texture=scene.textures.createCanvas(key,'frameSize' in sheet?sheet.frameSize:256,'frameSize' in sheet?sheet.frameSize:256)!,context=texture.getContext(),factor=('frameSize' in sheet?sheet.frameSize:256)/256;
    context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
    context.drawImage(image,...frame.source as [number,number,number,number],...frame.placement.map(value=>value*factor) as [number,number,number,number]);texture.refresh();
   }
   for(const [action,indices,fps,repeat] of [['idle',[0,1],3,-1],['walk',[2,3,4,5],9,-1],['attack',[0,6,6,0],12,0],['death',[7],1,0]] as const){
    scene.anims.create({key:`${sheet.key}-${action}-${direction}`,frames:indices.map(i=>({key:`${sheet.key}-${direction}-${i}`})),frameRate:fps,repeat});
   }
  }
  // Every pose now owns its canvas texture; keep no duplicate full-sheet GPU
  // image after extraction, which matters with both islands' animations loaded.
  scene.textures.remove(sheet.key);
 }
}
export function animatedMonster(kind:string){return animatedMonsters.find(sheet=>sheet.kind===kind);}
export function playMonster(sprite:Phaser.GameObjects.Sprite,kind:AnimatedMonster,action:'idle'|'walk'|'attack'|'death',facing:Facing){
 sprite.play(`painted-${kind}-${action}-${facing}`,true);
}
