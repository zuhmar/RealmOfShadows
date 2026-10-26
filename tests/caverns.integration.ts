import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {allMonsterSpawns,portalFor} from '@realm/game-data';
import {sight} from '@realm/shared';
import {walkTo} from './helpers/walk';
const cavernsPortal=portalFor('caverns');
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms)),endpoint=process.env.TEST_SERVER_URL??'ws://localhost:2567';
const a=await new Client(endpoint).create('elderwood'),b=await new Client(endpoint).joinById(a.roomId);let bag:any,observer:any;const effects:any[]=[],otherEffects:any[]=[];
for(const room of [a,b])for(const name of ['economy-result','combat-error','travel-complete','travel-error'])room.onMessage(name,()=>{});
a.onMessage('economy-state',state=>bag=state);b.onMessage('economy-state',state=>observer=state);a.onMessage('combat-event',e=>effects.push(e));b.onMessage('combat-event',e=>otherEffects.push(e));
const until=async(check:()=>boolean,message:string)=>{for(let i=0;i<240;i++){if(check())return;await wait(50);}assert.fail(message);};
try{
 await until(()=>!!bag&&!!observer,'Initial private snapshots');assert.equal(a.state.wolves.size,allMonsterSpawns.length);
 for(const item of ['clothHood','clothTunic','clothTrousers','leatherBoots','woodenShield']){a.send('economy',{kind:'equip-item',item});await wait(120);}
 a.send('travel','caverns');await until(()=>a.state.players.get(a.sessionId).region==='caverns','Caverns arrival');assert.ok(Math.abs(a.state.players.get(a.sessionId).x-cavernsPortal.arrival.x)<.01);assert.equal([...a.state.wolves.values()].filter((w:any)=>w.region==='caverns').length,28);
 a.send('combat',{kind:'bolt',target:'wolf-1'});await wait(150);assert.equal(a.state.wolves.get('wolf-1').hp,65);
 let seq=await walkTo(a,{x:14.5,y:13.5},1,()=>{const p=a.state.players.get(a.sessionId),w=a.state.wolves.get('bat-9');return Math.hypot(p.x-w.x,p.y-w.y)<4.8&&sight(p,w,'caverns');});a.send('combat',{kind:'bolt',target:'bat-9'});await until(()=>a.state.wolves.get('bat-9').hp===0,'Bat defeated');await until(()=>bag.xp===80&&bag.drops.length===1,'Private cave reward');assert.equal(bag.drops[0].region,'caverns');assert.equal(observer.xp,0);assert.equal(observer.drops.length,0);assert.ok(a.state.players.get(a.sessionId).hp>0);
 const drop=bag.drops[0];b.send('economy',{kind:'pickup',drop:drop.id});await wait(150);assert.equal(observer.gold,0);a.send('economy',{kind:'pickup',drop:drop.id});await until(()=>bag.inventory.some((i:any)=>i.item==='crystalShard'),'Crystal shard pickup');assert.equal(bag.gold,15);assert.equal(bag.drops.length,0);
 a.send('combat',{kind:'stop'});seq=await walkTo(a,{x:32.5,y:24.5},seq);seq=await walkTo(a,{x:50.5,y:19.5},seq);await walkTo(a,{x:50.5,y:13.5},seq,()=>effects.some(e=>e.kind==='shard'));
 await until(()=>effects.some(e=>e.kind==='shard'),'Wyrm crystal-breath attack');assert.ok(effects.some(e=>e.kind==='warning'&&e.region==='caverns'));assert.ok(effects.filter(e=>e.kind==='shard').every(e=>e.region==='caverns'));assert.equal(b.state.players.get(b.sessionId).hp,100);assert.ok(!otherEffects.some(e=>e.region==='caverns'));assert.ok(a.state.players.get(a.sessionId).hp>0);
 console.log('PASS multiplayer caverns: authoritative arrival/routes, region-filtered targeting/events, bat kill and private XP/shard loot, observer isolation, warned Crystal Wyrm breath');
}finally{if(a.connection.isOpen)await a.leave();if(b.connection.isOpen)await b.leave();}
