import Phaser from 'phaser';
import {gridMap,resourceNodes,fishingTarget,craftingBench,professionLevel,type ProfessionXp} from '@realm/game-data';
const files={...import.meta.glob('../../../assets/items/professions/*.png',{eager:true,query:'?url',import:'default'}),...import.meta.glob('../../../assets/professions/runtime/*.png',{eager:true,query:'?url',import:'default'})} as Record<string,string>;
export const professionAssets=Object.entries(files).map(([path,url])=>({key:`resource-${path.split('/').at(-1)!.replace('.png','')}`,url}));
export function drawProfessionNodes(scene:Phaser.Scene,region:string,gather:(id:string)=>void,workbench:()=>void){
 for(const n of resourceNodes.filter(n=>n.region===region)){
 const tree=n.skill==='woodcutting',key=`resource-${tree?'tree-':''}${n.item}`,image=scene.add.image(0,0,scene.textures.exists(key)?key:'resource-log').setDisplaySize(tree?112:62,tree?132:62).setOrigin(.5,tree?.96:.8),label=scene.add.text(0,tree?-142:-58,n.name,{fontSize:'11px',color:'#ead8a5',backgroundColor:'#183b32'}).setOrigin(.5);
 // Alpha-tested artwork lets visible foliage be clicked without letting a
 // large invisible tree rectangle intercept nearby monsters or water clicks.
 image.setInteractive({pixelPerfect:true,alphaTolerance:16,useHandCursor:true});label.setInteractive({useHandCursor:true});
 const zone=scene.add.zone(0,-10,70,64).setData('resourceHit',true).setInteractive({useHandCursor:true}),view=scene.add.container(n.x*64,n.y*64,[image,label,zone]).setDepth(n.y*64+2).setData('resource',n).setData('resourceImage',image).setData('resourceLabel',label).setData('resourceKey',image.texture.key);
 for(const part of [image,label,zone]){part.on('pointerover',()=>view.setData('hover',true));part.on('pointerout',()=>view.setData('hover',false));part.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown()&&(part!==zone||gridMap(region).cells[Math.floor(p.worldY/64)]?.[Math.floor(p.worldX/64)]!==3))gather(n.id)});}

 }
 scene.add.graphics().setDepth(2).setData('fishingCooldowns',region);
 if(region==='elderwood'){
 const x=craftingBench.x*64,y=craftingBench.y*64;scene.add.image(x,y,'depot-box').setDisplaySize(74,64).setOrigin(.5,1).setDepth(y);scene.add.text(x,y-80,'Crafting workbench',{fontSize:'12px',color:'#ffe1a8',backgroundColor:'#183b32'}).setOrigin(.5).setDepth(y+1);const zone=scene.add.zone(x,y-32,150,118).setData('workbench',true).setDepth(y+2).setInteractive({useHandCursor:true});zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())workbench()});
 }
}
export function updateProfessionNodes(objects:Phaser.GameObjects.GameObject[],bag:{nodeReadyAt?:Record<string,number>;professions?:ProfessionXp;time:number},actor?:{x:number;y:number}){
 for(const object of objects){const n=object.getData('resource');
 if(!n){const region=object.getData('fishingCooldowns');if(region){const key=JSON.stringify([Math.floor(bag.time),bag.nodeReadyAt]);if(object.getData('waterState')!==key){object.setData('waterState',key);const g=object as Phaser.GameObjects.Graphics;g.clear();g.lineStyle(2,0x7b969c,.55);for(const [id,ready]of Object.entries(bag.nodeReadyAt??{})){if(ready<=bag.time||!id.startsWith(`fish:${region}:`))continue;const water=fishingTarget(id);if(water)g.strokeEllipse(water.x*64,water.y*64,34,14);}}}continue;}
 const wait=Math.max(0,Math.ceil((bag.nodeReadyAt?.[n.id]??0)-bag.time)),locked=professionLevel(bag.professions?.[n.skill as keyof ProfessionXp]??0)<n.level,tree=n.skill==='woodcutting',image=object.getData('resourceImage') as Phaser.GameObjects.Image;
 if(tree){image.setTexture(wait?'woods-stump':object.getData('resourceKey')).setDisplaySize(wait?58:112,wait?42:132).setOrigin(.5,wait?.8:.96);}image.setAlpha(wait?tree?.65:.25:1).setTint(locked?0xc6c6c6:0xffffff);
 const label=object.getData('resourceLabel') as Phaser.GameObjects.Text;label.setY(tree&&!wait?-142:-58).setVisible(!actor||object.getData('hover')||Math.hypot(actor.x-n.x,actor.y-n.y)<3.5).setText(`${n.name} · ${wait?`${Math.floor(wait/60)}:${String(wait%60).padStart(2,'0')}`:locked?`Requires Lv ${n.level}`:tree?'Chop':'Gather'}`);
 }
}
