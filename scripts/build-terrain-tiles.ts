import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {terrainMaterials} from '../packages/game-data/src/terrain-plan';
const folder=new URL('../assets/tilesets/shared-32/',import.meta.url);await mkdir(new URL('terrain/',folder),{recursive:true});
const source='data:image/png;base64,'+(await readFile(new URL('terrain-master.png',folder))).toString('base64');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
try{const page=await browser.newPage();const result=await page.evaluate(async src=>{
 const image=new Image();image.src=src;await image.decode();const atlas=document.createElement('canvas');atlas.width=216;atlas.height=144;const out=atlas.getContext('2d')!,tiles:string[]=[],prepared:HTMLCanvasElement[]=[];
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){
  const tile=document.createElement('canvas');tile.width=tile.height=32;const ctx=tile.getContext('2d')!;ctx.imageSmoothingQuality='high';ctx.drawImage(image,col*256+4,row*256+4,248,248,0,0,32,32);prepared.push(tile);
 }
 // Condition only the small repeat borders. All variants of a material share
 // matching opposite edge texels, avoiding visible squares when mixed in-game.
 for(let material=0;material<6;material++){
  const canonical=prepared[material].getContext('2d')!.getImageData(0,0,32,32).data;
  for(let y=0;y<32;y++)for(let x=0;x<4;x++)for(let channel=0;channel<3;channel++){const a=(y*32+x)*4+channel,b=(y*32+31-x)*4+channel,average=(canonical[a]+canonical[b])/2;canonical[a]=canonical[b]=average;}
  for(let x=0;x<32;x++)for(let y=0;y<4;y++)for(let channel=0;channel<3;channel++){const a=(y*32+x)*4+channel,b=((31-y)*32+x)*4+channel,average=(canonical[a]+canonical[b])/2;canonical[a]=canonical[b]=average;}
  for(let row=0;row<4;row++){const ctx=prepared[row*6+material].getContext('2d')!,pixels=ctx.getImageData(0,0,32,32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const weight=Math.max(0,1-Math.min(x,31-x,y,31-y)/4);for(let channel=0;channel<3;channel++){const i=(y*32+x)*4+channel;pixels.data[i]=Math.round(pixels.data[i]*(1-weight)+canonical[i]*weight);}}ctx.putImageData(pixels,0,0);}
 }
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){
  const tile=prepared[row*6+col];tiles.push(tile.toDataURL().split(',')[1]);
  const x=col*36+2,y=row*36+2;out.drawImage(tile,x,y);
  // Two extruded pixels on every side prevent neighbouring materials bleeding
  // into a tile when the camera zoom uses linear filtering on mobile/WebGL.
  out.drawImage(tile,0,0,1,32,x-2,y,2,32);out.drawImage(tile,31,0,1,32,x+32,y,2,32);out.drawImage(tile,0,0,32,1,x,y-2,32,2);out.drawImage(tile,0,31,32,1,x,y+32,32,2);
  for(const [sx,sy,dx,dy]of [[0,0,-2,-2],[31,0,32,-2],[0,31,-2,32],[31,31,32,32]])out.drawImage(tile,sx,sy,1,1,x+dx,y+dy,2,2);
 }
 return {atlas:atlas.toDataURL().split(',')[1],tiles};
},source);
await writeFile(new URL('terrain.png',folder),Buffer.from(result.atlas,'base64'));for(let i=0;i<result.tiles.length;i++)await writeFile(new URL(`terrain/${terrainMaterials[i%6]}-${Math.floor(i/6)}.png`,folder),Buffer.from(result.tiles[i],'base64'));
await writeFile(new URL('terrain.tsj',folder),JSON.stringify({type:'tileset',version:'1.10',name:'Realm terrain 32',tilewidth:32,tileheight:32,tilecount:24,columns:6,margin:2,spacing:4,image:'terrain.png',imagewidth:216,imageheight:144,tiles:Array.from({length:24},(_,id)=>({id,properties:[{name:'material',type:'string',value:terrainMaterials[id%6]}]}))},null,2)+'\n');
console.log('Built 24 native 32×32 terrain PNGs, an extruded atlas and a Tiled tileset.');
}finally{await browser.close();}
