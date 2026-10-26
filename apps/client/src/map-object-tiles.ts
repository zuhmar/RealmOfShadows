import type Phaser from 'phaser';
import prefabs from '../../../assets/tilesets/shared-32/object-prefabs.json';
const files=import.meta.glob('../../../assets/tilesets/shared-32/objects-*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const mapObjectTileAssets=Object.entries(files).map(([path,url])=>({key:`map-tiles-${path.match(/objects-(\d+)\.png/)![1]}`,url}));
export function installMapObjectTiles(scene:Phaser.Scene){
 for(const prefab of prefabs.prefabs){if(scene.textures.exists(prefab.key))continue;const texture=scene.textures.createCanvas(prefab.key,prefab.width,prefab.height)!;
  for(let i=0;i<prefab.tiles.length;i++){const id=prefab.tiles[i];if(id<0)continue;const page=Math.floor(id/1024),cell=id%1024,source=scene.textures.get(`map-tiles-${page}`).getSourceImage() as HTMLImageElement;
   texture.getContext().drawImage(source,(cell%32)*32,Math.floor(cell/32)*32,32,32,(i%prefab.columns)*32,Math.floor(i/prefab.columns)*32,32,32);
  }
  texture.refresh();
 }
 for(const asset of mapObjectTileAssets)scene.textures.remove(asset.key);
}
