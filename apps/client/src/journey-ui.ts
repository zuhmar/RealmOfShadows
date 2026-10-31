import {isLowerFloor,isRaisedFloor,isHousingFloor,journeyStep,questAvailable,quests,regions,type JourneyStep,type RegionId} from '@realm/game-data';
import {updateStoryMarkers} from './story-npcs';
import {renderTasks} from './task-ui';
import type {QuestBag,QuestLocation,QuestAction} from './quest-ui';
import type Phaser from 'phaser';
export class JourneyUI{
 private pinned='';private signature='';private step?:JourneyStep;
 constructor(private navigate:(step:JourneyStep)=>void,private journal:()=>void){
  document.querySelector('#journey-journal')!.addEventListener('click',journal);document.querySelector('#journey-go')!.addEventListener('click',()=>{if(this.step)this.navigate(this.step)});
  document.querySelector<HTMLSelectElement>('#tracked-quest')!.onchange=e=>{this.pinned=(e.target as HTMLSelectElement).value;this.signature='';};
 }
 render(bag:QuestBag,position:QuestLocation,objects:Phaser.GameObjects.GameObject[],action:QuestAction){
  const profile={...bag,quests:bag.quests??{}},step=journeyStep(profile,this.pinned),key=JSON.stringify([bag.quests,bag.tasks,bag.level,bag.classId,position.region,this.pinned,objects.length]);renderTasks(document.querySelector('#task-list')!,bag,position,action);if(key===this.signature)return;this.signature=key;this.step=step;
  document.querySelector<HTMLElement>('#journey-tracker')!.hidden=false;document.querySelector('#journey-title')!.textContent=step.title;document.querySelector('#journey-detail')!.textContent=step.detail;
  const dest=step.contact?.region??step.island,name=dest?regions[dest as RegionId]?.name??dest:undefined,where=document.querySelector('#journey-destination')!;where.textContent=step.contact?`${step.contact.name} · ${name} · (${Math.floor(step.contact.x)}, ${Math.floor(step.contact.y)})`:name?`Hunt in ${name} · Upper and lower floors count.`:'Check your journal for this objective.';
  const go=document.querySelector<HTMLButtonElement>('#journey-go')!;go.hidden=!dest;const floor=isLowerFloor(position.region)||isRaisedFloor(position.region)||isHousingFloor(position.region);go.textContent=step.contact&&step.contact.region===position.region?'Find contact':dest!==position.region?floor?'Use stairs to return':'Go to portal':'Explore this island';go.disabled=(!step.contact&&dest===position.region)||(floor&&dest!==position.region);
  const select=document.querySelector<HTMLSelectElement>('#tracked-quest')!;select.replaceChildren();const automatic=document.createElement('option');automatic.value='';automatic.textContent='Follow story / active task automatically';select.append(automatic);for(const q of quests.filter(q=>!profile.quests[q.id]?.claimed&&(profile.quests[q.id]||questAvailable(q,profile)))){const option=document.createElement('option');option.value=q.id;option.textContent=q.name;select.append(option)}select.value=this.pinned;if(select.value!==this.pinned){this.pinned='';select.value='';this.signature='';}updateStoryMarkers(objects,profile);
 }
}
