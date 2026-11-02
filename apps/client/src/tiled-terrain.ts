import {paintElderwoodTerrainDetails} from './elderwood-terrain-detail';
import {paintCavernWalls} from './cave-wall-art';
import {paintCliffStudy} from './cliff-study';
import {paintVillageCliffs,paintVillageOuterRim} from './village-cliffs';
import {paintLedge,paintWoodsCliffs,paintRidge} from './stacked-floors';
import type Phaser from 'phaser';
import {paintConnectedTerrain,usesConnectedTerrain} from './connected-terrain';
import {onElderwoodLand,houseFloorIndex,gridMap,woodsRidges,islandForRegion,type RegionId} from '@realm/game-data';
const files=import.meta.glob('../../../assets/world/terrain/*/atlas.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const terrainTileAssets=Object.entries(files).map(([path,url])=>({key:`terrain-${path.split('/').at(-2)}-32`,url}));
export const terrainTileAsset=terrainTileAssets.find(a=>a.key==='terrain-elderwood-32')!;
export const terrainKey=(region:string)=>`terrain-${islandForRegion(region)}-32`;
export function paintRegion(ctx:CanvasRenderingContext2D,region:RegionId,atlas:CanvasImageSource,cells=gridMap(region).cells){
 if(houseFloorIndex(region)>0){paintConnectedTerrain(ctx,cells,atlas);return;}
 if(region==='woods-upper'){paintConnectedTerrain(ctx,gridMap('woods').cells,atlas);paintWoodsCliffs(ctx,atlas,cells);ctx.fillStyle='#10222b55';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);for(const r of woodsRidges)paintRidge(ctx,atlas,r,cells,true);ctx.save();ctx.translate(37*32,3*32);paintLedge(ctx,atlas,false,cells,true);ctx.restore();return;}
 if(region!=='elderwood-upper'){paintConnectedTerrain(ctx,cells,atlas);if(region==='caverns'||region==='caverns-depths')paintCavernWalls(ctx,cells,atlas);if(region==='elderwood'){paintVillageCliffs(ctx,atlas);paintElderwoodTerrainDetails(ctx);}if(region==='woods'){paintWoodsCliffs(ctx,atlas);ctx.save();ctx.translate(37*32,3*32);paintLedge(ctx,atlas);ctx.restore();}return;}
 paintConnectedTerrain(ctx,gridMap('elderwood').cells,atlas);ctx.fillStyle='#10222bd9';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
 paintVillageCliffs(ctx,atlas,true);
 // Show the town below the upper rooms, with walkable floor cells highlighted.
 for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++)if(cells[y][x]!==5&&onElderwoodLand(x,y)){ctx.drawImage(atlas,cells[y][x]*36+2,2,32,32,x*32,y*32,32,32);paintVillageOuterRim(ctx,x,y);}
 paintCliffStudy(ctx,atlas,true);
 paintElderwoodTerrainDetails(ctx,true);
}
export function drawTiledTerrain(scene:Phaser.Scene,region:RegionId){
 if(usesConnectedTerrain(region)){
  const grid=gridMap(region),key=`${region}-connected-ground`;
  if(scene.textures.exists(key))scene.textures.remove(key);
  const texture=scene.textures.createCanvas(key,grid.width*32,grid.height*32)!;
  paintRegion(texture.getContext(),region,scene.textures.get(terrainKey(region)).getSourceImage() as HTMLImageElement);texture.refresh();
  const ground=scene.add.image(0,0,key).setOrigin(0).setScale(2).setDepth(-20).setData('terrainRegion',region);
  if(region==='elderwood'||region==='elderwood-upper'){
   // Continue the ocean beyond the map bounds so zooming out never reveals a green backdrop.
   const oceanKey=`${region}-ocean`,oceanTexture=scene.textures.createCanvas(oceanKey,32,32)!;
   oceanTexture.getContext().drawImage(scene.textures.get(terrainKey(region)).getSourceImage() as HTMLImageElement,3*36+2,2,32,32,0,0,32,32);oceanTexture.refresh();
   const ocean=scene.add.tileSprite(-2048,-2048,grid.width*64+4096,grid.height*64+4096,oceanKey).setOrigin(0).setTileScale(2).setDepth(-21).setData('terrainRegion',region);
   return ()=>{ground.destroy();ocean.destroy();scene.textures.remove(key);scene.textures.remove(oceanKey);};
  }
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
 if(usesConnectedTerrain(region)){paintRegion(ctx,region,atlas);return canvas;}
 for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++)ctx.drawImage(atlas,grid.cells[y][x]*36+2,2,32,32,x*32,y*32,32,32);
 return canvas;
}
