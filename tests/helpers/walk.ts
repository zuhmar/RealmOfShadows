import assert from 'node:assert/strict';
import type {Room} from 'colyseus.js';
import {pathfind,occupiedCells,type Point} from '@realm/shared';
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export async function walkTo(room:Room,target:Point,seq:number,stopWhen?:()=>boolean){
 const player=()=>room.state.players.get(room.sessionId),route=pathfind(player(),target,player().region,occupiedCells([...room.state.players.values(),...room.state.wolves.values()],player().region,player()));assert.ok(route.length,'Destination needs a walkable route');
 for(const point of route){let attempts=0;while(Math.hypot(player().x-point.x,player().y-point.y)>.001){
  if(stopWhen?.())return seq;assert.ok(attempts++<60,`Movement stuck near ${JSON.stringify(point)} at ${player().x},${player().y}`);
  const p=player(),centered=Math.abs(p.x%1-.5)<.00001&&Math.abs(p.y%1-.5)<.00001;
  room.send('input',{x:centered?Math.sign(point.x-p.x):0,y:centered?Math.sign(point.y-p.y):0,sprint:false,seq:++seq});
  for(let i=0;i<40&&player().seq<seq;i++)await wait(10);assert.ok(player().seq>=seq,'Server acknowledges movement');
 }}return seq;
}
