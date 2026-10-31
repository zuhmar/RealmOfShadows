import {quests,questComplete,questContact,atStoryNpc,merchant,regions,storyPrologue,storyRank,storyKeepsakes,storyItems,type TaskState,type QuestJournal,type ClassId,type QuestDefinition} from '@realm/game-data';
import {itemSprite} from './item-assets';
export interface QuestBag{tasks?:TaskState;quests?:QuestJournal;level:number;classId:ClassId}
export type QuestAction=(request:{kind:string;item:string})=>void;
export interface QuestLocation{x:number;y:number;region:string}
export function canSpeakQuest(q:QuestDefinition,bag:QuestBag,p:QuestLocation){const npc=questContact(q,bag.classId);return atStoryNpc(p,npc.id)||(q.island!=='elderwood'&&p.region==='elderwood'&&Math.hypot(p.x-merchant.x,p.y-merchant.y)<=merchant.range);}
export function questCard(q:QuestDefinition,bag:QuestBag,position:QuestLocation,action:QuestAction){
 const journal=bag.quests??{},p=journal[q.id],done=!!p&&questComplete(q,p),card=document.createElement('article');card.className='quest-card';card.dataset.quest=q.id;
 const npc=questContact(q,bag.classId),near=canSpeakQuest(q,bag,position),title=document.createElement('strong');title.textContent=`${q.type==='main'?'Main':'Side'} · ${q.name}${p?.claimed?' · Completed':done?' · Ready to claim':''}`;
 const description=document.createElement('p');description.textContent=q.description;const contact=document.createElement('p');contact.className='quest-contact';contact.textContent=`Contact: ${npc.name} · ${regions[npc.region].name}${q.island==='elderwood'?'':' · Mara also coordinates this expedition'}`;
 const objectives=document.createElement('ul');for(let i=0;i<q.objectives.length;i++){const li=document.createElement('li');li.textContent=`${q.objectives[i].label} · ${p?.progress[i]??0}/${q.objectives[i].count}`;objectives.append(li);}
 const reward=document.createElement('p');reward.textContent=`Reward: ${q.gold} gold · ${q.xp} EXP · Level ${q.level}`;card.append(title,description,contact,objectives,reward);
 if(p&&!p.claimed){const dialogue=document.createElement('p');dialogue.className='story-dialogue';dialogue.textContent=q.accept;card.append(dialogue);}
 if(p?.claimed){const completion=document.createElement('p');completion.className='story-dialogue';completion.textContent=q.completion;card.append(completion);}
 else{
  const button=document.createElement('button');button.type='button';button.dataset.questAction=p?'claim':'accept';
  const locked=!!q.requires&&!journal[q.requires]?.claimed,chapterLocked=!p&&q.storyRequires?.some(id=>!journal[id]?.claimed),classLocked=!p&&q.classRequired&&bag.classId==='citizen',talk=!!p&&!done&&q.objectives.some(o=>o.event==='talk'&&o.target===npc.id)&&atStoryNpc(position,npc.id);
  button.textContent=!q.playable?'Coming with this island':locked||chapterLocked?'Finish the previous story chapter':bag.level<q.level?`Requires level ${q.level}`:classLocked?'Choose your class first':!near?`Visit ${npc.name}${q.island==='elderwood'?'':' or Mara'}`:talk?'Continue conversation':p?done?'Claim reward':'In progress':'Accept quest';
  button.disabled=!q.playable||!!locked||!!chapterLocked||bag.level<q.level||!!classLocked||!near||!!p&&!done&&!talk;
  button.addEventListener('click',()=>action({kind:talk?'quest-talk':p?'quest-claim':'quest-accept',item:talk?npc.id:q.id}));card.append(button);
 }
 return card;
}
export function renderQuests(bag:QuestBag,position:QuestLocation,action:QuestAction){
 const host=document.querySelector<HTMLElement>('#quest-list')!,journal=bag.quests??{},key=JSON.stringify([journal,bag.level,bag.classId,quests.map(q=>canSpeakQuest(q,bag,position))]);if(host.dataset.state===key)return;host.dataset.state=key;
 const open=new Set(Array.from(host.querySelectorAll<HTMLDetailsElement>('details[open]')).map(d=>d.dataset.island));host.replaceChildren();
 const ready=quests.filter(q=>journal[q.id]&&!journal[q.id].claimed&&questComplete(q,journal[q.id])).length,active=Object.values(journal).filter(p=>!p.claimed).length;
 document.querySelector('#quest-summary')!.textContent=`Quests · ${active} active${ready?` · ${ready} ready`:''}`;
 document.querySelector('#story-prologue')!.textContent=storyPrologue;document.querySelector('#story-rank')!.textContent=storyRank({quests:journal,classId:bag.classId});
 const keepsakes=document.querySelector('#story-keepsakes')!;keepsakes.replaceChildren();for(const id of storyKeepsakes(journal,bag.classId)){const item=storyItems[id],card=document.createElement('article');card.className='story-keepsake';const title=document.createElement('strong'),description=document.createElement('p');title.textContent=item.name;description.textContent=item.description;card.append(itemSprite(id,item.name),title,description);keepsakes.append(card);}if(!keepsakes.children.length)keepsakes.textContent='Your journey keepsakes will appear here. Speak with Rowan to begin.';
 for(const island of [...new Set(quests.map(q=>q.island))]){
  const list=quests.filter(q=>q.island===island),section=document.createElement('details'),summary=document.createElement('summary');section.dataset.island=island;section.open=open.has(island);summary.textContent=`${regions[island as keyof typeof regions]?.name??island}${island==='elderwood'?' · Prologue':' · 2 main / 3 side'}${list[0].playable?'':' · Planned'}`;section.append(summary);
  for(const q of list)section.append(questCard(q,bag,position,action));host.append(section);
 }
}
