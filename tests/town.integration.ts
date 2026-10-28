import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
const endpoint=process.env.TEST_SERVER_URL??'ws://localhost:2677',client=new Client(endpoint),a=await client.create('elderwood'),b=await client.joinById(a.roomId),isolated=await client.create('elderwood');
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));async function until(f:()=>boolean){for(let i=0;i<200;i++){if(f())return;await wait(50);}throw Error('Town network check timed out');}
let message='';for(const room of [a,b,isolated])for(const event of ['economy-state','economy-result','travel-error','travel-complete','combat-event','combat-error','door-result'])room.onMessage(event,(value:any)=>{if(room===a&&event==='door-result')message=value});
try{
 await until(()=>a.state.players.has(a.sessionId)&&a.state.doors?.size===5&&isolated.state.doors?.size===5);const p=()=>a.state.players.get(a.sessionId),id='elderwood/smithy';
 a.send('door',id);await until(()=>message.includes('closer'));assert.equal(a.state.doors.get(id),true);
 let seq=await walkTo(a,{x:24.5,y:8.5},1);await wait(300);a.send('door',id);await until(()=>a.state.doors.get(id)===false&&b.state.doors.get(id)===false);assert.equal(isolated.state.doors.get(id),true);
 for(let i=0;i<12;i++){a.send('input',{x:0,y:-1,sprint:false,seq:++seq});await wait(60);}await wait(150);assert.equal(p().y,8.5,'server blocks forged walking into a closed door');
 a.send('door',id);await until(()=>a.state.doors.get(id)===true&&b.state.doors.get(id)===true);seq=await walkTo(a,{x:24.5,y:7.5},seq);await wait(300);a.send('door',id);await until(()=>message.includes('occupied'));assert.equal(a.state.doors.get(id),true);
 seq=await walkTo(a,{x:24.5,y:6.5},seq);await wait(300);a.send('door',id);await until(()=>a.state.doors.get(id)===false);assert.equal(p().region,'elderwood');
 console.log('PASS town multiplayer: remote toggles rejected, door state shared within room and isolated across rooms, server blocks closed-door movement and refuses closing on occupants');
}finally{await Promise.all([a.leave(),b.leave(),isolated.leave()])}
