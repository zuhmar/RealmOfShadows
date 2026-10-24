import assert from 'node:assert/strict';
import type {Room} from 'colyseus.js';
import {pathfind,type Point} from '@realm/shared';
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export async function walkTo(room:Room,target:Point,seq:number){
 const player=()=>room.state.players.get(room.sessionId);
 const route=pathfind(player(),target,player().region);assert.ok(route.length,'Destination needs a walkable route');
 for(const point of route){
  let attempts=0;
  while(Math.hypot(player().x-point.x,player().y-point.y)>.18){
   assert.ok(attempts++<20,`Movement stuck near ${JSON.stringify(point)}`);
   const dx=point.x-player().x,dy=point.y-player().y,length=Math.hypot(dx,dy);
   room.send('input',{x:dx/length,y:dy/length,sprint:false,seq:++seq});await wait(65);
  }
 }
 return seq;
}
