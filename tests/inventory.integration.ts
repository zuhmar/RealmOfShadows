import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {Client,type Room} from 'colyseus.js';
import assert from 'node:assert/strict';
import {Economy} from '@realm/shared';
import {merchant} from '@realm/game-data';
import {writeProgress} from '../packages/shared/src/saves';
import {mockSupabase,userA,userB} from './fixtures/supabase';
import {walkTo} from './helpers/walk';
const mock=await mockSupabase(),port=2582,wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));let child:ChildProcess|undefined;const rooms:Room[]=[];
async function until(check:()=>boolean){for(let i=0;i<200;i++){if(check())return;await wait(50);}throw Error('Inventory integration timed out');}
async function start(){child=spawn(process.execPath,['--import','tsx','apps/server/src/index.ts'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),SUPABASE_URL:mock.url,SUPABASE_SECRET_KEY:'test-server-secret'},stdio:['ignore','pipe','pipe']});let logs='';child.stdout!.on('data',d=>logs+=d);child.stderr!.on('data',d=>logs+=d);for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error(logs);try{if((await fetch(`http://127.0.0.1:${port}`)).ok)return;}catch{}await wait(50);}throw Error(logs);}
async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done;}child=undefined;}
async function join(token:string){const room=await new Client(`ws://localhost:${port}`).joinOrCreate('elderwood',{accessToken:token});rooms.push(room);let bag:any;room.onMessage('economy-state',s=>bag=s);for(const name of ['economy-result','combat-event','combat-error','travel-complete','travel-error','save-error'])room.onMessage(name,()=>{});await until(()=>!!bag);return {room,bag:()=>bag};}
try{
 const e=new Economy();e.join('seed');const profile=e.profiles.get('seed')!;profile.gold=1000;profile.inventory=[{id:1,item:'pelt',quantity:19}];profile.gear=Array.from({length:23},()=>({id:crypto.randomUUID(),base:'clothTunic',rarity:null}));const save=writeProgress(profile,0),overflow=structuredClone(save);overflow.profile.gear.push(...Array.from({length:9},()=>({id:crypto.randomUUID(),base:'clothTunic' as const,rarity:null})));
 await mock.db.query('insert into public.character_saves(user_id,progress) values($1,$2::jsonb)',[userA,JSON.stringify(save)]);await mock.db.query('insert into public.character_saves(user_id,progress) values($1,$2::jsonb)',[userB,JSON.stringify(overflow)]);
 await start();const {room,bag}=await join('token-a');assert.equal(bag().usedSlots,32);await walkTo(room,merchant,1);room.send('economy',{kind:'buy',capacity:999});await wait(200);assert.equal(bag().gold,1000);assert.equal(bag().inventory.length,1);
 const id=bag().gear[0].id;room.send('economy',{kind:'sell-gear',item:id,price:9999});await until(()=>bag().usedSlots===31);assert.equal(bag().gold,1001);room.send('economy',{kind:'buy'});await until(()=>bag().usedSlots===32&&bag().inventory.some((i:any)=>i.item==='potion'));room.send('economy',{kind:'sell-equipment',item:'sword'});await until(()=>!bag().ownedWeapons.includes('sword'));assert.equal(bag().usedSlots,31);assert.equal(bag().gold,989);await room.leave(true);await stop();await start();const reloaded=await join('token-a');assert.equal(reloaded.bag().usedSlots,31);assert.equal(reloaded.bag().gold,989);assert.equal(reloaded.bag().gear.length,22);
 const old=await join('token-b');assert.equal(old.bag().usedSlots,41);assert.equal(old.bag().gear.length,32);assert.equal(old.bag().inventory[0].quantity,19);console.log('PASS inventory multiplayer/save: shared capacity enforced, forged capacity/price ignored, equipment sale frees slots, purchase/sale persist after restart, overflowing old saves preserved');
}finally{for(const room of rooms)try{if(room.connection.isOpen)await room.leave(true);}catch{}await stop();await mock.close();}
