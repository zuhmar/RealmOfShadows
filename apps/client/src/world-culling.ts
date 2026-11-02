import type Phaser from 'phaser';
interface Entry{object:Phaser.GameObjects.GameObject;x:number;y:number;right:number;bottom:number}
/** Static map bounds are captured once; camera filtering never overwrites roof/window visibility. */
export class WorldCulling{
 private entries:Entry[]=[];private nextAt=0;private zoom=0;visible=0;total=0;
 replace(objects:Phaser.GameObjects.GameObject[]){
  this.entries=[];for(const object of objects){const item=object as Phaser.GameObjects.GameObject&{getBounds?:()=>{x:number;y:number;width:number;height:number}};
   if(object.getData('terrainRegion')||!item.getBounds)continue;const r=item.getBounds();if(r.width<=0||r.height<=0)continue;this.entries.push({object,x:r.x,y:r.y,right:r.x+r.width,bottom:r.y+r.height});
  }this.total=this.entries.length;this.nextAt=0;
 }
 update(camera:Phaser.Cameras.Scene2D.Camera,now:number){
  if(now<this.nextAt&&this.zoom===camera.zoom)return;this.nextAt=now+100;this.zoom=camera.zoom;
  const width=camera.width/camera.zoomX,height=camera.height/camera.zoomY,left=camera.scrollX+camera.width/2-width/2-256,top=camera.scrollY+camera.height/2-height/2-256,right=left+width+512,bottom=top+height+512;let visible=0;
  for(const e of this.entries){const show=e.right>=left&&e.x<=right&&e.bottom>=top&&e.y<=bottom;e.object.cameraFilter=(e.object.cameraFilter&~camera.id)|(show?0:camera.id);if(show)visible++;}this.visible=visible;
 }
}
