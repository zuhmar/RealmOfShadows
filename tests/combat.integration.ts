import {merchant,portalFor,monsterSpawns,allMonsterSpawns} from '@realm/game-data';
import {walkTo} from './helpers/walk';
import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
const endpoint=process.env.TEST_SERVER_URL??'ws://localhost:2567',wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const a=await new Client(endpoint).joinOrCreate('elderwood'),b=await new Client(endpoint).joinOrCreate('elderwood');
for(const room of [a,b])for(const name of ['combat-event','combat-error','travel-complete','travel-error','economy-state','economy-result'])room.onMessage(name,()=>{});
let bag:any,observerBag:any;a.onMessage('economy-state',state=>bag=state);b.onMessage('economy-state',state=>observerBag=state);
try{
 await wait(200);assert.equal(a.roomId,b.roomId);assert.equal(a.state.wolves.size,allMonsterSpawns.length);
 a.send('travel','woods');b.send('travel','woods');await wait(200);
 a.send('combat',{kind:'bolt',target:'wolf-1',damage:99999});await wait(150);assert.equal(a.state.wolves.get('wolf-1').hp,65);
 a.send('combat',{kind:'stop'});await wait(150);
 for(const item of ['clothHood','clothTunic','clothTrousers','leatherBoots','woodenShield']){a.send('economy',{kind:'equip-item',item});await wait(150);}
 await walkTo(a,{x:16,y:8.4},1);await wait(100);
 const mana=a.state.players.get(a.sessionId).mana;
 for(let i=0;i<20;i++)a.send('combat',{kind:'nova',target:'wolf-1',damage:99999});await wait(250);
 const caster=a.state.players.get(a.sessionId);assert.ok(caster.hp>0);assert.equal(caster.mana,mana);assert.deepEqual(bag.learnedSpells,[]);
 a.send('combat',{kind:'spell',spell:'moonNova',target:'wolf-1',learnedSpells:['moonNova'],classId:'mage'});await wait(200);assert.equal(a.state.players.get(a.sessionId).mana,mana);a.send('combat',{kind:'bolt',target:'wolf-1',damage:99999});await wait(400);assert.ok(a.state.wolves.get('wolf-1').hp<65);
 for(let i=0;i<60&&a.state.wolves.get('wolf-1').hp>0;i++)await wait(100);
 assert.equal(a.state.wolves.get('wolf-1').hp,0);assert.equal(b.state.wolves.get('wolf-1').hp,0);const player=a.state.players.get(a.sessionId);assert.ok(player.hp>0&&player.hp<100);assert.equal(b.state.players.get(b.sessionId).hp,100);assert.equal(b.state.players.get(a.sessionId).hp,player.hp);
 await wait(250);assert.equal(bag.xp,35);assert.equal(bag.drops.length,1);assert.equal(observerBag.xp,0);assert.equal(observerBag.drops.length,0);
 const firstDrop=bag.drops[0].id;b.send('economy',{kind:'pickup',drop:firstDrop});await wait(150);a.send('economy',{kind:'pickup',drop:firstDrop,gold:99999});await wait(200);a.send('economy',{kind:'pickup',drop:firstDrop});await wait(200);assert.equal(bag.gold,6);assert.equal(bag.inventory[0].quantity,1);assert.equal(observerBag.gold,0);assert.equal(bag.xp,35);
 a.send('economy',{kind:'award',gold:99999,xp:99999});await wait(150);a.send('economy',{kind:'sell',quantity:99999});await wait(150);assert.equal(bag.gold,6);assert.equal(bag.xp,35);
 a.send('combat',{kind:'bolt',target:'wolf-3'});for(let i=0;i<70&&a.state.wolves.get('wolf-3').hp>0;i++)await wait(100);assert.equal(a.state.wolves.get('wolf-3').hp,0);await wait(250);assert.equal(bag.xp,70);
 a.send('economy',{kind:'pickup',drop:bag.drops[0].id});await wait(200);assert.equal(bag.gold,12);assert.equal(bag.inventory[0].quantity,2);
 await walkTo(a,portalFor('woods').arrival,1001);await wait(150);a.send('travel','elderwood');await wait(200);assert.equal(a.state.players.get(a.sessionId).region,'elderwood');
 await walkTo(a,merchant,2000);
 a.send('economy',{kind:'sell',quantity:99999,price:99999});await wait(200);assert.equal(bag.gold,20);assert.equal(bag.inventory.length,0);
 a.send('economy',{kind:'buy',quantity:99999,price:0});await wait(200);a.send('economy',{kind:'buy',quantity:99999,price:0});await wait(200);assert.equal(bag.gold,8);assert.equal(bag.inventory[0].item,'potion');assert.equal(bag.inventory[0].quantity,1);assert.equal(observerBag.gold,0);
 console.log('PASS: EXP and private loot, duplicate/foreign pickup rejection, forged rewards rejected, second kill, merchant sale/purchase, insufficient funds');
 console.log('PASS: shared wolves, safe arrival, client damage ignored, projectile kill replicated, wolf bite damage, safe observer, unlearned/forged spells rejected');
}finally{await a.leave();await b.leave();}
