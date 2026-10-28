import type Phaser from 'phaser';
import {villageDoors} from '@realm/game-data';
export function drawTownDoors(scene:Phaser.Scene,region:string,states:ReadonlyMap<string,boolean>,click:(id:string)=>void){
 for(const door of villageDoors(region)){
  const image=scene.add.image((door.x-door.width/2)*64,(door.y-.7)*64,states.get(door.id)===false?'town-door-closed':'town-door-open').setOrigin(0).setDisplaySize(door.width*64,90).setDepth((door.y+.5)*64+2).setInteractive({useHandCursor:true}).setData('townDoor',door.id);
  image.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(door.id)});
 }
}
export function updateTownDoors(objects:Phaser.GameObjects.GameObject[],states:ReadonlyMap<string,boolean>){for(const object of objects){const id=object.getData('townDoor');if(id){const image=object as Phaser.GameObjects.Image,key=states.get(id)===false?'town-door-closed':'town-door-open';if(image.texture.key!==key)image.setTexture(key);}}}
