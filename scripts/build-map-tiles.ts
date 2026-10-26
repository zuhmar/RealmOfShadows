import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {generatedFrames} from '../apps/client/src/generated-frames';
import {cavernsPropFrames} from '../apps/client/src/caverns-prop-frames';

// Normal atlas preparation: retain the generated PNG masters and their trim
// offsets, then pack each map prefab into reusable 32×32 cells without repainting.
const folder=new URL('../assets/tilesets/shared-32/',import.meta.url);
const groups=['buildings','village','forest','caverns'] as const;
const allFrames={...generatedFrames,caverns:cavernsPropFrames};
const aliases=new Map(['oak','pine','boulder','banner','lamp','gate-pier'].map(name=>[`woods-${name}`,`elderwood-${name}`]));
await mkdir(folder,{recursive:true});
const images:Record<string,string>={};for(const group of groups)images[group]='data:image/png;base64,'+(await readFile(new URL(`../assets/generated/${group==='caverns'?'caverns-props':group}.png`,import.meta.url))).toString('base64');
const frames=groups.flatMap(group=>Object.entries(allFrames[group]).map(([key,frame])=>({key,frame:key==='woods-portal'?generatedFrames.village['elderwood-portal']:frame,group:key==='woods-portal'?'village':group,shared:aliases.get(key)?generatedFrames.village[aliases.get(key)! as keyof typeof generatedFrames.village].source:undefined})));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage();
 const result=await page.evaluate(async({images,frames})=>{
  const sources:Record<string,HTMLImageElement>={};for(const [key,url]of Object.entries(images)){const image=new Image();image.src=url;await image.decode();sources[key]=image;}
  const pages:HTMLCanvasElement[]=[],prefabs:{key:string;width:number;height:number;columns:number;tiles:number[]}[]=[];let next=0,shardIcon='';
  for(const {key,frame,group,shared}of frames){const source=shared?sources.village:sources[group],canvas=document.createElement('canvas');canvas.width=frame.size[0]*2;canvas.height=frame.size[1]*2;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   const [sx,sy,sw,sh]=shared??frame.source,[dx,dy,dw,dh]=frame.placement;ctx.imageSmoothingQuality='high';ctx.drawImage(source,sx,sy,sw,sh,dx*2,dy*2,dw*2,dh*2);
   if(key==='caverns-shard-icon'){const icon=document.createElement('canvas');icon.width=icon.height=32;const iconContext=icon.getContext('2d')!;iconContext.imageSmoothingQuality='high';const scale=Math.min(28/sw,28/sh);iconContext.drawImage(source,sx,sy,sw,sh,(32-sw*scale)/2,(32-sh*scale)/2,sw*scale,sh*scale);shardIcon=icon.toDataURL().split(',')[1];}
   const columns=Math.ceil(canvas.width/32),rows=Math.ceil(canvas.height/32),tiles:number[]=[];
   for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    const pixels=ctx.getImageData(x*32,y*32,32,32).data;let visible=false;for(let i=3;i<pixels.length;i+=4)if(pixels[i]){visible=true;break;}
    if(!visible){tiles.push(-1);continue;}const id=next++,index=Math.floor(id/1024),cell=id%1024;
    if(!pages[index]){const atlas=document.createElement('canvas');atlas.width=atlas.height=1024;pages[index]=atlas;}
    pages[index].getContext('2d')!.drawImage(canvas,x*32,y*32,32,32,(cell%32)*32,Math.floor(cell/32)*32,32,32);tiles.push(id);
   }
   prefabs.push({key,width:canvas.width,height:canvas.height,columns,tiles});
  }
  return {pages:pages.map(canvas=>canvas.toDataURL().split(',')[1]),shardIcon,manifest:{tileSize:32,pageSize:1024,tileCount:next,prefabs}};
 },{images,frames});
 for(let i=0;i<result.pages.length;i++)await writeFile(new URL(`objects-${i}.png`,folder),Buffer.from(result.pages[i],'base64'));
 await writeFile(new URL('object-prefabs.json',folder),JSON.stringify(result.manifest)+'\n');
 if(result.shardIcon)await writeFile(new URL('../assets/items/crystalShard.png',import.meta.url),Buffer.from(result.shardIcon,'base64'));
 console.log(`Packed ${result.manifest.prefabs.length} map prefabs into ${result.manifest.tileCount} 32×32 tiles on ${result.pages.length} pages at ${fileURLToPath(folder)}`);
}finally{await browser.close();}
