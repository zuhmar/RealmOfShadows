import {Client} from 'colyseus.js';
import assert from 'node:assert/strict';
import {walkTo} from './helpers/walk';
const room=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2567').create('elderwood');let bag:any;const events:any[]=[];
room.onMessage('economy-state',s=>bag=s);room.onMessage('combat-event',e=>events.push(e));for(const name of ['economy-result','combat-error','travel-complete','travel-error'])room.onMessage(name,()=>{});
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));async function until(fn:()=>boolean){for(let i=0;i<150;i++){if(fn())return;await wait(100);}throw Error('Shielding integration timed out');}
try{await until(()=>!!bag);room.send('economy',{kind:'attribute',attribute:'vitality',level:100,points:999});await wait(150);assert.equal(bag.attributes.vitality,10);assert.equal(bag.attributePoints,0);
 room.send('economy',{kind:'equip-item',item:'woodenShield'});await until(()=>room.state.players.get(room.sessionId).shieldArmor===1);room.send('travel','woods');await until(()=>room.state.players.get(room.sessionId).region==='woods');await walkTo(room,{x:16,y:8.4},1);
 room.send('combat',{kind:'bolt',target:'wolf-1'});await until(()=>room.state.wolves.get('wolf-1').hp<65);room.send('combat',{kind:'stop'});await until(()=>bag.skillXp.shielding>=5);assert.ok(room.state.players.get(room.sessionId).shieldingXp>=5);assert.ok(events.some(e=>e.kind==='block'&&e.damage===1));
 const before=bag.skillXp.shielding;room.send('economy',{kind:'unequip-item',slot:'offhand'});await until(()=>room.state.players.get(room.sessionId).shieldArmor===0);await wait(2000);assert.equal(bag.skillXp.shielding,before);console.log('PASS shielding multiplayer: forged attributes rejected, equipped shield state, real retaliation blocks and skill XP synchronization, unequipping stops training');
}finally{await room.leave(true);}
