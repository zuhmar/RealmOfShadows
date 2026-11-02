import {gridMap,elderwoodRimStairs,onElderwoodLand} from '@realm/game-data';
import {villageCliffSurface} from './village-cliffs';
import {cliffStairFlight} from './cliff-stair-layout';
import {connectedCellPath} from './connected-terrain';
export interface ElderwoodSurface{cells:number[][];raised:boolean[][];width:number;height:number}
/** Coordinate noise is stable across visits, floors and editor redraws. */
export function terrainNoise(x:number,y:number,seed=0){let n=Math.imul(x+seed*37,374761393)^Math.imul(y+seed*71,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
/** Describe the actual visible surface, not the hidden lower-floor cliff collision band. */
export function elderwoodSurface(lower=gridMap('elderwood').cells,upper=gridMap('elderwood-upper').cells):ElderwoodSurface{
 const height=lower.length,width=lower[0].length,raised=Array.from({length:height},()=>Array<boolean>(width).fill(false));
 const cells=lower.map((row,y)=>row.map((material,x)=>{
  if(!onElderwoodLand(x,y)){raised[y][x]=true;return onElderwoodLand(x,y-1)||onElderwoodLand(x,y-2)?5:3;}
  if(villageCliffSurface(x,y,upper)){raised[y][x]=true;return upper[y]?.[x]===4?4:upper[y]?.[x]===2?2:0;}
  return material;
 }));
 // Protect the whole flight and the upper opening, including the cliff cells it passes through.
 for(const stair of elderwoodRimStairs)for(const p of cliffStairFlight(stair))cells[Math.floor(p.y)][Math.floor(p.x)]=9;
 return{cells,raised,width,height};
}
type Side='n'|'s'|'e'|'w';
const sides:readonly(readonly[number,number,Side])[]=[[0,-1,'n'],[1,0,'e'],[0,1,'s'],[-1,0,'w']];
/** Broken shoulders stay entirely in the current cell, never over the neighboring path or stair. */
export function paintTerrainShoulder(c:CanvasRenderingContext2D,x:number,y:number,side:Side,color:string,depth:number,seed:number){
 const at=(t:number,d:number):[number,number]=>side==='n'?[x*32+t,y*32+d]:side==='s'?[x*32+t,y*32+32-d]:side==='w'?[x*32+d,y*32+t]:[x*32+32-d,y*32+t];
 c.beginPath();c.moveTo(...at(0,0));c.lineTo(...at(32,0));c.lineTo(...at(32,depth*.5));
 for(let i=4;i>=0;i--)c.lineTo(...at(i*8,depth*(.4+terrainNoise(x*4+i,y,seed)*.6)));
 c.closePath();c.fillStyle=color;c.fill();
}
function clipMaterial(c:CanvasRenderingContext2D,p:ElderwoodSurface,material:number,raised:boolean){
 c.beginPath();let count=0;
 for(let y=0;y<p.height;y++){let start=-1;for(let x=0;x<=p.width;x++){
  const match=x<p.width&&p.cells[y][x]===material&&p.raised[y][x]===raised;
  if(match&&start<0)start=x;
  if(!match&&start>=0){c.rect(start*32,y*32,(x-start)*32,32);count++;start=-1;}
 }}c.clip();return count;
}
function grass(c:CanvasRenderingContext2D,p:ElderwoodSurface,raised:boolean){
 c.save();if(!clipMaterial(c,p,0,raised)){c.restore();return;}
 // Large organic patches cross native cell seams; no random square tint is applied per tile.
 for(let y=-1;y<p.height/4+1;y++)for(let x=-1;x<p.width/4+1;x++){
  const n=terrainNoise(x,y,11),px=x*128+n*70,py=y*128+terrainNoise(x,y,12)*90;
  const radius=75+n*55,patch=c.createRadialGradient(px,py,4,px,py,radius),ink=n>.5?'#315c2d':'#bdc26a';patch.addColorStop(0,ink+'25');patch.addColorStop(.5,ink+'12');patch.addColorStop(1,ink+'00');c.fillStyle=patch;c.fillRect(px-radius,py-radius,radius*2,radius*2);
 }
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.cells[y][x]===0&&p.raised[y][x]===raised){
  const n=terrainNoise(x,y,21);if(n>.16)continue;const px=x*32+5+terrainNoise(x,y,22)*22,py=y*32+6+terrainNoise(x,y,23)*20;
  c.strokeStyle='#365e2d88';c.lineWidth=.8;c.beginPath();c.moveTo(px-2,py);c.lineTo(px-3,py-3);c.moveTo(px,py);c.lineTo(px+1,py-4);c.moveTo(px+2,py);c.lineTo(px+4,py-2);c.stroke();
  c.fillStyle='#bac57366';c.fillRect(px,py-3,1,1);
 }c.restore();
}
function water(c:CanvasRenderingContext2D,p:ElderwoodSurface,raised:boolean){
 c.save();if(!clipMaterial(c,p,3,raised)){c.restore();return;}
 for(let y=0;y<p.height/5;y++)for(let x=0;x<p.width/5;x++){
  const n=terrainNoise(x,y,31),px=x*160+70,py=y*160+n*110;if(px<100||py<100||px>p.width*32-100||py>p.height*32-100)continue;const patch=c.createRadialGradient(px,py,0,px,py,90),ink=n>.5?'#164f78':'#75becb';patch.addColorStop(0,ink+'20');patch.addColorStop(1,ink+'00');c.fillStyle=patch;c.fillRect(px-90,py-90,180,180);
 }
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.cells[y][x]===3&&p.raised[y][x]===raised&&terrainNoise(x,y,32)<.12){
  const px=x*32+7,py=y*32+12+terrainNoise(x,y,33)*10;c.strokeStyle='#b9e5e336';c.lineWidth=.7;c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+5,py-2,px+11,py);c.stroke();
 }c.restore();
}
function pathWear(c:CanvasRenderingContext2D,p:ElderwoodSurface,x:number,y:number,m:number){
 c.save();connectedCellPath(c,p.cells,x,y,32);c.clip();const n=terrainNoise(x,y,41),cx=x*32+16,cy=y*32+16;
 if(m===1){
  c.strokeStyle='#edca8b25';c.lineWidth=9;c.lineCap='round';c.beginPath();
  for(const[dx,dy]of sides)if(p.cells[y+dy]?.[x+dx]===1||p.cells[y+dy]?.[x+dx]===2){c.moveTo(cx,cy);c.quadraticCurveTo(cx+dx*8+dy*2,cy+dy*8+dx*2,cx+dx*16,cy+dy*16);}c.stroke();
 }else if(n<.3){c.fillStyle='#ece3ca19';c.beginPath();c.ellipse(cx-4+n*10,cy,7,4,n,0,Math.PI*2);c.fill();}
 if(n<.18){
  c.strokeStyle=m===2?'#706e635c':'#946e3d55';c.lineWidth=.65;c.beginPath();c.moveTo(cx-5,cy-3);c.lineTo(cx-2,cy-1);c.lineTo(cx-3,cy+2);c.stroke();
 }
 if(m===1&&n>.7){c.fillStyle='#8c745b88';c.beginPath();c.ellipse(cx-8,cy+7,1.5,1,0,0,Math.PI*2);c.fill();c.fillStyle='#d4bb8355';c.fillRect(cx-8,cy+6,1.5,.7);}
 c.restore();
}
/** Terrain-only finish: no scene objects, randomness, new collision or per-frame work. */
export function paintElderwoodTerrainDetails(c:CanvasRenderingContext2D,upperFloor=false,plan=elderwoodSurface()){
 c.save();c.imageSmoothingEnabled=true;
 for(const raised of [false,true]){
  c.save();if(upperFloor&&!raised)c.globalAlpha*=.16;
  grass(c,plan,raised);water(c,plan,raised);
  for(let y=0;y<plan.height;y++)for(let x=0;x<plan.width;x++){
   if(plan.raised[y][x]!==raised)continue;const m=plan.cells[y][x];if(m===1||m===2){pathWear(c,plan,x,y,m);continue;}if(m!==0&&m!==3)continue;
   c.save();c.beginPath();c.rect(x*32,y*32,32,32);c.clip();
   for(const[dx,dy,side]of sides){const neighbor=plan.cells[y+dy]?.[x+dx];
    if(m===0&&(neighbor===1||neighbor===2))paintTerrainShoulder(c,x,y,side,neighbor===2?'#8e79584d':'#b28c4a55',4,51);
    if(m===0&&neighbor===3)paintTerrainShoulder(c,x,y,side,'#736747a6',2.5,52);
    if(m===0&&(neighbor===5||neighbor===9)){
     paintTerrainShoulder(c,x,y,side,'#253c3145',5,53);
     if(terrainNoise(x,y,54)<.25){const px=x*32+8+dx*6,py=y*32+16+dy*9;c.fillStyle='#81877788';c.beginPath();c.ellipse(px,py,1.7,1,0,0,Math.PI*2);c.fill();}
    }
    if(m===3&&neighbor!==undefined&&neighbor!==3&&neighbor!==4&&neighbor!==9){
     paintTerrainShoulder(c,x,y,side,'#83c4bd44',6,61);paintTerrainShoulder(c,x,y,side,'#d1e8ce55',1.5,62);
    }
   }c.restore();
  }c.restore();
 }c.restore();
}
