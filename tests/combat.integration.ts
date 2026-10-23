import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
const endpoint=process.env.TEST_SERVER_URL??'ws://localhost:2567',wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const a=await new Client(endpoint).joinOrCreate('elderwood'),b=await new Client(endpoint).joinOrCreate('elderwood');
for(const room of [a,b])for(const name of ['combat-event','combat-error','travel-complete','travel-error'])room.onMessage(name,()=>{});
try{
 await wait(200);assert.equal(a.roomId,b.roomId);assert.equal(a.state.wolves.size,3);
 a.send('travel','woods');b.send('travel','woods');await wait(200);
 a.send('combat',{kind:'bolt',target:'wolf-1',damage:99999});await wait(150);assert.equal(a.state.wolves.get('wolf-1').hp,65);
 for(let seq=1;seq<=40&&a.state.players.get(a.sessionId).x<19.7;seq++){a.send('input',{x:1,y:0,sprint:false,seq});await wait(55);}await wait(100);
 const mana=a.state.players.get(a.sessionId).mana;
 for(let i=0;i<20;i++)a.send('combat',{kind:'nova',target:'wolf-1',damage:99999});await wait(250);
 const caster=a.state.players.get(a.sessionId);assert.ok(caster.hp>0);assert.ok(caster.mana<mana);assert.ok(caster.mana>=mana-25);assert.equal(a.state.wolves.get('wolf-1').hp,37);
 a.send('combat',{kind:'bolt',target:'wolf-1',damage:99999});await wait(400);assert.ok(a.state.wolves.get('wolf-1').hp<37);assert.ok(a.state.wolves.get('wolf-1').hp>0);
 for(let i=0;i<60&&a.state.wolves.get('wolf-1').hp>0;i++)await wait(100);
 assert.equal(a.state.wolves.get('wolf-1').hp,0);assert.equal(b.state.wolves.get('wolf-1').hp,0);const player=a.state.players.get(a.sessionId);assert.ok(player.hp>0&&player.hp<100);assert.equal(b.state.players.get(b.sessionId).hp,100);assert.equal(b.state.players.get(a.sessionId).hp,player.hp);
 console.log('PASS: shared wolves, safe arrival, client damage ignored, projectile kill replicated, wolf bite damage, safe observer, nova cooldown and mana validated');
}finally{await a.leave();await b.leave();}
