import {quests,questById,questComplete,questContact,type QuestJournal,type QuestDefinition} from './quests';
import {storyNpc,type StoryNpc} from './story-characters';
import {tasksUnlocked,type TaskState} from './tasks';
import {monsters} from './monsters';
import type {ClassId} from './classes';
export interface JourneyProfile{quests:QuestJournal;level:number;classId:ClassId;tasks?:TaskState}
export interface JourneyStep{title:string;detail:string;contact?:StoryNpc;island?:string;quest?:string}
export function questAvailable(q:QuestDefinition,p:JourneyProfile){return q.playable&&q.level<=p.level&&(!q.requires||!!p.quests[q.requires]?.claimed)&&(!q.storyRequires||q.storyRequires.every(id=>p.quests[id]?.claimed))&&(!q.classRequired||p.classId!=='citizen')}
export function questStep(q:QuestDefinition,p:JourneyProfile):JourneyStep{
 const progress=p.quests[q.id],npc=questContact(q,p.classId);if(!progress)return{title:q.name,detail:`Speak with ${npc.name} to begin.`,contact:npc,quest:q.id};
 if(questComplete(q,progress))return{title:q.name,detail:`Reward ready · Return to ${npc.name}.`,contact:npc,quest:q.id};
 if(q.id==='elderwood-main-2'&&p.classId==='citizen')return{title:'Choose your class',detail:'Level 5 reached · Meet Rowan and choose Knight, Archer, Mage or Rogue.',contact:storyNpc('rowan'),quest:q.id};
 const remaining=q.objectives.map((o,i)=>({o,i})).filter(({o,i})=>progress.progress[i]<o.count);const detail=remaining.map(({o,i})=>`${o.label} · ${progress.progress[i]}/${o.count}`).join(' · '),talk=remaining.find(({o})=>o.event==='talk');return{title:q.name,detail:detail+(q.id==='elderwood-main-2'?' · Equip your class weapon and practice on woodland monsters.':''),quest:q.id,...(talk?{contact:npc}:{island:q.island==='elderwood'?undefined:q.island})};
}
export function journeyStep(p:JourneyProfile,pinned?:string):JourneyStep{
 const selected=questById(pinned);if(selected&&!p.quests[selected.id]?.claimed&&(p.quests[selected.id]||questAvailable(selected,p)))return questStep(selected,p);
 for(const id of ['elderwood-main-1','woods-main-1','elderwood-main-2','woods-main-2']){const q=questById(id)!;if(!p.quests[id]?.claimed&&(p.quests[id]||questAvailable(q,p)))return questStep(q,p)}
 if(tasksUnlocked(p)&&p.tasks?.active){const t=p.tasks.active;return{title:`Task · ${monsters[t.monster].name}`,detail:t.progress>=t.goal?'Reward ready · Return to Orin or Mara.':`Defeat ${monsters[t.monster].name} · ${t.progress}/${t.goal}`,...(t.progress>=t.goal?{contact:storyNpc('orin')}:{island:['wolf','spider','boar','bear'].includes(t.monster)?'woods':'caverns'})};}
 const next=quests.find(q=>q.type==='main'&&!p.quests[q.id]?.claimed&&(p.quests[q.id]||questAvailable(q,p)));if(next)return questStep(next,p);
 if(tasksUnlocked(p))return{title:'Choose a monster task',detail:'Orin offers repeatable hunts for bonus EXP and gold. Choose your monster and hunt size.',contact:storyNpc('orin')};
 return{title:'Prepare for Crystal Caverns',detail:'Choose your class, finish The Woodland Trial and reach level 11 to unlock Orin’s monster tasks.',island:'woods'};
}
export function npcQuestMarker(id:string,p:JourneyProfile):{text:string;color:string}|undefined{
 const relevant=quests.filter(q=>questContact(q,p.classId).id===id&&q.playable),ready=relevant.some(q=>p.quests[q.id]&&!p.quests[q.id].claimed&&questComplete(q,p.quests[q.id]));if(ready)return{text:'?',color:'#f7d46a'};
 if(id==='orin'&&tasksUnlocked(p)&&p.tasks?.active&&p.tasks.active.progress>=p.tasks.active.goal)return{text:'?',color:'#90ded5'};
 if(relevant.some(q=>!p.quests[q.id]&&questAvailable(q,p)))return{text:'!',color:'#f7d46a'};
 if((id==='orin')&&tasksUnlocked(p))return{text:p.tasks?.active&&p.tasks.active.progress>=p.tasks.active.goal?'?':'◆',color:'#90ded5'};
 if(relevant.some(q=>p.quests[q.id]&&!p.quests[q.id].claimed))return{text:'…',color:'#c1c7b8'};
}
