import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
for(const kind of ['wolf','spider'] as const){const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567').create('elderwood');for(const name of ['economy-state','economy-result','combat-event','combat-error','travel-complete','travel-error'])room.onMessage(name,()=>{});
 try{await wait(200);room.send('travel','woods');await wait(200);const target=[...room.state.wolves.entries()].find(([,w]:any)=>w.kind===kind) as [string,any];assert.ok(target);await walkTo(room,{x:target[1].x+.6,y:target[1].y},1);await wait(1000);const player=()=>room.state.players.get(room.sessionId);assert.equal(player().hp,100);assert.equal(room.state.wolves.get(target[0]).mode,'idle');room.send('combat',{kind:'bolt',target:target[0]});for(let i=0;i<50&&player().hp===100;i++)await wait(50);assert.ok(player().hp<100,`${kind} retaliates after actual hit`);console.log(`PASS multiplayer ${kind}: safe proximity without attacking, retaliation after player damage`);
 }finally{if(room.connection.isOpen)await room.leave();}}
