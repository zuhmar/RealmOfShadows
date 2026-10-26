import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {Client,type Room} from 'colyseus.js';
import assert from 'node:assert/strict';
import {merchant} from '@realm/game-data';
import {walkTo} from './helpers/walk';
import {Economy} from '@realm/shared';
import {writeProgress} from '../packages/shared/src/saves';
import {mockSupabase,userA,userB} from './fixtures/supabase';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const mock=await mockSupabase();const port=Number(process.env.ACCOUNT_TEST_PORT??2580),endpoint=`ws://127.0.0.1:${port}`;let child:ChildProcess|undefined;const rooms:Room[]=[];
async function start(){child=spawn(process.execPath,['--import','tsx','apps/server/src/index.ts'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),SUPABASE_URL:mock.url,SUPABASE_SECRET_KEY:'test-server-secret'},stdio:['ignore','pipe','pipe']});let logs='';child.stdout!.on('data',data=>logs+=data.toString());child.stderr!.on('data',data=>logs+=data.toString());for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error(logs);try{const response=await fetch(`http://127.0.0.1:${port}`);if(response.ok)return;}catch{}await wait(50);}throw Error('Server startup timeout: '+logs);}
async function stop(){if(child&&child.exitCode===null){const exit=once(child,'exit');child.kill('SIGTERM');await exit;}child=undefined;}
async function join(token?:string){const room=await new Client(endpoint).joinOrCreate('elderwood',token?{accessToken:token}:{});rooms.push(room);for(const name of ['economy-state','economy-result','combat-error','combat-event','travel-complete','travel-error','save-error'])room.onMessage(name,()=>{});return room;}
function bagOf(room:Room){let state:any;room.onMessage('economy-state',data=>state=data);return ()=>state;}
async function until(check:()=>boolean){for(let i=0;i<200;i++){if(check())return;await wait(50);}throw Error('Account integration condition timed out');}
try{
 const economy=new Economy();economy.join('seed');const p=economy.profiles.get('seed')!;p.xp=1600;p.classId='mage';p.weapon='mageStaff';p.ownedWeapons.push('mageStaff');p.gold=321;p.skillXp={melee:100,distance:400,magic:900,shielding:400};p.attributes.intelligence=12;p.attributes.vitality=12;p.learnedSpells=['moonNova','mend'];p.inventory=[{id:25,item:'pelt',quantity:2}];const initial=writeProgress(p,0);
 await mock.db.query('insert into public.character_saves(user_id,progress) values($1,$2::jsonb)',[userA,JSON.stringify(initial)]);
 await start();await assert.rejects(join('invalid-token'));const a=await join('token-a'),bag=bagOf(a),guest=await join(),guestBag=bagOf(guest);await until(()=>bag()?.gold===321&&guestBag()?.gold===0);assert.equal(bag().classId,'mage');assert.equal(bag().level,5);assert.equal(bag().skills.magic,4);assert.equal(a.state.players.get(a.sessionId).magicXp,900);assert.deepEqual(bag().learnedSpells,['moonNova','mend']);assert.equal(guestBag().account,null);assert.equal(bag().skills.shielding,3);assert.equal(bag().attributePoints,8);assert.equal(a.state.players.get(a.sessionId).shieldingXp,400);assert.equal(a.state.players.get(a.sessionId).hp,110);assert.equal(a.state.players.get(a.sessionId).mana,106);a.send('economy',{kind:'attribute',attribute:'strength',amount:999});await until(()=>bag().attributes.strength===11);assert.equal(bag().attributePoints,7);
 await assert.rejects(join('token-a'));let seq=0;const player=()=>a.state.players.get(a.sessionId);
 seq=await walkTo(a,merchant,seq);a.send('economy',{kind:'learn',spell:'spark'});await until(()=>bag().learnedSpells.includes('spark'));a.send('economy',{kind:'buy'});await until(()=>bag().inventory.some((s:any)=>s.item==='potion'));a.send('economy',{kind:'equip',weapon:'bow'});await until(()=>bag().weapon==='bow');
 a.send('economy',{kind:'equip-item',item:'clothTunic'});await until(()=>bag().equipment.chest==='clothTunic'&&player().armor===1);
 const expected={attributes:bag().attributes,attributePoints:bag().attributePoints,equipment:bag().equipment,ownedEquipment:bag().ownedEquipment,armor:bag().armor,gold:bag().gold,xp:bag().xp,inventory:bag().inventory,learnedSpells:bag().learnedSpells,skillXp:bag().skillXp,weapon:bag().weapon};assert.equal(expected.gold,294);assert.equal(expected.inventory.find((s:any)=>s.item==='potion').id>25,true);
 await a.leave(true);await guest.leave(true);await stop();await start();const b=await join('token-a'),loaded=bagOf(b);await until(()=>loaded()?.weapon==='bow');for(const [key,value] of Object.entries(expected))assert.deepEqual(loaded()[key],value);assert.equal(b.state.players.get(b.sessionId).armor,1);assert.equal(JSON.parse(b.state.players.get(b.sessionId).appearance).chest,'clothTunic');assert.equal(b.state.players.get(b.sessionId).region,'elderwood');assert.equal(b.state.players.get(b.sessionId).hp,110);assert.equal(b.state.players.get(b.sessionId).mana,106);assert.equal(b.state.players.get(b.sessionId).shieldingXp,400);
 // A cloud write outage must disconnect instead of pretending new progress is saved.
 mock.fail(true);const disconnected=onceRoomLeave(b);b.send('economy',{kind:'equip',weapon:'wand'});assert.equal(await disconnected,4005);mock.fail(false);
 const stored=await mock.db.query<{progress:any}>('select progress from public.character_saves where user_id=$1',[userA]);assert.equal(stored.rows[0].progress.profile.weapon,'bow');
 // A malformed disk/cloud save is never replaced by a fresh default character.
 await mock.db.query('insert into public.character_saves(user_id,progress) values($1,$2::jsonb)',[userB,JSON.stringify({version:1,profile:{gold:-1}})]);await assert.rejects(join('token-b'));const corrupt=await mock.db.query<{progress:any}>('select progress from public.character_saves where user_id=$1',[userB]);assert.equal(corrupt.rows[0].progress.profile.gold,-1);
 console.log('PASS accounts: verified tokens, private saves, duplicate-session rejection, attribute spending, shielding skill, enlarged vitals, merchant mutations and equipment persist through restart, inventory IDs restored, save-outage disconnect, corrupt-save rejection');
}finally{for(const room of rooms)try{if(room.connection.isOpen)await room.leave(true);}catch{}await stop();await mock.close();}
function onceRoomLeave(room:Room){return new Promise<number>(resolve=>room.onLeave(resolve));}
