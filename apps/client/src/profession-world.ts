import Phaser from 'phaser';
import {resourceNodes,craftingBench,professionLevel,type ProfessionXp} from '@realm/game-data';
const files=import.meta.glob('../../../assets/items/professions/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const professionAssets=Object.entries(files).map(([path,url])=>({key:`resource-${path.split('/').at(-1)!.replace('.png','')}`,url}));
export function drawProfessionNodes(scene:Phaser.Scene,region:string,gather:(id:string)=>void,workbench:()=>void){
 for(const n of resourceNodes.filter(n=>n.region===region)){
 const image=scene.add.image(0,0,`resource-${n.skill==='fishing'?'fishingSpot':n.item}`).setDisplaySize(62,62).setOrigin(.5,.8),label=scene.add.text(0,-58,n.name,{fontSize:'11px',color:'#ead8a5',backgroundColor:'#183b32'}).setOrigin(.5);
 const zone=scene.add.zone(0,-25,Math.max(100,label.width+70),110).setInteractive({useHandCursor:true});zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())gather(n.id)});scene.add.container(n.x*64,n.y*64,[image,label,zone]).setDepth(n.y*64+2).setData('resource',n).setData('resourceImage',image).setData('resourceLabel',label);
 }
 if(region==='elderwood'){
 const x=craftingBench.x*64,y=craftingBench.y*64;scene.add.image(x,y,'depot-box').setDisplaySize(74,64).setOrigin(.5,1).setDepth(y);scene.add.text(x,y-80,'Crafting workbench',{fontSize:'12px',color:'#ffe1a8',backgroundColor:'#183b32'}).setOrigin(.5).setDepth(y+1);const zone=scene.add.zone(x,y-32,150,118).setData('workbench',true).setDepth(y+2).setInteractive({useHandCursor:true});zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())workbench()});
 }
}
export function updateProfessionNodes(objects:Phaser.GameObjects.GameObject[],bag:{nodeReadyAt?:Record<string,number>;professions?:ProfessionXp;time:number}){
 for(const object of objects){const n=object.getData('resource');if(!n)continue;const wait=Math.max(0,Math.ceil((bag.nodeReadyAt?.[n.id]??0)-bag.time)),locked=professionLevel(bag.professions?.[n.skill as keyof ProfessionXp]??0)<n.level;(object.getData('resourceImage') as Phaser.GameObjects.Image).setAlpha(wait?.35:1).setTint(locked?0x999999:0xffffff);(object.getData('resourceLabel') as Phaser.GameObjects.Text).setText(`${n.name} · ${wait?`${wait}s`:locked?`Requires Lv ${n.level}`:'Gather'}`);}
}
