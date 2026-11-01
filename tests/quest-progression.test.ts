import {test} from 'node:test';import assert from 'node:assert/strict';
import {quests,questById,monsters,totalXp,merchant} from '@realm/game-data';
import {Economy,newFighter} from '@realm/shared';import {readProgress,writeProgress} from '../packages/shared/src/saves';
test('island hunts, side goals and rewards increase while boss trials include tougher encounters',()=>{
 const islands=['woods','caverns','swamp','tundra','celestial','peaks','fortress'];let kills=0,identify=0,loot=0;
 for(const island of islands){const q=questById(`${island}-main-1`)!,boss=questById(`${island}-main-2`)!;
 const next=q.objectives.reduce((n,o)=>n+o.count,0);assert.ok(next>kills);kills=next;assert.equal(boss.objectives[0].count,1);assert.ok(boss.objectives[1].count>0);
 const side1=questById(`${island}-side-1`)!,side2=questById(`${island}-side-2`)!,side3=questById(`${island}-side-3`)!;
 assert.deepEqual(side2.storyRequires,[side1.id]);assert.deepEqual(side3.storyRequires,[side2.id]);assert.ok(side2.objectives[0].count>identify);identify=side2.objectives[0].count;assert.ok(side3.objectives[0].count>loot);loot=side3.objectives[0].count;assert.ok(side1.xp<side2.xp&&side2.xp<side3.xp);assert.ok(side1.gold<side2.gold&&side2.gold<side3.gold);
 }
 for(const island of ['woods','caverns']){const hp=(suffix:string)=>questById(`${island}-${suffix}`)!.objectives.reduce((n,o)=>n+monsters[o.target as keyof typeof monsters].hp*o.count,0);assert.ok(hp('main-2')>hp('main-1'));}
 assert.equal(quests.filter(q=>q.playable).length,15,'planned islands remain planned');
});
test('new side quests unlock in sequence and cannot be accepted early through forged requests',()=>{
 const e=new Economy();e.join('p');const p=Object.assign(newFighter(),merchant),f=e.profiles.get('p')!;
 assert.match(e.act('p',p,{kind:'quest-accept',item:'woods-side-2'},0),/previous side quest/);assert.equal(f.quests['woods-side-2'],undefined);
 f.quests['woods-side-1']={progress:[5],claimed:true};assert.match(e.act('p',p,{kind:'quest-accept',item:'woods-side-2'},0),/accepted/);
 assert.match(e.act('p',p,{kind:'quest-accept',item:'woods-side-3'},0),/previous side quest/);
});
test('legacy completed quests and active credits survive harder goals without re-awarding rewards',()=>{
 const e=new Economy();e.join('p');const f=e.profiles.get('p')!;f.xp=totalXp(20);f.level=20;f.classId='mage';f.gold=321;
 const save:any=writeProgress(f,0);save.profile.quests={
 'woods-main-1':{progress:[6,4],claimed:true},'woods-main-2':{progress:[1],claimed:true},
 'caverns-main-1':{progress:[6,4],claimed:true},'caverns-main-2':{progress:[1],claimed:false},
 'caverns-side-2':{progress:[2],claimed:true},'caverns-side-3':{progress:[4],claimed:false}};
 const loaded=readProgress(save);assert.deepEqual(loaded.profile.quests['caverns-main-1'].progress,[10,6]);assert.deepEqual(loaded.profile.quests['woods-main-2'],{progress:[1,3],claimed:true});assert.deepEqual(loaded.profile.quests['caverns-main-2'],{progress:[1,0],claimed:false});assert.deepEqual(loaded.profile.quests['caverns-side-2'],{progress:[3],claimed:true});assert.deepEqual(loaded.profile.quests['caverns-side-3'].progress,[4]);assert.equal(loaded.profile.gold,321);assert.equal(loaded.profile.xp,f.xp);
 loaded.profile.quests['caverns-main-2'].progress[1]=2;assert.deepEqual(readProgress(loaded).profile.quests,loaded.profile.quests,'migration is idempotent and retains new guard credits');
 const forged=structuredClone(save);forged.profile.quests['woods-main-2']={progress:[0],claimed:true};assert.throws(()=>readProgress(forged));
});
