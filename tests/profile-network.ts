import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:32990').create('elderwood');
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));let count=0,bytes=0,clocks=0,latest=0,weapon='';
for(const type of ['social-state','economy-result','combat-event','chat-history','server-log'])room.onMessage(type,()=>{});
room.onMessage('economy-state',snapshot=>{count++;bytes+=JSON.stringify(snapshot).length;assert.ok(snapshot.time>=latest);latest=snapshot.time;weapon=snapshot.weapon;});
room.onMessage('economy-clock',data=>{clocks++;assert.ok(data.time>=latest);latest=data.time;});
try{await pause(4200);const idle={fullSnapshots:count,jsonBytes:bytes,clocks,seconds:4.2};const at=count;room.send('economy',{kind:'equip',weapon:'sword'});for(let i=0;i<20&&weapon!=='sword';i++)await pause(50);assert.equal(weapon,'sword');console.log(JSON.stringify({idle,immediateChangedSnapshots:count-at}));if(process.env.EXPECT_DEDUP==='1'){assert.ok(idle.fullSnapshots<=2);assert.ok(idle.clocks>=12);assert.ok(count>at);}}finally{await room.leave();}
