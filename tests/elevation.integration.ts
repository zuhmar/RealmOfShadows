import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2691').create('elderwood');
let combatError='',travelError='';for(const event of ['economy-state','economy-result','combat-event','travel-complete','door-result'])room.onMessage(event,()=>{});
room.onMessage('combat-error',m=>combatError=m);room.onMessage('travel-error',m=>travelError=m);
async function until(f:()=>boolean){for(let i=0;i<400;i++){if(f())return;await new Promise(r=>setTimeout(r,50));}throw Error('Elevation timeout '+combatError+' '+travelError);}
const player=()=>room.state.players?.get(room.sessionId);
try{
 await until(()=>!!player());room.send('travel','woods');await until(()=>player().region==='woods');
 let seq=await walkTo(room,{x:43.5,y:6.5},1);const wolf=()=>room.state.wolves.get('ledge-wolf-2'),before=wolf().hp;
 room.send('combat',{kind:'bolt',target:'ledge-wolf-2'});await until(()=>!!combatError);assert.equal(wolf().hp,before);assert.equal(player().auto,false);
 room.send('stairs','woods-ledge-up');await until(()=>!!travelError);assert.equal(player().region,'woods');
 seq=await walkTo(room,{x:40.5,y:10.5},seq);room.send('stairs','woods-ledge-up');await until(()=>player().region==='woods-upper');assert.equal(player().x,40.5);assert.equal(player().y,6.5);
 room.send('combat',{kind:'bolt',target:'ledge-wolf-3'});await until(()=>room.state.wolves.get('ledge-wolf-3').hp<65);room.send('combat',{kind:'stop'});
 room.send('stairs','woods-ledge-down');await until(()=>player().region==='woods');assert.equal(player().x,40.5);assert.equal(player().y,10.5);
 console.log('PASS server elevation: cross-floor attacks and remote stairs rejected; real walking, climb, upper combat and descent');
}finally{await room.leave(true);}
