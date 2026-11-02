import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PartySystem,Economy,CombatSimulation,newFighter,type Fighter} from '@realm/shared';
function group(p:PartySystem,ids:string[],now=0){const online=()=>true;for(const id of ids.slice(1)){assert.match(p.act(ids[0],{kind:'invite',target:id},online,now),/sent/);assert.match(p.act(id,{kind:'accept',partyId:p.get(ids[0])!.id},online,now),/joined/);}}
function setup(){const e=new Economy(()=>0),sim=new CombatSimulation(),w=sim.wolves.get('wolf-1')!,players=new Map<string,Fighter>();e.automaticLoot=true;for(const id of ['a','b','c','d']){e.join(id);players.set(id,{...newFighter(),region:'woods',x:w.x,y:w.y+1});}return{e,sim,w,players};}

test('parties require invitations, enforce leader permissions/capacity and expire invites',()=>{
 const p=new PartySystem();assert.match(p.act('b',{kind:'accept',partyId:'fake'},()=>true,0),/expired/);
 group(p,['a','b','c','d']);assert.equal(p.get('a')!.members.length,4);
 assert.match(p.act('b',{kind:'kick',target:'a'},()=>true,0),/leader/);
 assert.match(p.act('b',{kind:'invite',target:'e'},()=>true,0),/leader/);
 assert.match(p.act('a',{kind:'invite',target:'e'},()=>true,0),/full/);
 p.remove('d');assert.match(p.act('a',{kind:'invite',target:'e'},()=>true,0),/sent/);
 assert.match(p.act('e',{kind:'accept',partyId:p.get('a')!.id},()=>true,61),/expired/);
 assert.match(p.act('a',{kind:'invite',target:'missing'},id=>id!=='missing',62),/online/);
 p.remove('a');assert.equal(p.get('b')!.leader,'b');assert.equal(p.get('a'),undefined);
});
test('leader departure invalidates old invites, and leaving/rejoining cannot create duplicate membership',()=>{
 const p=new PartySystem();group(p,['a','b']);p.act('a',{kind:'invite',target:'c'},()=>true,0);const id=p.get('a')!.id;p.remove('a');assert.match(p.act('c',{kind:'accept',partyId:id},()=>true,1),/expired/);
 group(p,['b','c'],2);assert.deepEqual(p.get('b')!.members,['b','c']);p.remove('c');p.remove('b');assert.equal(p.get('c'),undefined);
});
test('actual damage decides ownership; overkill and the last hit cannot steal a kill',()=>{
 const{e,sim,w,players}=setup();sim.damage(w,60,'a');sim.damage(w,9999,'b');const kill=sim.kills[0];assert.equal(kill.owner,'a');assert.deepEqual(kill.contributors,[{id:'a',damage:60},{id:'b',damage:5}]);e.process(sim.kills,players,0);assert.equal(e.profiles.get('a')!.xp,35);assert.equal(e.profiles.get('b')!.xp,0);
});
test('the highest combined party contribution wins, with conserved rotating EXP, gold, materials and gear',()=>{
 const{e,sim,w,players}=setup();group(e.parties,['a','b']);
 for(const id of ['a','b']){e.profiles.get(id)!.quests['woods-main-1']={claimed:false,progress:[0,0]};e.profiles.get(id)!.tasks.active={id:'00000000-0000-4000-8000-000000000001',monster:'wolf',goal:10,progress:0};}
 sim.damage(w,20,'a');sim.damage(w,20,'b');sim.damage(w,9999,'c');const kill=sim.kills[0];assert.equal(kill.owner,'c');
 e.process([kill],players,0);e.process([{...kill,id:2}],players,1);e.process([{...kill,id:2}],players,2);
 for(const id of ['a','b']){const p=e.profiles.get(id)!;assert.equal(p.xp,35);assert.equal(p.gold,6);assert.equal(p.inventory.find(s=>s.item==='pelt')!.quantity,1);assert.equal(p.gear.length,1);assert.deepEqual(p.quests['woods-main-1'].progress,[2,0]);assert.equal(p.tasks.active!.progress,2);}
 assert.equal(e.profiles.get('c')!.xp,0);assert.equal(e.profiles.get('d')!.gold,0);assert.equal(e.drops.size,0);
});
test('dead, distant and other-floor party members receive no rewards or quest credit',()=>{
 const{e,sim,w,players}=setup();group(e.parties,['a','b','c','d']);players.get('b')!.hp=0;players.get('c')!.x+=40;players.get('d')!.region='woods-upper';sim.damage(w,65,'a');e.process(sim.kills,players,0);assert.equal(e.profiles.get('a')!.xp,35);for(const id of ['b','c','d']){assert.equal(e.profiles.get(id)!.xp,0);assert.equal(e.profiles.get(id)!.gold,0);}
});
test('a full bag retains only its assigned bundle, without blocking others or duplicating loot',()=>{
 const{e,sim,w,players}=setup();group(e.parties,['a','b']);sim.damage(w,65,'a');const kill=sim.kills[0];e.process([kill],players,0);const b=e.profiles.get('b')!;b.inventory=Array.from({length:32},(_,id)=>({id,item:'pelt' as const,quantity:20}));e.process([{...kill,id:2}],players,1);assert.equal(e.drops.size,1);const drop=[...e.drops.values()][0];assert.equal(drop.owner,'b');assert.equal(e.profiles.get('a')!.gold,6);assert.equal(b.gold,3);assert.equal(b.gear.length,0);b.inventory=[];Object.assign(players.get('b')!,{x:drop.x,y:drop.y});e.process([],players,2);assert.equal(b.gold,6);assert.equal(b.gear.length,1);assert.equal(e.drops.size,0);e.process([],players,3);assert.equal(b.gear.length,1);
});
test('returning and healing a monster clears previous encounter contribution',()=>{
 const{sim,w,players}=setup();sim.damage(w,50,'a');assert.equal(sim.hasContribution('a'),true);players.get('a')!.region='elderwood';sim.tick(.1,players);for(let i=0;i<100&&w.mode==='return';i++)sim.tick(.1,players);assert.equal(w.hp,65);assert.equal(sim.hasContribution('a'),false);sim.damage(w,65,'b');assert.deepEqual(sim.kills.at(-1)!.contributors,[{id:'b',damage:65}]);
});
test('a fallen party member’s contribution still helps their surviving nearby group',()=>{
 const{e,sim,w,players}=setup();group(e.parties,['a','b']);sim.damage(w,40,'a');players.get('a')!.hp=0;sim.damage(w,5,'b');sim.damage(w,999,'c');e.process(sim.kills,players,0);assert.equal(e.profiles.get('a')!.xp,0);assert.equal(e.profiles.get('b')!.xp,35);assert.equal(e.profiles.get('c')!.xp,0);
});
