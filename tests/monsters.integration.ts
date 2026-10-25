import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
import {monsterSpawns} from '@realm/game-data';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
for(const [kind,effect]of [['spider','venom'],['boar','charge'],['bear','nova']] as const){
 const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567').create('elderwood');
 const events:any[]=[];for(const name of ['economy-state','economy-result','combat-error','travel-complete','travel-error'])room.onMessage(name,()=>{});room.onMessage('combat-event',e=>events.push(e));
 try{await wait(200);room.send('travel','woods');await wait(200);assert.equal([...room.state.wolves.values()].filter((w:any)=>w.kind===kind).length,monsterSpawns.filter(s=>s.kind===kind).length);
 const spawn=monsterSpawns.find(s=>s.kind===kind)!;await walkTo(room,{x:spawn.x+.8,y:spawn.y},1);for(let i=0;i<60&&!events.some(e=>e.kind===effect);i++)await wait(50);
 assert.ok(events.some(e=>e.kind==='warning'),`${kind} must warn before attacking`);assert.ok(events.some(e=>e.kind===effect),`${kind} attack effect replicated`);assert.ok(room.state.players.get(room.sessionId).hp>0);
 console.log(`PASS multiplayer ${kind}: navigable habitat, warning, ${effect} attack and replicated kind`);
 }finally{if(room.connection.isOpen)await room.leave();}
}
