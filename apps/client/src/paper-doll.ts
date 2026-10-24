import Phaser from 'phaser';
import {emptyEquipment,weapons,type Equipment,type Facing,type WeaponId} from '@realm/game-data';
const layers=import.meta.glob('../../../assets/characters/paper-doll/*.svg',{eager:true,query:'?url&no-inline',import:'default'}) as Record<string,string>;
const icons=import.meta.glob('../../../assets/items/*.svg',{eager:true,query:'?url&no-inline',import:'default'}) as Record<string,string>;
export const paperDollAssets=[...Object.entries(layers).map(([path,url])=>({key:`doll-${path.split('/').at(-1)!.replace('.svg','')}`,url})),...Object.entries(icons).filter(([path])=>Object.hasOwn(weapons,path.split('/').at(-1)!.replace('.svg',''))||path.endsWith('/woodenShield.svg')).map(([path,url])=>({key:`doll-item-${path.split('/').at(-1)!.replace('.svg','')}`,url}))];

// A small shared rig: the same pivots drive body parts, clothing and held items.
// SVGs are rasterized once by Phaser's loader; walking only transforms textures.
export class PaperDoll extends Phaser.GameObjects.Container{
 equipment:Equipment=emptyEquipment();weapon:WeaponId='wand';direction:Facing='down';moving=false;private signature='';
 private neck:Phaser.GameObjects.Image;private torso:Phaser.GameObjects.Image;private tunic:Phaser.GameObjects.Image;private head:Phaser.GameObjects.Container;private face:Phaser.GameObjects.Image;private hood:Phaser.GameObjects.Image;
 private legs:Phaser.GameObjects.Container[]=[];private trousers:Phaser.GameObjects.Image[]=[];private boots:Phaser.GameObjects.Image[]=[];
 private arms:Phaser.GameObjects.Container[]=[];private sleeves:Phaser.GameObjects.Image[]=[];private held:Phaser.GameObjects.Image;private shield:Phaser.GameObjects.Image;
 constructor(scene:Phaser.Scene){super(scene,0,0);this.setScale(.5);
 const image=(key:string,x=0,y=0,ox=.5,oy=0)=>scene.make.image({key,x,y,add:false}).setOrigin(ox,oy);
 for(let i=0;i<2;i++){const leg=new Phaser.GameObjects.Container(scene,0,-40);const base=image('doll-leg');const pants=image('doll-trousers');const boot=image('doll-boots',0,38,.5,1);leg.add([base,pants,boot]);this.legs.push(leg);this.trousers.push(pants);this.boots.push(boot);}
 for(let i=0;i<2;i++){const arm=new Phaser.GameObjects.Container(scene,0,-81);const sleeve=image('doll-sleeve');arm.add([image('doll-arm'),sleeve]);this.arms.push(arm);this.sleeves.push(sleeve);}
 this.neck=image('doll-neck',0,-91);this.torso=image('doll-torso-front',0,-82);this.tunic=image('doll-tunic-front',0,-82);
 this.face=image('doll-head-front',0,0,.5,1);this.hood=image('doll-hood-front',0,0,.5,1);this.head=new Phaser.GameObjects.Container(scene,0,-80,[this.face,this.hood]);
 this.held=image('doll-item-wand',0,38,.23,.82).setScale(.8);this.shield=image('doll-item-woodenShield',0,31,.5,.5).setScale(.65);
 this.arms[1].add(this.held);this.arms[0].add(this.shield);
 this.add([...this.legs,...this.arms,this.neck,this.torso,this.tunic,this.head]);this.outfit('wand',emptyEquipment());this.pose('down',false,0);
 }
 outfit(weapon:WeaponId,equipment:Equipment){const signature=JSON.stringify([weapon,equipment]);if(signature===this.signature)return;this.signature=signature;this.weapon=weapon;this.equipment={...equipment};
 this.held.setTexture(`doll-item-${weapon}`).setOrigin(weapons[weapon].kind==='arrow'?.5:.23,weapons[weapon].kind==='arrow'?.5:.82);
 this.hood.setVisible(Boolean(equipment.head));this.tunic.setVisible(Boolean(equipment.chest));for(const sleeve of this.sleeves)sleeve.setVisible(Boolean(equipment.chest));for(const pants of this.trousers)pants.setVisible(Boolean(equipment.legs));for(const boot of this.boots)boot.setVisible(Boolean(equipment.feet));this.shield.setVisible(Boolean(equipment.offhand));
 }
 pose(direction:Facing,moving:boolean,time:number){this.direction=direction;this.moving=moving;const side=direction==='left'||direction==='right',back=direction==='up',variant=side?'side':back?'back':'front';const phase=moving?Math.sin(time/95):0,bob=moving?-Math.abs(phase)*2:Math.sin(time/550)*.6;
 this.face.setTexture(`doll-head-${variant}`).setFlipX(direction==='left');this.hood.setTexture(`doll-hood-${variant}`).setFlipX(direction==='left');this.head.setY(-80+bob);this.neck.setY(-91+bob).setScale(side?.7:1,1);
 this.torso.setTexture(`doll-torso-${back?'back':'front'}`).setScale(side?.7:1,1).setY(-82+bob);this.tunic.setTexture(`doll-tunic-${back?'back':'front'}`).setScale(side?.7:1,1).setY(-82+bob);
 for(let i=0;i<2;i++){const sign=i===0?-1:1;this.legs[i].setPosition(sign*(side?4:10),-40+bob).setRotation(phase*sign*(side?.45:.12)).setScale(1,1+phase*sign*.04);this.arms[i].setPosition(sign*(side?7:24)*(back?-1:1),-81+bob).setRotation(phase*-sign*.3+(side?(direction==='left'?.12:-.12):sign*-.08));}
 this.held.setFlipX(direction==='left').setRotation(side?(direction==='left'?-.25:.2):back?-.5:.1);this.shield.setScale(side?.42:.65,.65);
 // Back arm/held item first when facing away; nearer arm last in side views.
 const near=direction==='left'?this.arms[0]:this.arms[1],far=near===this.arms[0]?this.arms[1]:this.arms[0];
 const order=back?[...this.legs,...this.arms,this.neck,this.torso,this.tunic,this.head]:side?[...this.legs,far,this.neck,this.torso,this.tunic,this.head,near]:[...this.legs,this.neck,this.torso,this.tunic,...this.arms,this.head];
 for(const part of order)this.bringToTop(part);
 }
 portrait(canvas:HTMLCanvasElement){const context=canvas.getContext('2d');if(!context)return;context.clearRect(0,0,canvas.width,canvas.height);context.save();context.translate(canvas.width/2,canvas.height-2);const scale=Math.min(canvas.width/128,(canvas.height-4)/150);context.scale(scale,scale);
 const paint=(object:Phaser.GameObjects.GameObject)=>{const part=object as Phaser.GameObjects.Image|Phaser.GameObjects.Container;if(!part.visible)return;context.save();context.translate(part.x,part.y);context.rotate(part.rotation);context.scale(part.scaleX,part.scaleY);context.globalAlpha*=part.alpha;
 if(part instanceof Phaser.GameObjects.Container){for(const child of part.list)paint(child);}else{const frame=part.frame;if(part.flipX)context.scale(-1,1);context.drawImage(frame.source.image as CanvasImageSource,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,-part.originX*part.width,-part.originY*part.height,part.width,part.height);}context.restore();};
 for(const child of this.list)paint(child);context.restore();
 }
}
