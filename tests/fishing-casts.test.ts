import {elderwoodTown} from '@realm/game-data';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter} from '@realm/shared';
import {resolveFishingWater,fishingShores} from '@realm/game-data';
const setup=(roll=0)=>{const e=new Economy(()=>roll);e.join('p');const node=resolveFishingWater('elderwood',8+elderwoodTown.x,25+elderwoodTown.y)!,p=Object.assign(newFighter(),fishingShores(node)[0]),profile=e.profiles.get('p')!,players=new Map([['p',p]]);return {e,node,p,profile,players};};
test('server chooses 1–10 second casts, rejects resets and early rewards, and grants one catch per manual recast',()=>{
 for(const roll of [0,.999]){const {e,node,p,profile,players}=setup(roll),duration=roll?10:1;e.act('p',p,{kind:'gather',item:node.id,delay:0,fish:'voidAngler'},0);const cast=e.snapshot('p',0).fishing!;assert.equal(cast.endsAt,duration);cast.endsAt=0;assert.equal(e.professions.status('p')!.endsAt,duration);assert.match(e.act('p',p,{kind:'gather',item:node.id},.5),/Already fishing/);e.process([],players,duration-.001);assert.equal(profile.inventory.length,0);assert.equal(profile.professions.fishing,0);e.process([],players,duration);assert.equal(profile.inventory[0].item,'pondMinnow');assert.equal(profile.inventory[0].quantity,1);e.process([],players,duration+1);assert.equal(profile.inventory[0].quantity,1);assert.equal(e.professions.results.length,1);assert.equal(e.professions.depleted.size,0);assert.match(e.act('p',p,{kind:'gather',item:node.id},duration+1),/Fishing/);}
});
test('moving, travel, attacking, death or logout cancels a cast without awarding fish or EXP',()=>{
 for(const reason of ['movement','travel','attack','death','logout']){const {e,node,p,profile,players}=setup();e.act('p',p,{kind:'gather',item:node.id},0);if(reason==='movement')p.x+=.2;if(reason==='travel')p.region='woods';if(reason==='attack')p.auto=true;if(reason==='death')p.hp=0;if(reason==='logout')e.professions.leave('p');e.process([],players,1);assert.equal(e.professions.status('p'),null);assert.equal(profile.inventory.length,0);assert.equal(profile.professions.fishing,0);}
});
test('two players can cast into the same water independently and inventory changes cannot force an overflowing catch',()=>{
 const {e,node,p,profile,players}=setup();e.join('other');const other=Object.assign(newFighter(),fishingShores(node)[1]);players.set('other',other);e.act('p',p,{kind:'gather',item:node.id},0);e.act('other',other,{kind:'gather',item:node.id},0);assert.ok(e.professions.status('other'));e.process([],players,1);assert.equal(profile.inventory[0].quantity,1);assert.equal(e.profiles.get('other')!.inventory[0].quantity,1);
 e.act('p',p,{kind:'gather',item:node.id},1);profile.inventory=Array.from({length:32},(_,id)=>({id,item:'pelt',quantity:20}));e.process([],players,2);assert.equal(profile.professions.fishing,25);assert.ok(e.professions.results.at(-1)!.message.includes('full'));assert.equal(e.professions.status('p'),null);
});
