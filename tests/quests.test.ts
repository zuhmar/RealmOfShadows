import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quests,questById,recordQuestEvent,merchant,validQuestJournal,totalXp,gearDefinition} from '@realm/game-data';
import {Economy,newFighter} from '@realm/shared';
import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy(()=>0);e.join('p');const p=Object.assign(newFighter(),merchant),profile=e.profiles.get('p')!;return {e,p,profile};};
test('each combat island has exactly two sequential main quests and three optional side quests',()=>{
 assert.equal(quests.length,35);assert.equal(new Set(quests.map(q=>q.id)).size,35);
 for(const island of new Set(quests.map(q=>q.island))){const group=quests.filter(q=>q.island===island);assert.equal(group.filter(q=>q.type==='main').length,2);assert.equal(group.filter(q=>q.type==='side').length,3);assert.equal(group[1].requires,group[0].id);assert.ok(group.every(q=>q.gold>0&&q.xp>0));}
});
test('acceptance checks NPC proximity, prerequisites, level and planned islands; ignores forged rewards and progress',()=>{
 const {e,p,profile}=setup();assert.match(e.act('p',{...p,region:'woods'},{kind:'quest-accept',item:'woods-main-1'},0),/Visit Mara/);assert.match(e.act('p',p,{kind:'quest-accept',item:'woods-main-2'},0),/previous/);assert.match(e.act('p',p,{kind:'quest-accept',item:'caverns-main-1'},0),/level 11/);assert.match(e.act('p',p,{kind:'quest-accept',item:'swamp-main-1'},0),/not available/);
 e.act('p',p,{kind:'quest-accept',item:'woods-main-1',progress:[6,4],gold:999999},0);assert.deepEqual(profile.quests['woods-main-1'],{progress:[0,0],claimed:false});assert.match(e.act('p',p,{kind:'quest-claim',item:'woods-main-1'},0),/Complete/);assert.equal(profile.gold,0);assert.match(e.act('p',p,{kind:'quest-accept',item:'woods-main-1'},0),/already/);
});
test('only credited kills after acceptance count, including parent-island lower floors; claims pay once',()=>{
 const {e,p,profile}=setup();let id=0;const kill=(kind:'wolf'|'spider',region:'woods'|'woods-depths'|'caverns'='woods',owner='p')=>e.process([{id:++id,owner,region,kind,x:8.5,y:6.5}],new Map([['p',p]]),0);
 kill('wolf');e.act('p',p,{kind:'quest-accept',item:'woods-main-1'},0);kill('wolf','caverns');kill('wolf','woods','other');assert.deepEqual(profile.quests['woods-main-1'].progress,[0,0]);
 for(let i=0;i<6;i++)kill('wolf',i%2?'woods-depths':'woods');for(let i=0;i<4;i++)kill('spider');assert.deepEqual(profile.quests['woods-main-1'].progress,[6,4]);const before={gold:profile.gold,xp:profile.xp};e.act('p',p,{kind:'quest-claim',item:'woods-main-1'},0);e.act('p',p,{kind:'quest-claim',item:'woods-main-1'},0);assert.equal(profile.gold,before.gold+35);assert.equal(profile.xp,before.xp+100);e.act('p',p,{kind:'quest-accept',item:'woods-main-2'},0);assert.ok(profile.quests['woods-main-2']);
 const copy=e.snapshot('p',0);copy.quests['woods-main-1'].progress[0]=0;assert.equal(profile.quests['woods-main-1'].progress[0],6);
});
test('identification and successful private pickups advance side quests once and preserve all items',()=>{
 const {e,p,profile}=setup();e.act('p',p,{kind:'quest-accept',item:'woods-side-2'},0);e.act('p',p,{kind:'quest-accept',item:'woods-side-3'},0);
 const gear={id:crypto.randomUUID(),base:'clothTunic' as const,rarity:null};profile.gear.push(gear);e.act('p',p,{kind:'identify',item:gear.id},0);e.act('p',p,{kind:'identify',item:gear.id},0);assert.equal(profile.quests['woods-side-2'].progress[0],1);assert.equal(gearDefinition(gear.base).tier,'beginner');
 e.drops.set('d',{id:'d',owner:'p',region:'woods-depths',x:8.5,y:6.5,gold:6,pelts:1,expires:90});e.act('p',p,{kind:'pickup',drop:'d'},0);assert.equal(profile.quests['woods-side-3'].progress[0],0);Object.assign(p,{region:'woods-depths',x:8.5,y:6.5});e.act('p',p,{kind:'pickup',drop:'d'},0);e.act('p',p,{kind:'pickup',drop:'d'},0);assert.equal(profile.quests['woods-side-3'].progress[0],1);assert.equal(profile.inventory[0].quantity,1);assert.equal(profile.gear.length,1);
});
test('quest journals migrate old saves, persist partial/claimed state, and reject invalid or forged journals',()=>{
 const {e,p,profile}=setup();e.act('p',p,{kind:'quest-accept',item:'woods-main-1'},0);recordQuestEvent(profile.quests,'kill','wolf','woods');const save=writeProgress(profile,0);assert.deepEqual(readProgress(save).profile.quests,profile.quests);const legacy=structuredClone(save) as any;delete legacy.profile.quests;assert.deepEqual(readProgress(legacy).profile.quests,{});
 for(const journal of [{unknown:{progress:[1],claimed:false}},{'woods-main-1':{progress:[7,0],claimed:false}},{'woods-main-1':{progress:[0,0],claimed:true}},{'woods-main-2':{progress:[0],claimed:false}},{'woods-main-1':{progress:[1.5,0],claimed:false}},{'woods-main-1':{progress:[0,0],claimed:false,gold:999}}]){assert.equal(validQuestJournal(journal),false);const forged=structuredClone(save);forged.profile.quests=journal as any;assert.throws(()=>readProgress(forged));}
});
