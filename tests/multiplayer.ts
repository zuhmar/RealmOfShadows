import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
const endpoint=process.env.TEST_SERVER_URL??'ws://localhost:2567';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const a=await new Client(endpoint).joinOrCreate('elderwood');const b=await new Client(endpoint).joinOrCreate('elderwood');
try{await wait(250);assert.equal(a.roomId,b.roomId);assert.equal(a.state.players.size,2);const start=a.state.players.get(a.sessionId).x;
for(let i=1;i<=8;i++){a.send('input',{x:1,y:0,sprint:false,seq:i});await wait(60);}await wait(150);
const own=a.state.players.get(a.sessionId),remote=b.state.players.get(a.sessionId);assert.ok(own.x>start);assert.ok(Math.abs(own.x-remote.x)<.01);assert.ok(own.x-start<=1.61);
const before=own.x;a.send('input',{x:999,y:0,sprint:false,seq:100});await wait(150);assert.equal(a.state.players.get(a.sessionId).x,before);
for(let i=101;i<201;i++)a.send('input',{x:1,y:0,sprint:false,seq:i});await wait(160);assert.ok(a.state.players.get(a.sessionId).x-before<=.21);
await b.leave();await wait(150);assert.equal(a.state.players.size,1);console.log('PASS: two-client join, visibility, movement synchronization, invalid input rejection, flood speed bound, leave cleanup');
}finally{await a.leave();if(b.connection.isOpen)await b.leave();}
