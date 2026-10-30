import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {elderwoodRimStairs,PORTAL} from '@realm/game-data';
import {walkTo} from './helpers/walk';
const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2696').create('elderwood');
for(const e of ['economy-state','economy-result','combat-event','combat-error','travel-complete'])room.onMessage(e,()=>{});let error='';room.onMessage('travel-error',m=>error=m);
const p=()=>room.state.players?.get(room.sessionId);async function until(f:()=>boolean){for(let i=0;i<400;i++){if(f())return;await new Promise(r=>setTimeout(r,50));}throw Error('Village stairs timeout '+error);}
try{await until(()=>!!p());assert.equal(p().x,PORTAL.arrival.x);assert.equal(p().y,PORTAL.arrival.y);let seq=1;
 for(const s of elderwoodRimStairs){seq=await walkTo(room,{x:s.x,y:s.y},seq);room.send('stairs',`elderwood-rim-${s.id}-up`);await until(()=>p().region==='elderwood-upper');assert.equal(p().x,s.top.x);assert.equal(p().y,s.top.y);room.send('stairs',`elderwood-rim-${s.id}-down`);await until(()=>p().region==='elderwood');assert.equal(p().x,s.return.x);assert.equal(p().y,s.return.y);}
 console.log('PASS multiplayer village plan: new spawn and all four cardinal cliff stairs with real movement and paired landings');
}finally{await room.leave(true);}
