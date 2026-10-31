import {monsters,type MonsterKind} from './monsters';
import type {ClassId} from './classes';
import type {QuestJournal} from './quests';
export interface HuntTask{id:string;monster:MonsterKind;goal:number;progress:number}
export interface TaskState{active:HuntTask|null;completed:number}
export interface TaskProfile{level:number;classId:ClassId;quests:QuestJournal}
export const emptyTasks=():TaskState=>({active:null,completed:0});
// The same milestone opens the Caverns story and repeatable hunting work.
export const tasksUnlocked=(p:TaskProfile)=>p.level>=11&&p.classId!=='citizen'&&!!p.quests['woods-main-2']?.claimed;
export const taskGoals=(kind:MonsterKind):readonly number[]=>monsters[kind].boss?[1,3,5]:[10,25,50];
export function taskChoice(value:unknown):{monster:MonsterKind;goal:number}|undefined{
 if(typeof value!=='string')return;const [monster,count,...rest]=value.split(':');if(rest.length||!Object.hasOwn(monsters,monster))return;const kind=monster as MonsterKind,goal=Number(count);if(String(goal)!==count||!taskGoals(kind).includes(goal))return;return{monster:kind,goal};
}
export function taskReward(monster:MonsterKind,goal:number){const m=monsters[monster];return{xp:Math.round(m.xp*goal*.3),gold:Math.round(m.gold*goal*.5)}}
export function recordTaskKill(tasks:TaskState,kind:MonsterKind,island:string){const t=tasks.active;if(t&&t.monster===kind&&island===(['wolf','spider','boar','bear'].includes(kind)?'woods':'caverns'))t.progress=Math.min(t.goal,t.progress+1);}
export function validTasks(value:unknown):value is TaskState{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const t=value as TaskState;if(Object.keys(t).sort().join(',')!=='active,completed'||!Number.isSafeInteger(t.completed)||t.completed<0||t.completed>Number.MAX_SAFE_INTEGER)return false;if(t.active===null)return true;
 const a=t.active;if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).sort().join(',')!=='goal,id,monster,progress'||typeof a.id!=='string'||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).test(a.id))return false;return !!taskChoice(`${a.monster}:${a.goal}`)&&Number.isSafeInteger(a.progress)&&a.progress>=0&&a.progress<=a.goal;
}
