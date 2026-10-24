import {walkTo} from './helpers/walk';
import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567').joinOrCreate('elderwood');
for(const name of ['economy-state','combat-event'])room.onMessage(name,()=>{});
let seq=0;
try{
 await wait(200);const player=()=>room.state.players.get(room.sessionId);
 seq=await walkTo(room,{x:700/48,y:985/48+4/3},seq);
 for(let i=0;i<80;i++){room.send('input',{x:-1,y:0,sprint:false,seq:++seq});await wait(55);}
 assert.equal(player().region,'elderwood');assert.ok(player().x>=14&&player().x<=14.3,`Server must stop at southern river bank: ${player().x}`);
 const edge=player().x;for(let i=0;i<10;i++){room.send('input',{x:-1,y:0,sprint:true,seq:++seq});await wait(55);}assert.equal(player().x,edge);
 console.log('PASS: server movement and sprint cannot enter Elderwood river');
}finally{await room.leave();}
