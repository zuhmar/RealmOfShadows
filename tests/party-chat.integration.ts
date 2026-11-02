import {Client,type Room} from 'colyseus.js';
import assert from 'node:assert/strict';
import {attackPath,occupiedCells} from '@realm/shared';
import {portalFor,combat} from '@realm/game-data';
import {walkTo} from './helpers/walk';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function until(check:()=>boolean,label:string,ms=8000){for(let i=0;i<ms/50;i++){if(check())return;await wait(50)}assert.ok(check(),label);}
const client=new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567'),rooms:Room[]=[];
const states=new Map<string,any>(),bags=new Map<string,any>(),messages=new Map<string,any[]>(),results=new Map<string,string[]>();
function attach(room:Room){rooms.push(room);messages.set(room.sessionId,[]);results.set(room.sessionId,[]);for(const name of ['economy-result','combat-event','combat-error','travel-complete','travel-error','chat-history'])room.onMessage(name,()=>{});room.onMessage('social-state',s=>states.set(room.sessionId,s));room.onMessage('economy-state',s=>bags.set(room.sessionId,s));room.onMessage('chat-message',m=>messages.get(room.sessionId)!.push(m));room.onMessage('social-result',m=>results.get(room.sessionId)!.push(m));room.send('social-sync');return room;}
try{
 const a=attach(await client.create('elderwood')),b=attach(await client.joinById(a.roomId)),c=attach(await client.joinById(a.roomId)),d=attach(await client.create('elderwood'));
 await until(()=>rooms.every(r=>states.has(r.sessionId)&&bags.has(r.sessionId)),'initial snapshots');
 c.send('party',{kind:'accept',partyId:'forged'});await until(()=>results.get(c.sessionId)!.some(m=>m.includes('expired')),'forged invite refused');
 a.send('party',{kind:'invite',target:b.sessionId});await until(()=>states.get(b.sessionId)?.invites.length===1,'invitation delivered');const partyId=states.get(b.sessionId).invites[0].partyId;b.send('party',{kind:'accept',partyId});await until(()=>states.get(a.sessionId)?.party?.members.length===2,'party formed');
 c.send('chat',{channel:'world',text:'Across every island and room',name:'Admin',sender:a.sessionId});await until(()=>rooms.every(r=>messages.get(r.sessionId)!.some(m=>m.text==='Across every island and room')),'global world broadcast');assert.equal(messages.get(d.sessionId)![0].sender,c.sessionId);assert.notEqual(messages.get(d.sessionId)![0].name,'Admin');
 a.send('chat',{channel:'party',text:'Private hunt'});await until(()=>messages.get(b.sessionId)!.some(m=>m.text==='Private hunt'),'private party delivery');await wait(100);for(const r of [c,d])assert.ok(!messages.get(r.sessionId)!.some(m=>m.text==='Private hunt'));
 for(const r of [a,b])r.send('travel','woods');await until(()=>[a,b].every(r=>r.state.players.get(r.sessionId)?.region==='woods'),'shared island');
 const wolf=[...a.state.wolves.values()].filter((w:any)=>w.kind==='wolf'&&w.region==='woods'&&Math.hypot(w.x-portalFor('woods').x,w.y-portalFor('woods').y)>combat.portalSafeRadius+2).sort((x:any,y:any)=>Math.hypot(x.x-portalFor('woods').x,x.y-portalFor('woods').y)-Math.hypot(y.x-portalFor('woods').x,y.y-portalFor('woods').y))[0] as any;
 assert.ok(wolf);let seq=0;
 for(let attempt=0;attempt<3&&wolf.hp>0;attempt++){
  const p=a.state.players.get(a.sessionId),route=attackPath(p,wolf,4,'woods',occupiedCells([...a.state.players.values(),...a.state.wolves.values()],'woods',p));
  if(route.length)seq=await walkTo(a,route.at(-1)!,seq);a.send('combat',{kind:'bolt',target:[...a.state.wolves.entries()].find(([,w])=>w===wolf)![0]});if(attempt===0){a.send('party',{kind:'kick',target:b.sessionId});await until(()=>results.get(a.sessionId)!.some(m=>m.includes('Finish combat')),'combat membership lock');assert.equal(states.get(a.sessionId).party.members.length,2);}await wait(2200);
 }
 await until(()=>wolf.hp===0,'party wolf defeated',10000);await until(()=>bags.get(a.sessionId).xp+bags.get(b.sessionId).xp===35,'conserved party EXP');
 const pa=bags.get(a.sessionId),pb=bags.get(b.sessionId);assert.ok(pa.xp>0&&pb.xp>0);assert.equal(pa.gold+pb.gold,6);assert.equal([...pa.inventory,...pb.inventory].filter((s:any)=>s.item==='pelt').reduce((n:number,s:any)=>n+s.quantity,0),1);assert.equal(bags.get(c.sessionId).xp,0);
 await a.leave();await until(()=>states.get(b.sessionId)?.party?.leader===b.sessionId,'leader transferred after disconnect');
 console.log('PASS real multiplayer: invite validation, party formation, shared kill/rewards, private party chat, world chat across rooms, server names, combat membership lock and disconnect leadership');
}finally{for(const room of rooms)if(room.connection.isOpen)await room.leave();}
