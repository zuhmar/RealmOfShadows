import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
const client=new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567'),room=await client.create('elderwood');
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));let bag:any;
for(const name of ['combat-event','combat-error','travel-complete','travel-error','economy-result'])room.onMessage(name,()=>{});room.onMessage('economy-state',state=>bag=state);
try{
 await wait(250);assert.equal(bag.classId,'citizen');room.send('economy',{kind:'class',classId:'knight',level:99,xp:999999});await wait(150);assert.equal(bag.classId,'citizen');room.send('economy',{kind:'equip',weapon:'knightSword'});await wait(150);assert.equal(bag.weapon,'wand');
 room.send('economy',{kind:'equip',weapon:'bow'});await wait(150);assert.equal(bag.weapon,'bow');assert.equal(room.state.players.get(room.sessionId).weapon,'bow');room.send('travel','woods');await wait(200);
 for(let seq=1;seq<50&&room.state.players.get(room.sessionId).x<19.7;seq++){room.send('input',{x:1,y:0,sprint:false,seq});await wait(55);}await wait(100);
 room.send('combat',{kind:'nova',target:'wolf-1',weapon:'mageStaff',skill:99});await wait(150);assert.equal(room.state.players.get(room.sessionId).mana,100);
 room.send('combat',{kind:'bolt',target:'wolf-1',weapon:'mageStaff',damage:999});await wait(400);assert.ok(room.state.wolves.get('wolf-1').hp<65&&room.state.wolves.get('wolf-1').hp>0);assert.ok(room.state.players.get(room.sessionId).distanceXp>=5);assert.equal(room.state.players.get(room.sessionId).magicXp,0);
 room.send('economy',{kind:'equip',weapon:'sword'});await wait(150);assert.equal(bag.weapon,'bow');room.send('combat',{kind:'stop'});await wait(150);room.send('economy',{kind:'equip',weapon:'sword'});await wait(150);assert.equal(bag.weapon,'sword');room.send('combat',{kind:'bolt',target:'wolf-1'});await wait(200);assert.ok(room.state.players.get(room.sessionId).meleeXp>=5);assert.equal(bag.classId,'citizen');
 console.log('PASS: Citizen level gate, forged class/weapon/damage rejection, owned bow/sword equip, non-magic nova rejection, matching skill EXP and combat swap lock');
}finally{await room.leave();}
