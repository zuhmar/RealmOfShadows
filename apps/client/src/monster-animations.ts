import type Phaser from 'phaser';
import wolfUrl from '../../../assets/monsters/generated/wolf-animations.png?url';
import spiderUrl from '../../../assets/monsters/generated/spider-animations.png?url';
import {monsterFrames} from './monster-frames';
import type {Facing} from '@realm/game-data';
export type AnimatedMonster='wolf'|'spider';
export const animatedMonsters=[{kind:'wolf',key:'painted-wolf',url:wolfUrl,scale:.48,width:112,height:106},{kind:'spider',key:'painted-spider',url:spiderUrl,scale:.55,width:130,height:112}] as const;
export function installMonsterAnimations(scene:Phaser.Scene){
 for(const sheet of animatedMonsters){
  const image=scene.textures.get(sheet.key).getSourceImage() as HTMLImageElement;
  for(const direction of ['down','left','right','up'] as const){
   for(let i=0;i<8;i++){
    const frame=monsterFrames[sheet.kind][direction][i],key=`${sheet.key}-${direction}-${i}`;
    const texture=scene.textures.createCanvas(key,256,256)!,context=texture.getContext();
    context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
    context.drawImage(image,...frame.source as [number,number,number,number],...frame.placement as [number,number,number,number]);texture.refresh();
   }
   for(const [action,indices,fps,repeat] of [['idle',[0,1],3,-1],['walk',[2,3,4,5],9,-1],['attack',[0,6,6,0],12,0],['death',[7],1,0]] as const){
    scene.anims.create({key:`${sheet.key}-${action}-${direction}`,frames:indices.map(i=>({key:`${sheet.key}-${direction}-${i}`})),frameRate:fps,repeat});
   }
  }
 }
}
export function animatedMonster(kind:string){return animatedMonsters.find(sheet=>sheet.kind===kind);}
export function playMonster(sprite:Phaser.GameObjects.Sprite,kind:AnimatedMonster,action:'idle'|'walk'|'attack'|'death',facing:Facing){
 sprite.play(`painted-${kind}-${action}-${facing}`,true);
}
