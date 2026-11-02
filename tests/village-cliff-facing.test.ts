import {test} from 'node:test';
import assert from 'node:assert/strict';
import {elderwoodSize,onElderwoodLand,onElderwoodLowland,elderwoodCliffDistance} from '@realm/game-data';
import {villageCliffFace} from '../apps/client/src/village-cliff-facing';
test('Elderwood rock faces project south toward lowland; rear and side edges remain caps',()=>{
 let top=0,bottom=0,hidden=0;
 for(let y=0;y<elderwoodSize.height;y++)for(let x=0;x<elderwoodSize.width;x++){
  const section=villageCliffFace(x,y);
  if(section){assert.ok(onElderwoodLand(x,y)&&!onElderwoodLowland(x,y));assert.ok(onElderwoodLowland(x,y+(section==='bottom'?1:2)));if(section==='top')top++;else bottom++;}
  else if(onElderwoodLand(x,y)&&!onElderwoodLowland(x,y)&&elderwoodCliffDistance(x,y)<=2)hidden++;
 }
 assert.ok(top>30&&bottom>30);assert.ok(hidden>100);
});
