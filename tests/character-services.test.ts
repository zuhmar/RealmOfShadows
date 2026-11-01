import {test} from 'node:test';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {Economy,planCharacterService} from '@realm/shared';
import {cosmeticLook,serviceCatalog,attributePoints,totalXp,spells,canLearnSpell} from '@realm/game-data';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
import {database,userA,userB} from './fixtures/supabase';
const profile=()=>{const e=new Economy();e.join('x');return e.profiles.get('x')!};
test('sex is persistent, old saves infer it, and outfit themes cannot bypass chosen sex',()=>{
 const p=profile();p.sex='female';assert.equal(readProgress(writeProgress(p,0)).profile.sex,'female');assert.equal(cosmeticLook(p.cosmetics,'mage',p.sex).skin,'mage-female');
 const old:any=writeProgress(p,0);delete old.profile.sex;old.profile.cosmetics.skin='citizen-female';assert.equal(readProgress(old).profile.sex,'female');old.profile.sex='invalid';assert.throws(()=>readProgress(old));
 const next=planCharacterService(p,'token:sex-change');assert.notEqual(typeof next,'string');if(typeof next==='string')return;assert.equal(next.sex,'male');assert.equal(p.sex,'female');assert.equal(cosmeticLook({skin:'rogue-female',wings:'none',aura:'none'},'mage','male').skin,'rogue');
});
test('service plans preserve progression and refund only attributes; class change removes incompatible spells',()=>{
 const p=profile();p.classId='mage';p.level=10;p.xp=totalXp(10);p.attributes.intelligence+=6;p.skillXp.magic=500;p.skills.magic=8;p.learnedSpells=(Object.keys(spells) as (keyof typeof spells)[]).filter(id=>canLearnSpell(id,p));
 const reset=planCharacterService(p,'token:stat-reset');assert.notEqual(typeof reset,'string');if(typeof reset==='string')return;assert.equal(attributePoints(reset.level,reset.attributes),27);assert.equal(reset.skillXp.magic,500);assert.deepEqual(reset.inventory,p.inventory);
 const change=planCharacterService(p,'token:class-change','knight');assert.notEqual(typeof change,'string');if(typeof change==='string')return;assert.equal(change.classId,'knight');assert.deepEqual(change.attributes,p.attributes);assert.equal(change.xp,p.xp);assert.ok(change.learnedSpells.every(id=>canLearnSpell(id,change)));assert.equal(typeof planCharacterService(p,'token:class-change','mage'),'string');assert.equal(typeof planCharacterService(profile(),'token:class-change','knight'),'string');assert.equal(typeof planCharacterService(profile(),'token:stat-reset'),'string');assert.ok(serviceCatalog.every(i=>i.amount===750));
});
test('SQL tokens grant once per verified payment, consume atomically, respect leases, refunds and account boundaries',async()=>{
 const db=await database();try{
 await db.exec(await readFile(new URL('../supabase/migrations/202611010001_character_services.sql',import.meta.url),'utf8'));
 const lease=randomUUID(),sku='token:sex-change',initial=writeProgress(profile(),0),changed=structuredClone(initial);changed.profile.sex='female';
 await db.query('select public.claim_character_slot($1,$2,$3::jsonb,1,$4)',[userA,lease,JSON.stringify(initial),'Hero']);
 const grant=(order:string,payment:string)=>db.query('select public.fulfill_cosmetic_order($1,$2,$3,$4,750,$5)',[order,userA,sku,payment,'usd']);
 const count=async(user=userA)=>(await db.query<{v:Record<string,number>}>('select public.list_service_tokens($1) v',[user])).rows[0].v[sku]??0;
 const use=(user=userA,session=lease)=>db.query('select public.use_character_service($1,$2,1,$3,$4::jsonb)',[user,session,sku,JSON.stringify(changed)]);
 await grant('order1','capture1');await grant('order1','capture1');assert.equal(await count(),1);assert.equal(await count(userB),0);
 await assert.rejects(grant('duplicate','capture1'));await assert.rejects(use(userA,randomUUID()),/SAVE_SESSION_EXPIRED/);assert.equal(await count(),1);
 await use();assert.equal(await count(),0);await assert.rejects(use(),/NO_SERVICE_TOKEN/);await grant('order1','capture1');assert.equal(await count(),0);
 assert.equal((await db.query<{sex:string}>("select progress#>>'{profile,sex}' sex from public.character_saves where user_id=$1",[userA])).rows[0].sex,'female');
 await grant('order2','capture2');await db.query('select public.block_cosmetic_payment($1,$2,true)',['capture2','refund']);assert.equal(await count(),0);await assert.rejects(use(),/NO_SERVICE_TOKEN/);
 await grant('order3','capture3');const both=await Promise.allSettled([use(),use()]);assert.equal(both.filter(r=>r.status==='fulfilled').length,1);assert.equal(await count(),0);
 await db.exec('set role authenticated');await assert.rejects(db.query('select public.list_service_tokens($1)',[userA]),/permission denied/);
 }finally{await db.close()}
});

