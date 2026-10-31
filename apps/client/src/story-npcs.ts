import Phaser from 'phaser';
import {renderTasks} from './task-ui';
import {npcQuestMarker,tasksUnlocked,type JourneyProfile} from '@realm/game-data';
import {storyNpcs,storyNpc,quests,questContact,atStoryNpc,storyPrologue,classPath,storyRank,type StoryNpc} from '@realm/game-data';
import {SkinAvatar,skinAssets} from './skin-avatar';
import {questCard,type QuestBag,type QuestLocation,type QuestAction} from './quest-ui';
export function drawStoryNpcs(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 for(const npc of storyNpcs.filter(n=>n.region===region)){
  const avatar=new SkinAvatar(scene);avatar.pose({skin:npc.skin,wings:'none',aura:'none'},'down',false,0);
  const shadow=scene.add.ellipse(0,0,28,11,0x102823,.3),label=scene.add.text(0,-91,`${npc.name}\n${npc.role}`,{fontSize:'10px',align:'center',color:'#f1dfaa',backgroundColor:'#203b36'}).setOrigin(.5);
  const marker=scene.add.text(0,-126,'',{fontSize:'22px',fontStyle:'bold',color:'#f7d46a',stroke:'#173831',strokeThickness:4}).setOrigin(.5).setData('questMarkerFor',npc.id);
  const hit=scene.add.zone(0,-35,64,88).setInteractive({useHandCursor:true}).setData('storyNpcHit',npc.id);hit.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(npc.id)});
  scene.add.container(npc.x*64,npc.y*64,[shadow,avatar,label,marker,hit]).setDepth(npc.y*64+1).setData('storyNpc',npc.id).setData('storyHit',hit);
 }
}
export class StoryDialog{
 dialog:HTMLDialogElement;active?:StoryNpc;private signature='';private body:HTMLElement;
 constructor(private bag:()=>QuestBag|undefined,private position:()=>QuestLocation,private action:QuestAction,private chooseClass:()=>void){
  this.dialog=document.createElement('dialog');this.dialog.id='story-dialog';this.dialog.setAttribute('aria-labelledby','story-title');
  const header=document.createElement('div');header.className='portal-heading';const title=document.createElement('h2');title.id='story-title';const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close story conversation');close.onclick=()=>this.dialog.close();header.append(title,close);this.body=document.createElement('section');this.dialog.append(header,this.body);this.dialog.addEventListener('close',()=>{this.active=undefined;this.signature='';this.body.replaceChildren();});document.body.append(this.dialog);
 }
 open(id:string){const npc=storyNpc(id);if(!npc||!atStoryNpc(this.position(),id))return;this.active=npc;this.signature='';document.querySelector('#story-title')!.textContent=npc.name;this.render();if(!this.dialog.open)this.dialog.showModal();this.action({kind:'quest-talk',item:id});}
 render(){const bag=this.bag(),npc=this.active;if(!bag||!npc)return;const position=this.position();if(!atStoryNpc(position,npc.id)){if(this.dialog.open)this.dialog.close();return;}
  const signature=JSON.stringify([npc.id,bag.quests,bag.level,bag.classId,bag.tasks]);if(signature===this.signature)return;this.signature=signature;this.body.replaceChildren();
  const intro=document.createElement('div');intro.className='story-person';const portrait=document.createElement('div');portrait.className='story-portrait';const image=document.createElement('img');image.src=skinAssets.find(a=>a.key===`skin-${npc.skin}`)!.url;image.alt=npc.name;portrait.append(image);const role=document.createElement('p');role.textContent=npc.role;intro.append(portrait,role);this.body.append(intro);
  const greeting=document.createElement('p');greeting.className='story-dialogue';const path=classPath(bag.classId);greeting.textContent=npc.id==='orin'&&tasksUnlocked({...bag,quests:bag.quests??{}})?'Your woodland trial has opened the Caverns expedition. You can now earn extra EXP and gold through repeatable monster tasks: choose a monster, choose a hunt size, then return to me or Mara for your reward. The story remains here whenever you are ready.':npc.id==='nerin'&&bag.quests?.['woods-main-1']?.claimed&&!bag.quests?.['elderwood-main-2']?.claimed?'You have proved your training on these trails. Return to Rowan, choose your class at level 5, and earn your mentor’s insignia before facing the Forest Bear.':npc.id==='rowan'&&bag.level>=5&&bag.classId==='citizen'?'You have earned the right to choose your own discipline. Knight, Archer, Mage or Rogue: which class will you master?':path?.mentor===npc.id?path.lesson:npc.greeting;const bio=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent='About this person';text.textContent=npc.biography;bio.append(summary,text);this.body.append(greeting,bio);
  if(npc.id==='rowan'){const prologue=document.createElement('p');prologue.textContent=storyPrologue;this.body.append(prologue);}
  const rank=document.createElement('p');rank.className='story-rank';rank.textContent=storyRank({quests:bag.quests??{},classId:bag.classId});this.body.append(rank);
  if(bag.classId==='citizen'&&(npc.id==='rowan'||['aldren','lyra','selene','corvin'].includes(npc.id))){const button=document.createElement('button');button.type='button';button.textContent=bag.level>=5?'Choose your class':'Class choice unlocks at level 5';button.disabled=bag.level<5;button.onclick=()=>{this.dialog.close();this.chooseClass();};this.body.append(button);}
  if(npc.id==='orin'){const tasks=document.createElement('section');tasks.className='npc-tasks';renderTasks(tasks,bag,position,this.action);this.body.append(tasks);}
  const list=quests.filter(q=>questContact(q,bag.classId).id===npc.id),future=document.createElement('details'),futureTitle=document.createElement('summary');futureTitle.textContent='Future chapters';future.append(futureTitle);
  for(const q of list)(q.playable?this.body:future).append(questCard(q,bag,position,this.action));if(future.children.length>1)this.body.append(future);
  if(!list.some(q=>q.playable)){const p=document.createElement('p');p.textContent=path?.mentor===npc.id?`${path.vow} Return after completing Rowan\'s prologue to receive your path insignia.`:'Mara keeps the expedition journal. Return as your journey reaches this contact\'s chapter.';this.body.append(p);}
 }
}

export function updateStoryMarkers(objects:Phaser.GameObjects.GameObject[],profile:JourneyProfile){for(const object of objects){const container=object as Phaser.GameObjects.Container;if(!object.getData('storyNpc'))continue;for(const child of container.list){const id=child.getData('questMarkerFor');if(!id)continue;const text=child as Phaser.GameObjects.Text,mark=npcQuestMarker(id,profile);text.setVisible(!!mark);if(mark&&text.text!==mark.text)text.setText(mark.text);if(mark&&text.style.color!==mark.color)text.setColor(mark.color);}}}
