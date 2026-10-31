/** Approved cliff entrances: one-cell stone stairs cut into a joined cap and rock face.
 * Every floor uses the shared physical stair coordinate.
 */
import {elderwoodRimStairs,elderwoodStairTile} from '@realm/game-data';
const stair=elderwoodRimStairs.find(s=>s.id==='north')!;
export const cliffStudy={x:Math.floor(stair.x)-3,y:Math.floor(stair.y)-2,width:7,height:3,stairX:Math.floor(stair.x),stairY:Math.floor(stair.y)-1};
import {paintRecessedStair} from './stone-cliff-art';
export {paintRecessedStair} from './stone-cliff-art';
/** Native cap and face parts: broad fractured planes rather than horizontal brick courses. */
export function paintCliffStudy(c:CanvasRenderingContext2D,atlas:CanvasImageSource,_upper=false){
 for(const s of elderwoodRimStairs){
  const p=elderwoodStairTile(s),angle=({north:0,south:Math.PI,east:Math.PI/2,west:-Math.PI/2} as Record<string,number>)[s.id];
  // Rotations keep each native cell the same size, and aim the flight toward its island side.
  c.save();c.translate(p.x*32,p.y*32);c.rotate(angle);c.translate(-112,-48);paintEntrance(c,atlas);c.restore();
 }
}
function paintEntrance(c:CanvasRenderingContext2D,atlas:CanvasImageSource){
 const sx=96,sy=32;
 c.drawImage(atlas,2*36+2,2,32,32,sx,sy-32,32,32);
 c.fillStyle='#9daeb4';c.fillRect(sx+2,sy-5,23,5);c.fillStyle='#d8e1e3';c.fillRect(sx+2,sy-5,23,1);
 paintRecessedStair(c,sx,sy);
}