test('PayPal token checkout uses $7.50 and rejects a $5 capture or forged account',async()=>{
 const {CosmeticStore}=await import('../apps/server/src/cosmetic-store');const {createServer}=await import('node:http');let created:any,grants=0;
 const sku='token:sex-change';const order:any={id:'SERVICE123',intent:'CAPTURE',status:'COMPLETED',purchase_units:[{custom_id:`${userA}|${sku}`,amount:{currency_code:'USD',value:'7.50'},items:[{sku,quantity:'1',unit_amount:{currency_code:'USD',value:'7.50'}}],payments:{captures:[{id:'PAID123',status:'COMPLETED',amount:{currency_code:'USD',value:'5.00'}}]}}]};
 const transport:typeof fetch=async(input,init)=>{const u=String(input);if(u.endsWith('/v1/oauth2/token'))return Response.json({access_token:'test',expires_in:3600});if(u.endsWith('/v2/checkout/orders')){created=JSON.parse(init!.body as string);return Response.json({links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=SERVICE123'}]})}return Response.json(order)};
 const shop=new CosmeticStore({verify:async()=>({id:userA}),request:async(path,body:any)=>{if(path.endsWith('list_cosmetic_entitlements'))return [];if(path.endsWith('list_service_tokens'))return {};assert.equal(body.p_amount,750);grants++;return null}},{clientId:'x',secret:'x',webhookId:'x',origin:'https://game.test',environment:'sandbox'},transport);shop.enabled=true;
 const server=createServer((req,res)=>void shop.handle(req,res));server.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${(server.address() as any).port}/shop`,headers={Authorization:'Bearer test'};
 try{assert.equal((await fetch(url+'/checkout',{method:'POST',headers,body:JSON.stringify({sku,amount:1})})).status,200);assert.equal(created.purchase_units[0].amount.value,'7.50');
 const capture=()=>fetch(url+'/capture',{method:'POST',headers,body:JSON.stringify({order:'SERVICE123'})});assert.equal((await capture()).status,503);assert.equal(grants,0);
 order.purchase_units[0].payments.captures[0].amount.value='7.50';order.purchase_units[0].custom_id=`${userB}|${sku}`;assert.equal((await capture()).status,503);assert.equal(grants,0);
 order.purchase_units[0].custom_id=`${userA}|${sku}`;assert.equal((await capture()).status,200);assert.equal(grants,1);assert.equal((await fetch(url+'/checkout',{method:'POST',headers,body:JSON.stringify({sku})})).status,200,'service tokens can be purchased again');
 }finally{await new Promise<void>(r=>server.close(()=>r()))}
});

test('a failed token transaction blocks later saves from persisting an unconfirmed change',async()=>{
 const {SaveSession}=await import('../apps/server/src/persistence');let saves=0;
 const session=new SaveSession({verify:async()=>({id:userA,email:'test@example.test'}),claim:async(_u,_l,p)=>p,useService:async()=>{throw Error('Network lost after request')},save:async()=>{saves++;return 'now'}},{id:userA,email:'test@example.test'});
 await assert.rejects(session.useService('token:sex-change',writeProgress(profile(),0)));
 await assert.rejects(session.save(writeProgress(profile(),0),true),/Save transaction failed/);assert.equal(saves,0);
});
