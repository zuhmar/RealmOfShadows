import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
const client=new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567'),a=await client.create('elderwood'),b=await client.joinById(a.roomId);let errors=0;const events:any[]=[];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));async function until(fn:()=>boolean){for(let i=0;i<150;i++){if(fn())return;await wait(100);}throw Error('Floor integration timed out');}
for(const room of [a,b]){for(const name of ['economy-state','economy-result','combat-error','travel-complete'])room.onMessage(name,()=>{});room.onMessage('travel-error',()=>errors++);room.onMessage('combat-event',e=>events.push(e));}
const player=()=>a.state.players.get(a.sessionId);
try{await until(()=>!!player());a.send('stairs','crystal-down');await until(()=>errors===1);assert.equal(player().region,'elderwood');a.send('travel','caverns');b.send('travel','caverns');await until(()=>player().region==='caverns'&&a.state.players.get(b.sessionId).region==='caverns');
 a.send('stairs','crystal-down');await until(()=>errors===2);assert.equal(player().region,'caverns');let seq=await walkTo(a,{x:32.5,y:24.5},1);a.send('stairs','crystal-down');await until(()=>player().region==='caverns-depths');assert.ok(Math.hypot(player().x-24.5,player().y-32.5)<.2);assert.equal(a.state.players.get(b.sessionId).region,'caverns');
 a.send('travel','elderwood');await until(()=>errors===3);assert.equal(player().region,'caverns-depths');const upperHp=a.state.wolves.get('bat-1').hp;a.send('combat',{kind:'bolt',target:'bat-1'});await wait(250);assert.equal(a.state.wolves.get('bat-1').hp,upperHp);assert.equal(player().auto,false);
 seq=await walkTo(a,{x:24.5,y:19.5},seq);assert.equal(player().region,'caverns-depths');assert.ok(player().hp>0);await walkTo(a,{x:24.5,y:32.5},seq);a.send('stairs','crystal-up');await until(()=>player().region==='caverns');assert.ok(Math.hypot(player().x-32.5,player().y-24.5)<.2);assert.equal(player().auto,false);console.log('PASS multiplayer floors: forged/far stairs rejected, real stair travel and bridge navigation, separate-floor players and combat, portal bypass rejected, safe return');
}finally{await a.leave(true);await b.leave(true);}
