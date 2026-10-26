import type Phaser from 'phaser';
import terrainUrl from '../../../assets/tilesets/shared-32/terrain.png?url';
import {terrainPlan,terrainLayerData,terrainTileSize,type RegionId} from '@realm/game-data';
export const terrainTileAsset={key:'terrain-32',url:terrainUrl};

type PreparedTerrain={key:string;layers:number[][][]};
const prepared=new WeakMap<Phaser.Textures.TextureManager,Map<RegionId,PreparedTerrain>>();
function prepareTerrain(scene:Phaser.Scene,region:RegionId):PreparedTerrain{
 let cache=prepared.get(scene.textures);if(!cache){cache=new Map();prepared.set(scene.textures,cache);}const previous=cache.get(region);if(previous&&scene.textures.exists(previous.key))return previous;
 const plan=terrainPlan(region),layers:number[][][]=[],edges:{frame:number;alpha:Uint8Array}[]=[];
 // A bounded scratch strip avoids allocating a 50MB full-island mask on phones.
 const mask=document.createElement('canvas');mask.width=2048;mask.height=32;const context=mask.getContext('2d',{willReadFrequently:true})!;
 for(const layer of plan.layers){
  const data=terrainLayerData(plan,layer),contours=layer.polygons.map(points=>({points,left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))}));
  for(let y=0;y<plan.rows;y++)for(let column=0;column<plan.columns;column+=64){
   const end=Math.min(column+64,plan.columns);if(data[y].slice(column,end).every(frame=>frame<0))continue;
   const ox=column*32,oy=y*32;context.clearRect(0,0,2048,32);context.beginPath();for(const c of contours){if(c.right<ox||c.left>ox+2048||c.bottom<oy||c.top>oy+32)continue;context.moveTo(c.points[0][0]-ox,c.points[0][1]-oy);for(const [x,y]of c.points.slice(1))context.lineTo(x-ox,y-oy);context.closePath();}context.fillStyle='white';context.fill();
   const pixels=context.getImageData(0,0,2048,32).data;
   for(let x=column;x<end;x++){
    if(data[y][x]<0)continue;let minimum=255,maximum=0;const alpha=new Uint8Array(1024);
    for(let py=0;py<32;py++)for(let px=0;px<32;px++){const value=pixels[(py*2048+(x-column)*32+px)*4+3];alpha[py*32+px]=value;minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);}
    if(!maximum)data[y][x]=-1;else if(minimum<255){edges.push({frame:data[y][x],alpha});data[y][x]=23+edges.length;}
   }
  }
  layers.push(data);
 }
 mask.width=mask.height=1;
 const columns=56,rows=Math.ceil((24+edges.length)/columns),key=`terrain-map-${region}`;
 if(rows*36>4096)throw Error(`Terrain edge atlas exceeds mobile texture size: ${region}`);
 const texture=scene.textures.createCanvas(key,columns*36,rows*36)!,output=texture.getContext(),source=scene.textures.get(terrainTileAsset.key).getSourceImage() as HTMLImageElement;
 const patch=document.createElement('canvas'),cutout=document.createElement('canvas');patch.width=patch.height=cutout.width=cutout.height=32;const paint=patch.getContext('2d')!,cut=cutout.getContext('2d')!;
 for(let index=0;index<24+edges.length;index++){
  const edge=index>=24?edges[index-24]:undefined,frame=edge?.frame??index;paint.globalCompositeOperation='source-over';paint.clearRect(0,0,32,32);paint.drawImage(source,(frame%6)*36+2,Math.floor(frame/6)*36+2,32,32,0,0,32,32);
  if(edge){const pixels=cut.createImageData(32,32);for(let i=0;i<1024;i++){pixels.data[i*4]=pixels.data[i*4+1]=pixels.data[i*4+2]=255;pixels.data[i*4+3]=edge.alpha[i];}cut.putImageData(pixels,0,0);paint.globalCompositeOperation='destination-in';paint.drawImage(cutout,0,0);}
  const x=(index%columns)*36+2,y=Math.floor(index/columns)*36+2;output.drawImage(patch,x,y);
  output.drawImage(patch,0,0,1,32,x-2,y,2,32);output.drawImage(patch,31,0,1,32,x+32,y,2,32);output.drawImage(patch,0,0,32,1,x,y-2,32,2);output.drawImage(patch,0,31,32,1,x,y+32,32,2);
  for(const [sx,sy,dx,dy]of [[0,0,-2,-2],[31,0,32,-2],[0,31,-2,32],[31,31,32,32]])output.drawImage(patch,sx,sy,1,1,x+dx,y+dy,2,2);
 }
 texture.refresh();patch.width=patch.height=cutout.width=cutout.height=1;const result={key,layers};cache.set(region,result);return result;
}
export function drawTiledTerrain(scene:Phaser.Scene,region:RegionId){
 const plan=terrainPlan(region),art=prepareTerrain(scene,region),map=scene.make.tilemap({tileWidth:terrainTileSize,tileHeight:terrainTileSize,width:plan.columns,height:plan.rows});
 const tileset=map.addTilesetImage('shared-terrain-32',art.key,32,32,2,4)!;
 plan.layers.forEach((layer,index)=>{if(!layer.polygons.length)return;const view=map.createBlankLayer(`${region}-${layer.name}`,tileset,0,plan.offsetY)!;view.putTilesAt(art.layers[index],0,0);view.setDepth(-20+index*.1);view.setData('terrainRegion',region);view.setData('terrainMaterial',layer.material);if(layer.tint!==0xffffff)view.forEachTile(tile=>{tile.tint=layer.tint;});});
 return ()=>map.destroy();
}

// Export the same tile layers for the placement-editor preview. This is an
// offline composition helper; live play uses culled Phaser TilemapLayers.
export function terrainPreview(region:RegionId,atlas:CanvasImageSource){
 const plan=terrainPlan(region),canvas=document.createElement('canvas'),surface=document.createElement('canvas'),mask=document.createElement('canvas');canvas.width=surface.width=mask.width=Math.ceil(plan.width);canvas.height=surface.height=mask.height=Math.ceil(plan.height);const context=canvas.getContext('2d')!,paint=surface.getContext('2d',{willReadFrequently:true})!,cut=mask.getContext('2d')!;
 for(const layer of plan.layers){paint.globalCompositeOperation='source-over';paint.clearRect(0,0,canvas.width,canvas.height);cut.clearRect(0,0,canvas.width,canvas.height);cut.beginPath();for(const polygon of layer.polygons){cut.moveTo(...polygon[0]);for(const point of polygon.slice(1))cut.lineTo(...point);cut.closePath();}cut.fillStyle='white';cut.fill();
  const data=terrainLayerData(plan,layer);for(let y=0;y<plan.rows;y++)for(let x=0;x<plan.columns;x++){const frame=data[y][x];if(frame>=0)paint.drawImage(atlas,(frame%6)*36+2,Math.floor(frame/6)*36+2,32,32,x*32,y*32,32,32);}
  paint.globalCompositeOperation='destination-in';paint.drawImage(mask,0,0);
  if(layer.tint!==0xffffff){const pixels=paint.getImageData(0,0,canvas.width,canvas.height),red=(layer.tint>>16)/255,green=((layer.tint>>8)&255)/255,blue=(layer.tint&255)/255;for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]*=red;pixels.data[i+1]*=green;pixels.data[i+2]*=blue;}paint.putImageData(pixels,0,0);}
  context.drawImage(surface,0,0);
 }
 surface.width=surface.height=mask.width=mask.height=1;
 return canvas;
}
