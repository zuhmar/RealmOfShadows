import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {Client,type Room} from 'colyseus.js';
import assert from 'node:assert/strict';
import {storyNpc,storyKeepsakes,storyRank} from '@realm/game-data';
import {Economy} from '@realm/shared';
import {writeProgress} from '../packages/shared/src/saves';
import {mockSupabase,userA} from './fixtures/supabase';
import {walkTo} from './helpers/walk';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms)),mock=await mockSupabase(),port=2732,rooms:Room[]=[];let child:ChildProcess|undefined;
async function until(check:()=>boolean){for(let i=0;i<300;i++){if(check())return;await wait(50)}throw Error('Story integration timed out')}
async function start(){child=spawn(process.execPath,['--import','tsx','apps/server/src/index.ts'],{env:{...process.env,PORT:String(port),SUPABASE_URL:mock.url,SUPABASE_SECRET_KEY:'test-server-secret'},stdio:['ignore','pipe','pipe']});let logs='';child.stdout!.on('data',v=>logs+=v);child.stderr!.on('data',v=>logs+=v);await until(()=>{if(child?.exitCode!==null)throw Error(logs);return logs.includes(String(port))});}
async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done}child=undefined}
async function join(token?:string){const r=await new Client(`ws://127.0.0.1:${port}`).joinOrCreate('elderwood',token?{accessToken:token}:{});rooms.push(r);let bag:any;for(const name of ['economy-result','combat-error','combat-event','travel-complete','travel-error','save-error'])r.onMessage(name,()=>{});r.onMessage('economy-state',v=>bag=v);await until(()=>!!bag);return{r,bag:()=>bag}}
try{
 const e=new Economy();e.join('seed');const profile=e.profiles.get('seed')!;profile.xp=1600;profile.classId='mage';profile.skillXp.magic=100;await mock.db.query('insert into public.character_saves(user_id,progress) values($1,$2::jsonb)',[userA,JSON.stringify(writeProgress(profile,0))]);
 await start();const a=await join('token-a'),guest=await join();let seq=0;const act=(kind:string,item:string)=>a.r.send('economy',{kind,item});
 act('quest-accept','elderwood-main-1');await wait(200);assert.equal(a.bag().quests['elderwood-main-1'],undefined,'remote acceptance rejected');
 seq=await walkTo(a.r,storyNpc('rowan')!,seq);act('quest-accept','elderwood-main-1');await until(()=>!!a.bag().quests['elderwood-main-1']);act('quest-talk','rowan');await until(()=>a.bag().quests['elderwood-main-1'].progress[0]===1);act('quest-claim','elderwood-main-1');await until(()=>a.bag().quests['elderwood-main-1'].claimed);act('quest-accept','elderwood-main-2');await wait(200);assert.equal(a.bag().quests['elderwood-main-2'],undefined,'chosen class uses its actual mentor');
 seq=await walkTo(a.r,storyNpc('selene')!,seq+100);act('quest-accept','elderwood-main-2');await until(()=>a.bag().quests['elderwood-main-2']?.progress.join(',')==='1,1');act('quest-claim','elderwood-main-2');await until(()=>a.bag().quests['elderwood-main-2'].claimed);const gold=a.bag().gold;act('quest-claim','elderwood-main-2');await wait(200);assert.equal(a.bag().gold,gold);assert.deepEqual(storyKeepsakes(a.bag().quests,a.bag().classId),['familyLocket','mageInsignia']);assert.equal(storyRank(a.bag()),'Apprentice Mage');assert.equal(a.bag().learnedSpells.length,0);assert.deepEqual(guest.bag().quests,{});assert.equal(a.r.state.players.get(a.r.sessionId).quests,undefined);
 await a.r.leave(true);await guest.r.leave(true);await stop();await start();const restored=await join('token-a');assert.deepEqual(storyKeepsakes(restored.bag().quests,restored.bag().classId),['familyLocket','mageInsignia']);assert.equal(restored.bag().gold,gold);assert.equal(restored.bag().inventory.length,0);assert.equal(restored.bag().learnedSpells.length,0);
 console.log('PASS story server: real routes/conversations, mentor checks, class insignia, private journal, once-only rewards and authenticated restart persistence');
}finally{for(const r of rooms)try{if(r.connection.isOpen)await r.leave(true)}catch{}await stop();await mock.close()}
