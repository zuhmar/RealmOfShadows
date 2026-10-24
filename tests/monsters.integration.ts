import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
for(const [kind,position,effect]of [['spider',{x:9,y:11},'venom'],['boar',{x:23,y:11},'charge'],['bear',{x:16.5,y:17.3},'nova']] as const){
 const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567').create('elderwood');
 const events:any[]=[];for(const name of ['economy-state','economy-result','combat-error','travel-complete','travel-error'])room.onMessage(name,()=>{});room.onMessage('combat-event',e=>events.push(e));
 try{await wait(200);room.send('travel','woods');await wait(200);assert.equal([...room.state.wolves.values()].filter((w:any)=>w.kind===kind).length,kind==='bear'?1:2);
 await walkTo(room,position,1);for(let i=0;i<60&&!events.some(e=>e.kind===effect);i++)await wait(50);
 assert.ok(events.some(e=>e.kind==='warning'),`${kind} must warn before attacking`);assert.ok(events.some(e=>e.kind===effect),`${kind} attack effect replicated`);assert.ok(room.state.players.get(room.sessionId).hp>0);
 console.log(`PASS multiplayer ${kind}: navigable habitat, warning, ${effect} attack and replicated kind`);
 }finally{if(room.connection.isOpen)await room.leave();}
}
