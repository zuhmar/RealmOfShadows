import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CombatSimulation,newFighter,sight,type Fighter} from '../packages/shared/src/combat';
import {combat as C} from '@realm/game-data';
const setup=()=>{const sim=new CombatSimulation(),p:Fighter={...newFighter(),region:'woods',x:15,y:5.8};return {sim,p};};
test('auto attack arms outside range and sanctuary; invalid targets and dead actors are rejected',()=>{
 const {sim,p}=setup();assert.equal(sim.action('p',newFighter(),'bolt','wolf-1'),false);assert.equal(sim.action('p',{...p,x:16.5,y:15.5},'bolt','wolf-1'),true);assert.equal(sim.action('p',p,'bolt','missing'),false);assert.equal(sim.action('p',{...p,x:29,y:20},'bolt','wolf-1'),true);assert.equal(sight({x:14.5,y:3.8},{x:18,y:3.8}),false);p.hp=0;assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',{classId:'mage',level:5,learnedSpells:['moonNova']}),false);
});
test('projectiles have travel time, server damage, repeat cooldown and lethal cleanup',()=>{
 const {sim,p}=setup();assert.equal(sim.action('p',p,'bolt','wolf-1'),true);const w=sim.wolves.get('wolf-1')!;assert.equal(w.hp,C.wolf.hp);for(let i=0;i<20;i++)sim.action('p',p,'bolt','wolf-1');assert.equal(sim.projectiles.size,1);sim.tick(.05,[['p',p]]);assert.equal(w.hp,C.wolf.hp);sim.tick(.05,[['p',p]]);assert.equal(w.hp,C.wolf.hp-C.bolt.damage);for(let i=0;i<80;i++)sim.tick(.05,[['p',p]]);assert.equal(w.hp,0);assert.equal(w.mode,'dead');assert.equal(sim.action('p',p,'bolt','wolf-1'),false);sim.tick(.05,[['p',p]]);assert.equal(p.auto,false);
});
test('area spell consumes mana once, respects cooldown and affects only nearby wolves',()=>{
 const {sim,p}=setup(),near=sim.wolves.get('wolf-3')!;near.x=16.5;near.y=6.3;sim.wolves.get('wolf-2')!.x=14;sim.wolves.get('wolf-2')!.y=4.5;assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',{classId:'mage',level:5,learnedSpells:['moonNova']}),true);assert.equal(p.mana,75);assert.equal(sim.wolves.get('wolf-1')!.hp,37);assert.equal(near.hp,37);assert.equal(sim.wolves.get('wolf-2')!.hp,65);assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',{classId:'mage',level:5,learnedSpells:['moonNova']}),false);assert.equal(p.mana,75);sim.time=5;p.mana=0;assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',{classId:'mage',level:5,learnedSpells:['moonNova']}),false);
});
test('wolves chase, respect portal sanctuary, leash and restore health on return',()=>{
 const {sim,p}=setup(),w=sim.wolves.get('wolf-1')!;p.x=15;p.y=6.8;sim.damage(w,1,'p');sim.tick(.05,[['p',p]]);assert.equal(w.mode,'chase');assert.equal(w.target,'p');w.x=18;w.y=6.8;w.hp=10;p.region='elderwood';sim.tick(.05,[['p',p]]);assert.equal(w.mode,'return');for(let i=0;i<100;i++)sim.tick(.05,[['p',p]]);assert.equal(w.hp,65);assert.equal(w.mode,'idle');assert.equal(w.target,'');p.region='woods';p.x=16.5;p.y=15.5;sim.tick(.05,[['p',p]]);assert.equal(w.target,'');
});
test('wolf kills respawn at spawn and player death returns safely to Elderwood',()=>{
 const {sim,p}=setup(),w=sim.wolves.get('wolf-1')!;sim.damage(w,999);sim.tick(C.wolf.respawn+.1,[]);assert.equal(w.hp,65);assert.equal(w.x,w.spawnX);p.hp=1;sim.damage(w,1,'p');sim.tick(.05,[['p',p]]);assert.equal(p.hp,0);assert.equal(sim.action('p',p,'bolt','wolf-1'),false);for(let i=0;i<65;i++)sim.tick(.05,[['p',p]]);assert.equal(p.region,'elderwood');assert.equal(p.hp,100);assert.equal(p.auto,false);
});
test('travel and disconnect cancel in-flight projectile damage',()=>{
 const {sim,p}=setup();sim.action('p',p,'bolt','wolf-1');p.region='elderwood';sim.tick(.1,[['p',p]]);assert.equal(sim.projectiles.size,0);assert.equal(sim.wolves.get('wolf-1')!.hp,65);
});
