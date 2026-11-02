import {onElderwoodLand,onElderwoodLowland} from '@realm/game-data';
/** Fixed camera: vertical rock projects down-screen, never toward the nearest lowland. */
export function villageCliffFace(x:number,y:number):'top'|'bottom'|undefined{
 if(!onElderwoodLand(x,y)||onElderwoodLowland(x,y))return;
 if(onElderwoodLowland(x,y+1))return 'bottom';
 if(onElderwoodLowland(x,y+2))return 'top';
}
