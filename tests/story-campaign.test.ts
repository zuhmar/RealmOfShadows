import {test} from 'node:test';import assert from 'node:assert/strict';
import {resourceNodes,craftingBench,quests,questById,questContact,storyNpcs,storyKeepsakes,storyRank,storyItems,classPaths,atStoryNpc,portalFor,recordQuestEvent,recordQuestFacts,totalXp,merchant,validQuestJournal,type ClassId,type QuestJournal} from '@realm/game-data';
import {Economy,newFighter,legal,pathfind} from '@realm/shared';import {readProgress,writeProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy(()=>0);e.join('p');const profile=e.profiles.get('p')!,rowan=storyNpcs.find(n=>n.id==='rowan')!,p=Object.assign(newFighter(),rowan);return{e,profile,p};};
test('Dawnreach campaign has nine distinct human contacts, forty quests and connected chapter prerequisites',()=>{
 assert.equal(storyNpcs.length,9);assert.equal(new Set(storyNpcs.map(n=>n.skin)).size,9);assert.equal(quests.length,40);assert.equal(quests.filter(q=>q.playable).length,15);
 for(const n of storyNpcs){assert.ok(legal(n,n.region),n.name+' legal placement');assert.ok(pathfind(portalFor(n.region).arrival,n,n.region).length,n.name+' reachable');}
 for(const q of quests){assert.ok(questContact(q,'mage'));assert.ok(q.description.length>40);assert.ok(q.accept.length>30);assert.ok(q.completion.length>30);}
 assert.deepEqual(questById('caverns-main-1')!.storyRequires,['woods-main-2']);assert.equal(questById('fortress-main-2')!.level,100);
});
test('prologue conversations require the real contact and award a persistent, nonduplicated family keepsake',()=>{
 const{e,profile,p}=setup();e.act('p',p,{kind:'quest-accept',item:'elderwood-main-1'},0);assert.deepEqual(profile.quests['elderwood-main-1'].progress,[0]);
 assert.match(e.act('p',{...p,x:5,y:5},{kind:'quest-talk',item:'rowan'},0),/closer/);assert.match(e.act('p',{...p,region:'woods'},{kind:'quest-talk',item:'rowan'},0),/closer/);assert.deepEqual(profile.quests['elderwood-main-1'].progress,[0]);
 e.act('p',p,{kind:'quest-talk',item:'rowan'},0);e.act('p',p,{kind:'quest-claim',item:'elderwood-main-1'},0);const gold=profile.gold;e.act('p',p,{kind:'quest-claim',item:'elderwood-main-1'},0);assert.equal(profile.gold,gold);assert.deepEqual(storyKeepsakes(profile.quests,profile.classId),['familyLocket']);assert.equal(profile.inventory.length,0);assert.equal(profile.learnedSpells.length,0);
 const saved=readProgress(writeProgress(profile,0));assert.deepEqual(storyKeepsakes(saved.profile.quests,saved.profile.classId),['familyLocket']);
});
test('every class earns only its own insignia through a real class choice and primary training',()=>{
 for(const id of Object.keys(classPaths) as Exclude<ClassId,'citizen'>[]){const{e,profile,p}=setup();profile.quests['elderwood-main-1']={progress:[1],claimed:true};profile.xp=totalXp(5);profile.level=5;e.act('p',p,{kind:'quest-accept',item:'elderwood-main-2'},0);assert.deepEqual(profile.quests['elderwood-main-2'].progress,[0,0]);e.act('p',p,{kind:'class',classId:id},0);recordQuestFacts(profile);assert.deepEqual(profile.quests['elderwood-main-2'].progress,[1,0]);profile.skills[classPaths[id].skill]=2;recordQuestFacts(profile);const mentor=questContact(questById('elderwood-main-2')!,id);Object.assign(p,mentor);e.act('p',p,{kind:'quest-claim',item:'elderwood-main-2'},0);assert.ok(profile.quests['elderwood-main-2'].claimed);const seals=storyKeepsakes(profile.quests,id).filter(k=>k.endsWith('Insignia'));assert.deepEqual(seals,[classPaths[id].insignia]);assert.equal(profile.learnedSpells.length,0);assert.equal(storyRank(profile),`Apprentice ${classPaths[id].name}`);}
});
test('new chapters require the preceding chapter while existing accepted journals remain compatible',()=>{
 const{e,profile,p}=setup();Object.assign(p,merchant);profile.xp=totalXp(11);profile.level=11;profile.classId='mage';assert.match(e.act('p',p,{kind:'quest-accept',item:'caverns-main-1'},0),/previous story/);
 profile.quests['caverns-main-1']={progress:[2,1],claimed:false};assert.ok(validQuestJournal(profile.quests,11));const restored=readProgress(writeProgress(profile,0));assert.deepEqual(restored.profile.quests['caverns-main-1'].progress,[2,1]);
 assert.match(e.act('p',p,{kind:'quest-accept',item:'swamp-main-1'},0),/not available/);
});
test('final class mastery and quest keepsakes are derived from completed chapters, never a universal warrior title',()=>{
 const journal:QuestJournal={};for(const q of quests.filter(q=>q.type==='main'))journal[q.id]={progress:q.objectives.map(o=>o.count),claimed:true};
 for(const id of Object.keys(classPaths) as Exclude<ClassId,'citizen'>[]){assert.equal(storyRank({quests:journal,classId:id}),`Master ${classPaths[id].name}`);assert.ok(storyKeepsakes(journal,id).includes('memorialStar'));assert.equal(storyKeepsakes(journal,id).length,16);}
 assert.equal(Object.keys(storyItems).length,20);
});

test('profession side quests advance only after successful gathering, fishing or crafting',()=>{
 const{e,profile,p}=setup(),lysa=storyNpcs.find(n=>n.id==='lysa')!,varek=storyNpcs.find(n=>n.id==='varek')!;Object.assign(p,lysa);e.act('p',p,{kind:'quest-accept',item:'elderwood-side-2'},0);
 const node=resourceNodes.find(n=>n.item==='copperOre')!;Object.assign(p,{region:node.region,x:node.x,y:node.y});e.act('p',p,{kind:'gather',item:node.id},0);assert.deepEqual(profile.quests['elderwood-side-2'].progress,[1]);e.act('p',p,{kind:'gather',item:node.id},1);assert.deepEqual(profile.quests['elderwood-side-2'].progress,[1]);
 profile.inventory=Array.from({length:32},(_,id)=>({id,item:'pelt',quantity:20}));e.act('p',p,{kind:'gather',item:node.id},301);assert.deepEqual(profile.quests['elderwood-side-2'].progress,[1]);
 Object.assign(p,varek);e.act('p',p,{kind:'quest-accept',item:'elderwood-side-3'},302);Object.assign(p,{...craftingBench,region:'elderwood'});profile.inventory=[];e.act('p',p,{kind:'craft',item:'smelt-copper'},302);assert.deepEqual(profile.quests['elderwood-side-3'].progress,[0]);profile.inventory=[{id:900,item:'copperOre',quantity:3}];e.act('p',p,{kind:'craft',item:'smelt-copper'},303);assert.deepEqual(profile.quests['elderwood-side-3'].progress,[1]);assert.equal(profile.inventory[0].item,'copperBar');Object.assign(p,varek);e.act('p',p,{kind:'quest-claim',item:'elderwood-side-3'},304);assert.ok(storyKeepsakes(profile.quests,profile.classId).includes('trainingManual'));assert.equal(profile.inventory[0].item,'copperBar');
});
