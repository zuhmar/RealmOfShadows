import type Phaser from 'phaser';
import {paintConnectedTerrain} from './connected-terrain';
import {gridMap,islandForRegion,type RegionId} from '@realm/game-data';
const files=import.meta.glob('../../../assets/world/terrain/*/atlas.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const terrainTileAssets=Object.entries(files).map(([path,url])=>({key:`terrain-${path.split('/').at(-2)}-32`,url}));
export const terrainTileAsset=terrainTileAssets.find(a=>a.key==='terrain-elderwood-32')!;
export const terrainKey=(region:string)=>`terrain-${islandForRegion(region)}-32`;
export function drawTiledTerrain(scene:Phaser.Scene,region:RegionId){
 if(region==='elderwood'){
  const grid=gridMap(region),key='elderwood-connected-ground';
  if(scene.textures.exists(key))scene.textures.remove(key);
  const texture=scene.textures.createCanvas(key,grid.width*32,grid.height*32)!;
  paintConnectedTerrain(texture.getContext(),grid.cells,scene.textures.get(terrainKey(region)).getSourceImage() as HTMLImageElement);texture.refresh();
  const ground=scene.add.image(0,0,key).setOrigin(0).setScale(2).setDepth(-20).setData('terrainRegion',region);
  return ()=>{ground.destroy();scene.textures.remove(key);};
 }
 const grid=gridMap(region),map=scene.make.tilemap({tileWidth:32,tileHeight:32,width:grid.width,height:grid.height});
 const tileset=map.addTilesetImage('island-terrain',terrainKey(region),32,32,2,4)!;
 const layer=map.createBlankLayer(`${region}-ground`,tileset,0,0)!;layer.putTilesAt(grid.cells,0,0);layer.setScale(2).setDepth(-20).setData('terrainRegion',region);
 // Native 32px artwork with nearest sampling; actor artwork keeps its own sampling.
 scene.textures.get(terrainKey(region)).setFilter(1);
 return ()=>map.destroy();
}
export function terrainPreview(region:RegionId,atlas:CanvasImageSource){
 const grid=gridMap(region),canvas=document.createElement('canvas');canvas.width=grid.width*32;canvas.height=grid.height*32;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.imageSmoothingEnabled=false;
 if(region==='elderwood'){paintConnectedTerrain(ctx,grid.cells,atlas);return canvas;}
 for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++)ctx.drawImage(atlas,grid.cells[y][x]*36+2,2,32,32,x*32,y*32,32,32);
 return canvas;
}
