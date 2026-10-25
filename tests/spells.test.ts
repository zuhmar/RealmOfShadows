import {monsterSpawns} from '@realm/game-data';
const wolfSpawn=monsterSpawns.find(s=>s.id==='wolf-1')!;
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spells,merchant,type SpellId} from '@realm/game-data';
import {Economy} from '../packages/shared/src/economy';
import {CombatSimulation,newFighter} from '../packages/shared/src/combat';

test('auto attack waits for range and sight without moving, resumes, and stops',()=>{
 const sim=new CombatSimulation(),p={...newFighter(),region:'woods' as const,weapon:'sword' as const,x:29,y:20};
 assert.equal(sim.action('p',p,'bolt','wolf-1'),true);sim.tick(.05,[['p',p]]);assert.equal(p.auto,true);assert.equal(p.x,29);assert.equal(p.y,20);assert.equal(sim.wolves.get('wolf-1')!.hp,65);
 p.x=wolfSpawn.x-.8;p.y=wolfSpawn.y;sim.tick(.05,[['p',p]]);assert.ok(sim.wolves.get('wolf-1')!.hp<65);
 p.x=16.5;p.y=15.5;sim.tick(.05,[['p',p]]);assert.equal(p.auto,true);const hp=sim.wolves.get('wolf-1')!.hp;sim.tick(.05,[['p',p]]);assert.equal(sim.wolves.get('wolf-1')!.hp,hp);
 assert.equal(sim.action('p',p,'stop',''),true);assert.equal(p.auto,false);
});
test('learning requires proximity, class, level and gold; repeated requests cannot charge twice',()=>{
 for(const id of Object.keys(spells) as SpellId[]){const e=new Economy(),p=newFighter();e.join('p');const a=e.profiles.get('p')!;assert.deepEqual(a.learnedSpells,[]);a.gold=100;
 e.act('p',p,{kind:'learn',spell:id},0);assert.deepEqual(a.learnedSpells,[]);p.x=merchant.x;p.y=merchant.y;
 const s=spells[id];if(s.classId!=='shared'){e.act('p',p,{kind:'learn',spell:id,classId:s.classId,level:99},0);assert.deepEqual(a.learnedSpells,[]);a.classId=s.classId;a.level=4;e.act('p',p,{kind:'learn',spell:id},0);assert.deepEqual(a.learnedSpells,[]);a.level=5;}
 e.act('p',p,{kind:'learn',spell:id},0);assert.deepEqual(a.learnedSpells,[id]);assert.equal(a.gold,100-s.price);e.act('p',p,{kind:'learn',spell:id},0);assert.equal(a.gold,100-s.price);const snap=e.snapshot('p',0);snap.learnedSpells.length=0;assert.deepEqual(a.learnedSpells,[id]);
 }
});
test('casting denies unknown and unlearned spells and wrong classes; checks mana, range and individual cooldowns',()=>{
 const sim=new CombatSimulation(),p={...newFighter(),region:'woods' as const,x:wolfSpawn.x-.8,y:wolfSpawn.y},access={classId:'mage' as const,level:5,learnedSpells:[] as SpellId[]};
 assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',access),false);assert.equal(sim.action('p',p,'nova','wolf-1'),false);assert.equal(sim.castSpell('p',p,'__proto__','wolf-1',access),false);
 access.learnedSpells=['moonNova','spark','cleave'];assert.equal(sim.castSpell('p',p,'cleave','wolf-1',access),false);p.mana=0;assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',access),false);p.mana=100;p.x=29;assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',access),false);p.x=wolfSpawn.x-.8;
 assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',access),true);assert.equal(p.mana,75);assert.equal(sim.castSpell('p',p,'moonNova','wolf-1',access),false);assert.equal(sim.castSpell('p',p,'spark','wolf-1',access),true);assert.equal(p.mana,65);
});
test('shared Mend works without a target or magic weapon and never spends mana at full health',()=>{
 const sim=new CombatSimulation(),p={...newFighter(),weapon:'sword' as const},access={classId:'citizen' as const,level:1,learnedSpells:['mend'] as SpellId[]};
 assert.equal(sim.castSpell('p',p,'mend','',access),false);assert.equal(p.mana,100);p.hp=50;assert.equal(sim.castSpell('p',p,'mend','',access),true);assert.equal(p.hp,80);assert.equal(p.mana,80);assert.equal(sim.castSpell('p',p,'mend','',access),false);
});
test('every class spell works only after learning, applies its skill and respects cooldown',()=>{
 for(const spell of ['cleave','powerShot','moonNova','shadowStrike'] as const){const sim=new CombatSimulation(),p={...newFighter(),region:'woods' as const,x:wolfSpawn.x-.8,y:wolfSpawn.y},s=spells[spell],access={classId:s.classId,level:5,learnedSpells:[spell]};
 assert.equal(sim.castSpell('p',p,spell,'wolf-1',access),true);assert.equal(sim.castSpell('p',p,spell,'wolf-1',access),false);assert.equal(p.mana,100-s.cost);sim.tick(.1,[['p',p]]);assert.ok(sim.wolves.get('wolf-1')!.hp<65);assert.ok(p[`${s.skill}Xp`]>=5);assert.equal(p[`${s.skill}Xp`]%5,0);
 }
});
