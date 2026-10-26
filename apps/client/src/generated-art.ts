import type Phaser from 'phaser';
import {generatedSheets,type GeneratedFrame} from './generated-manifest';
import {installMapObjectTiles} from './map-object-tiles';
export {generatedSheets};
export const generatedSourceSheets=generatedSheets.filter(sheet=>!['generated-buildings','generated-village','generated-forest'].includes(sheet.key));
// Atlas extraction is normal game texture preparation. No generated source PNG
// is rewritten; original logical canvases and transparent rig offsets are retained.
export function installGeneratedArt(scene:Phaser.Scene){
 installMapObjectTiles(scene);
 for(const sheet of generatedSourceSheets){const source=scene.textures.get(sheet.key).getSourceImage() as HTMLImageElement;
  for(const [key,frame]of Object.entries(sheet.frames)){if(scene.textures.exists(key))continue;
   const [w,h]=frame.size,scale=sheet.scale,texture=scene.textures.createCanvas(key,w*scale,h*scale)!;
   paintFrame(texture.getContext(),source,frame,scale);
   texture.refresh();
  }
 }
}
function paintFrame(context:CanvasRenderingContext2D,source:CanvasImageSource,frame:GeneratedFrame,scale=1){
 const [x,y,w,h]=frame.source,[dx,dy,dw,dh]=frame.placement;
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,x,y,w,h,dx*scale,dy*scale,dw*scale,dh*scale);
}
let itemImage:Promise<HTMLImageElement>|undefined;
const itemUrls=new Map<string,Promise<string|undefined>>();
export function generatedItemUrl(id:string){
 if(itemUrls.has(id))return itemUrls.get(id)!;
 const sheet=generatedSheets.find(sheet=>sheet.key==='generated-items')!,frame=sheet.frames[`doll-item-${id}`];if(!frame)return Promise.resolve(undefined);
 itemImage??=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Item artwork failed to load'));image.src=sheet.url;});
 const result=itemImage.then(image=>{const canvas=document.createElement('canvas');[canvas.width,canvas.height]=frame.size;paintFrame(canvas.getContext('2d')!,image,frame);return canvas.toDataURL('image/png');}).catch(()=>undefined);
 itemUrls.set(id,result);return result;
}
