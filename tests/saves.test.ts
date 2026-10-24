import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy} from '@realm/shared';
import {writeProgress,readProgress} from '../packages/shared/src/saves';
import {SaveSession,type ProgressStore} from '../apps/server/src/persistence';
import {database,userA,userB} from './fixtures/supabase';
const fresh=()=>{const e=new Economy();e.join('a');return writeProgress(e.profiles.get('a')!,0);};
test('save data rebuilds derived levels and skills and rejects malformed or impossible progress',()=>{
 const data=fresh();data.profile.xp=1600;data.profile.level=99;data.profile.skillXp.magic=100;data.profile.skills.magic=99;const restored=readProgress(data);assert.equal(restored.profile.level,5);assert.equal(restored.profile.skills.magic,2);assert.equal(data.profile.level,99);
 for(const mutate of [(s:any)=>s.profile.gold=-1,(s:any)=>s.profile.classId='__proto__',(s:any)=>s.profile.weapon='mageStaff',(s:any)=>s.profile.ownedWeapons.push('mageStaff'),(s:any)=>s.profile.learnedSpells=['moonNova'],(s:any)=>s.profile.inventory=[{id:1,item:'__proto__',quantity:1}],(s:any)=>s.profile.skillXp.melee=Infinity,(s:any)=>s.cooldowns={spark:999},(s:any)=>s.potionRemaining=-1]){const invalid=fresh();mutate(invalid);assert.throws(()=>readProgress(invalid));}
});
test('cooldowns save as remaining time rather than process-local timestamps',()=>{const e=new Economy();e.join('a');const p=e.profiles.get('a')!;p.learnedSpells=['mend'];p.potionReadyAt=102;const saved=writeProgress(p,100,{mend:107});assert.equal(saved.potionRemaining,2);assert.equal(saved.cooldowns.mend,7);assert.equal(saved.profile.potionReadyAt,0);assert.equal(p.potionReadyAt,102);});
test('save queue snapshots mutations and preserves ordering through logout',async()=>{
 const values:number[]=[];let complete!:()=>void;const store:ProgressStore={verify:async()=>({id:userA,email:'a@test'}),claim:async(_id,_lease,p)=>p,save:async(_id,_lease,p)=>{if(!values.length)await new Promise<void>(r=>complete=r);values.push(p.profile.gold);return new Date().toISOString();}};const session=new SaveSession(store,{id:userA,email:'a@test'}),p=fresh();p.profile.gold=10;const first=session.save(p);p.profile.gold=20;const last=session.save(p,true);await new Promise(r=>setTimeout(r,0));complete();await Promise.all([first,last]);assert.deepEqual(values,[10,20]);await assert.rejects(session.save(p));
});
test('real PostgreSQL migrations enforce RLS, account ownership and exclusive expiring save leases',async()=>{
 const db=await database();try{
 const a='20000000-0000-4000-8000-000000000001',b='20000000-0000-4000-8000-000000000002',progress=fresh();
 await db.query('select public.claim_character($1,$2,$3::jsonb)',[userA,a,JSON.stringify(progress)]);
 await assert.rejects(db.query('select public.claim_character($1,$2,$3::jsonb)',[userA,b,JSON.stringify(progress)]),/CHARACTER_IN_USE/);
 await assert.rejects(db.query('select public.save_character($1,$2,$3::jsonb,false)',[userA,b,JSON.stringify(progress)]),/SAVE_SESSION_EXPIRED/);
 await db.query('select public.claim_character($1,$2,$3::jsonb)',[userB,b,JSON.stringify(progress)]);
 await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${userA}',false);`);assert.equal((await db.query('select user_id from public.character_saves')).rows.length,1);
 await assert.rejects(db.query('update public.character_saves set progress=$1',[JSON.stringify(progress)]),/permission denied/);
 await assert.rejects(db.query('select public.claim_character($1,$2,$3::jsonb)',[userA,a,JSON.stringify(progress)]),/permission denied/);
 await db.exec('reset role;set role anon;');await assert.rejects(db.query('select * from public.character_saves'),/permission denied/);await db.exec('reset role;');
 await db.exec('set role service_role;');progress.profile.gold=42;await db.query('select public.save_character($1,$2,$3::jsonb,true)',[userA,a,JSON.stringify(progress)]);
 await db.exec('reset role;');const loaded=await db.query<{progress:any}>('select public.claim_character($1,$2,$3::jsonb) as progress',[userA,b,JSON.stringify(fresh())]);assert.equal(loaded.rows[0].progress.profile.gold,42);
 await db.exec(`update public.character_saves set lease_expires=now()-interval '1 second' where user_id='${userA}'`);
 await db.query('select public.claim_character($1,$2,$3::jsonb)',[userA,a,JSON.stringify(fresh())]);
 await assert.rejects(db.query('select public.save_character($1,$2,$3::jsonb,false)',[userA,b,JSON.stringify(fresh())]),/SAVE_SESSION_EXPIRED/);
 }finally{await db.close();}
});
