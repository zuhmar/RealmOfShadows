/** Approved cliff entrances: one-cell stone stairs cut into a joined cap and rock face.
 * The lower approach sits one cell before the upper down-stair opening.
 */
import {elderwoodRimStairs,elderwoodStairTile} from '@realm/game-data';
const stair=elderwoodRimStairs.find(s=>s.id==='north')!;
export const cliffStudy={x:Math.floor(stair.x)-3,y:Math.floor(stair.y)-2,width:7,height:3,stairX:Math.floor(stair.x),stairY:Math.floor(stair.y)-1};
import {paintRecessedStair,paintDescendingStair} from './stone-cliff-art';
export {paintRecessedStair} from './stone-cliff-art';
/** Adjacent floor sprites align along the same one-cell-wide stair axis. */
const stairSprites=new Map<string,HTMLCanvasElement>();
export function paintVillageStair(c:CanvasRenderingContext2D,s:typeof elderwoodRimStairs[number],upper=false){
 const p=upper?elderwoodStairTile(s):s,key=`${s.id}:${upper}`;let sprite=stairSprites.get(key);
 if(!sprite){
  sprite=document.createElement('canvas');sprite.width=sprite.height=32;const g=sprite.getContext('2d')!;
  const angle=({north:0,south:Math.PI,east:Math.PI/2,west:-Math.PI/2} as const)[s.id];g.translate(16,16);g.rotate(angle);
  if(upper)paintDescendingStair(g,-16,-16);else paintRecessedStair(g,-16,-16);
  stairSprites.set(key,sprite);
 }
 c.drawImage(sprite,Math.floor(p.x)*32,Math.floor(p.y)*32);
}
export function paintCliffStudy(c:CanvasRenderingContext2D,_atlas:CanvasImageSource,upper=false){
 for(const s of elderwoodRimStairs)paintVillageStair(c,s,upper);
}
