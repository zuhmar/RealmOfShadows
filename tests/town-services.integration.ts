import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {craftingStation} from '@realm/game-data';
import {walkTo} from './helpers/walk';
const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2681').create('elderwood');
let bag:any,message='';for(const event of ['combat-event','combat-error','travel-error','travel-complete','door-result'])room.onMessage(event,()=>{});
room.onMessage('economy-state',value=>bag=value);room.onMessage('economy-result',value=>message=value);
async function until(f:()=>boolean){for(let i=0;i<250;i++){if(f())return;await new Promise(r=>setTimeout(r,50));}throw Error('Service network timeout: '+message)}
async function reject(recipe:string,expected:RegExp){message='';const before=JSON.stringify([bag.inventory,bag.professions]);room.send('economy',{kind:'craft',item:recipe,quantity:999,output:'shadowArmor'});await until(()=>expected.test(message));assert.equal(JSON.stringify([bag.inventory,bag.professions]),before);}
try{
 await until(()=>!!bag&&room.state.players.has(room.sessionId));await reject('smelt-copper',/matching crafting/);
 const smith=craftingStation('smithy')!;let seq=await walkTo(room,smith,1);
 await reject('cut-timber',/matching crafting/);await reject('smelt-copper',/Missing crafting materials/);
 for(let i=0;i<10;i++){room.send('input',{x:0,y:-1,sprint:false,seq:++seq});await new Promise(r=>setTimeout(r,65));}
 await new Promise(r=>setTimeout(r,150));assert.equal(room.state.players.get(room.sessionId).y,smith.y,'custom bench blocks forged movement through the counter');
 for(const [id,recipe,wrong]of [['workshop','cut-timber','brew-potion'],['cooking','cook-fish','cut-timber'],['alchemy','brew-potion','smelt-copper']]){seq=await walkTo(room,craftingStation(id)!,seq);await reject(wrong,/matching crafting/);await reject(recipe,/Missing crafting materials/);}
 console.log('PASS server crafting hall: four dedicated counters, matching recipe checks, remote/wrong-trade/forged output rejection, unchanged EXP and solid benches');
}finally{await room.leave(true)}
