import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
const client=new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567'),a=await client.create('elderwood'),b=await client.joinById(a.roomId);let errors=0;const events:any[]=[];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));async function until(fn:()=>boolean){for(let i=0;i<150;i++){if(fn())return;await wait(100);}throw Error('Floor integration timed out');}
for(const room of [a,b]){for(const name of ['economy-state','economy-result','combat-error','travel-complete'])room.onMessage(name,()=>{});room.onMessage('travel-error',()=>errors++);room.onMessage('combat-event',e=>events.push(e));}
const player=()=>a.state.players.get(a.sessionId);
try{await until(()=>!!player());a.send('stairs','woods-down');await until(()=>errors===1);assert.equal(player().region,'elderwood');a.send('travel','woods');b.send('travel','woods');await until(()=>player().region==='woods'&&a.state.players.get(b.sessionId).region==='woods');
 a.send('stairs','woods-down');await until(()=>errors===2);assert.equal(player().region,'woods');let seq=await walkTo(a,{x:34,y:19.8},1);a.send('stairs','woods-down');await until(()=>player().region==='woods-depths');assert.ok(Math.hypot(player().x-24,player().y-32)<.2);assert.equal(a.state.players.get(b.sessionId).region,'woods');
 a.send('travel','elderwood');await until(()=>errors===3);assert.equal(player().region,'woods-depths');const upperHp=a.state.wolves.get('wolf-1').hp;a.send('combat',{kind:'bolt',target:'wolf-1'});await wait(250);assert.equal(a.state.wolves.get('wolf-1').hp,upperHp);assert.equal(player().auto,false);
 seq=await walkTo(a,{x:24,y:20},seq);assert.equal(player().region,'woods-depths');assert.ok(player().hp>0);await walkTo(a,{x:24,y:31.5},seq);a.send('stairs','woods-up');await until(()=>player().region==='woods');assert.ok(Math.hypot(player().x-34,player().y-20.3)<.2);assert.equal(player().auto,false);console.log('PASS multiplayer floors: forged/far stairs rejected, real stair travel and bridge navigation, separate-floor players and combat, portal bypass rejected, safe return');
}finally{await a.leave(true);await b.leave(true);}
