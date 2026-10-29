import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {woodsRidges} from '@realm/game-data';
import {walkTo} from './helpers/walk';
const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2694').create('elderwood');
let error='';for(const event of ['economy-state','economy-result','combat-event','travel-complete','door-result'])room.onMessage(event,()=>{});room.onMessage('combat-error',()=>{});room.onMessage('travel-error',m=>error=m);
const player=()=>room.state.players?.get(room.sessionId);
async function until(f:()=>boolean){for(let i=0;i<400;i++){if(f())return;await new Promise(r=>setTimeout(r,50));}throw Error('Highlands timeout '+error);}
try{
 await until(()=>!!player());room.send('travel','woods');await until(()=>player().region==='woods');
 const r=woodsRidges[0];let seq=await walkTo(room,{x:r.stair.x,y:r.stair.y+4},1);
 room.send('stairs','woods-ridge-east-up');await until(()=>player().region==='woods-upper');
 seq=await walkTo(room,{x:85.5,y:11.5},seq);assert.ok(player().x>84,'walk across joined ridge');
 const wolf=()=>room.state.wolves.get('ridge-east-3'),hp=wolf().hp;
 room.send('combat',{kind:'bolt',target:'ridge-east-3'});await until(()=>wolf().hp<hp);room.send('combat',{kind:'stop'});
 seq=await walkTo(room,r.stair,seq);room.send('stairs','woods-ridge-east-down');await until(()=>player().region==='woods');assert.ok(Math.abs(player().y-r.stair.y-4)<.1);
 console.log('PASS multiplayer highlands: authoritative ground approach, climb, connected ridge walking, combat and descent');
}finally{await room.leave(true)}
