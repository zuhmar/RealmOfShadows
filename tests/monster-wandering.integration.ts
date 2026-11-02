import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
const client=new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567');
const a=await client.create('elderwood'),b=await client.joinById(a.roomId);
for(const room of [a,b])for(const name of ['economy-state','economy-result','combat-event','combat-error','travel-complete','travel-error'])room.onMessage(name,()=>{});
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
try{
 await wait(250);const start=new Map<string,{x:number;y:number}>();a.state.wolves.forEach((w:any,id:string)=>start.set(id,{x:w.x,y:w.y}));
 let moved=false,replicated=false;
 for(let i=0;i<100;i++){
  await wait(100);
  a.state.wolves.forEach((w:any,id:string)=>{
   const initial=start.get(id)!,other=b.state.wolves.get(id);
   if(w.mode==='wander'&&Math.hypot(w.x-initial.x,w.y-initial.y)>.05){
    moved=true;
    if(other?.mode==='wander'&&Math.hypot(w.x-other.x,w.y-other.y)<.3)replicated=true;
   }
  });
  if(moved&&replicated)break;
 }
 assert.ok(moved,'server moves idle monsters');assert.ok(replicated,'both players see authoritative wandering');
 console.log('PASS multiplayer: server wandering positions and walk mode reach both clients');
}finally{await a.leave();await b.leave();}
