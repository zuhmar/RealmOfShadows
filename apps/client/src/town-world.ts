import Phaser from 'phaser';
import {townDoorVisual,townDoorTexture,villageDoors} from '@realm/game-data';
export function drawTownDoors(scene:Phaser.Scene,region:string,states:ReadonlyMap<string,boolean>,click:(id:string)=>void){
 for(const door of villageDoors(region)){
  const visual=townDoorVisual(door,states.get(door.id)!==false),scale=64/48;
  const image=scene.add.image(visual.x*scale,visual.y*scale,visual.key).setOrigin(0).setDisplaySize(visual.w*scale,visual.h*scale).setDepth(visual.footY*scale).setInteractive({useHandCursor:true,hitArea:new Phaser.Geom.Rectangle(0,30,door.width*64,50),hitAreaCallback:Phaser.Geom.Rectangle.Contains}).setData('townDoor',door.id).setData('townDoorWidth',door.width);
  image.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(door.id)});
 }
}
export function updateTownDoors(objects:Phaser.GameObjects.GameObject[],states:ReadonlyMap<string,boolean>){for(const object of objects){const id=object.getData('townDoor');if(id){const image=object as Phaser.GameObjects.Image,key=townDoorTexture(object.getData('townDoorWidth'),states.get(id)!==false);if(image.texture.key!==key)image.setTexture(key);}}}
