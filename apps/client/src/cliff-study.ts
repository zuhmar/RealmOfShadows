/** Approved cliff entrances: one-cell stone stairs cut into a joined cap and rock face.
 * The lower approach sits one cell before the upper down-stair opening.
 */
import {elderwoodRimStairs,elderwoodStairTile} from '@realm/game-data';
const stair=elderwoodRimStairs.find(s=>s.id==='north')!;
export const cliffStudy={x:Math.floor(stair.x)-3,y:Math.floor(stair.y)-2,width:7,height:3,stairX:Math.floor(stair.x),stairY:Math.floor(stair.y)-1};
import {cliffStairSprite} from './cliff-stair-art';
import {cliffStairFlight} from './cliff-stair-layout';
export {paintRecessedStair} from './stone-cliff-art';
/** Full lower flights use joined native cells; the upper opening keeps its authored location. */
export function paintVillageStair(c:CanvasRenderingContext2D,s:typeof elderwoodRimStairs[number],upper=false){
 const tiles=upper?[{...elderwoodStairTile(s),part:'down' as const}]:cliffStairFlight(s);
 for(const tile of tiles)c.drawImage(cliffStairSprite(s.id,tile.part),Math.floor(tile.x)*32,Math.floor(tile.y)*32);
}
export function paintCliffStudy(c:CanvasRenderingContext2D,_atlas:CanvasImageSource,upper=false){
 for(const s of elderwoodRimStairs)paintVillageStair(c,s,upper);
}
