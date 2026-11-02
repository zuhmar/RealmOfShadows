import type {Room} from 'colyseus.js';
import {regions} from '@realm/game-data';
import type {SocialState,ChatMessage} from '@realm/shared';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export class SocialUI{
 private room?:Room;private state?:SocialState;private messages:ChatMessage[]=[];private channel:'world'|'party'='world';private unread=0;private connected=false;private signature='';private wasActive=false;
 private dialog=el<HTMLDialogElement>('social-dialog');
 constructor(private stop:()=>void){
  el('social-open').onclick=()=>{stop();this.dialog.showModal();this.unread=0;this.badge();this.renderChat(true);};
  el('social-close').onclick=()=>this.dialog.close();
  for(const channel of ['world','party'] as const)el(`social-${channel}-tab`).onclick=()=>{this.channel=channel;this.unread=0;this.badge();this.renderTabs();this.renderChat(true);};
  el<HTMLFormElement>('chat-form').onsubmit=e=>{e.preventDefault();const input=el<HTMLInputElement>('chat-input');if(this.connected&&input.value.trim()){this.room?.send('chat',{channel:this.channel,text:input.value});input.value='';}};
  el('party-leave').onclick=()=>this.action({kind:'leave'});this.renderTabs();
 }
 reset(){el('social-controls').hidden=true;if(this.dialog.open)this.dialog.close();this.room=undefined;this.state=undefined;this.messages=[];this.unread=0;this.signature='';for(const id of ['party-members','party-invites','party-online'])el(id).replaceChildren();el('party-status').textContent='Connect to multiplayer to form a party.';el('party-leave').hidden=true;el('social-feedback').textContent='';el('social-party-tab').textContent='Party';this.badge();this.renderChat();}
 bind(room:Room){
  this.reset();this.room=room;this.state=undefined;this.messages=[];this.unread=0;this.signature='';this.channel='world';this.renderTabs();
  room.onMessage('social-state',(state:SocialState)=>{if(this.room!==room)return;const previous=this.state?.party?.id;this.state=state;if(previous!==state.party?.id){this.messages=this.messages.filter(m=>m.channel!=='party');this.renderChat();}this.renderParty();this.badge();});
  room.onMessage('chat-history',(messages:ChatMessage[])=>{if(this.room!==room)return;for(const message of messages)this.store(message);this.renderChat(true);});
  room.onMessage('chat-message',(message:ChatMessage)=>{if(this.room!==room)return;this.store(message);if(!this.dialog.open||this.channel!==message.channel)this.unread=Math.min(99,this.unread+1);this.badge();if(this.dialog.open)this.renderChat();});
  room.onMessage('social-result',(message:string)=>{if(this.room===room)el('social-feedback').textContent=message;});
  room.send('social-sync');
 }
 update(active:boolean,connected:boolean){
  if(!active&&this.wasActive)this.reset();this.wasActive=active;el('social-controls').hidden=!active;this.connected=connected;
  if(!active&&this.dialog.open)this.dialog.close();
  const input=el<HTMLInputElement>('chat-input');input.disabled=!connected;el<HTMLButtonElement>('chat-send').disabled=!connected||(this.channel==='party'&&!this.state?.party);
  el('social-connection').textContent=connected?'World chat reaches every island. Party chat is private.':'Connect to multiplayer to chat and form a party. Local preview is solo.';
 }
 private store(message:ChatMessage){if(this.messages.some(m=>m.id===message.id))return;this.messages.push(message);this.messages.sort((a,b)=>a.id-b.id);if(this.messages.length>160)this.messages.splice(0,this.messages.length-160);}
 private badge(){const count=this.unread+(this.state?.invites.length??0);el('social-badge').textContent=count?String(Math.min(99,count)):'';el('social-badge').hidden=!count;}
 private renderTabs(){
  for(const channel of ['world','party'] as const)el(`social-${channel}-tab`).setAttribute('aria-selected',String(this.channel===channel));
  el('party-controls').hidden=this.channel!=='party';el<HTMLInputElement>('chat-input').placeholder=this.channel==='world'?'Message the world…':'Message your party…';
  el('chat-messages').setAttribute('aria-label',`${this.channel==='world'?'World':'Party'} messages`);
 }
 private renderChat(forceBottom=false){
  const list=el('chat-messages'),bottom=forceBottom||list.scrollHeight-list.scrollTop-list.clientHeight<35,top=list.scrollTop;list.replaceChildren();
  for(const message of this.messages.filter(m=>m.channel===this.channel)){
   const row=document.createElement('p');row.className='chat-line';row.dataset.sender=message.sender;
   const time=document.createElement('time');time.dateTime=new Date(message.at).toISOString();time.textContent=new Date(message.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
   const name=document.createElement('strong');name.textContent=message.name+': ';const text=document.createElement('span');text.textContent=message.text;row.append(time,name,text);list.append(row);
  }
  if(!list.children.length){const p=document.createElement('p');p.className='chat-empty';p.textContent=this.channel==='world'?'Say hello to the world.':'Join a party and plan your hunt here.';list.append(p);}
  list.scrollTop=bottom?list.scrollHeight:top;
 }
 private action(request:object){if(this.connected)this.room?.send('party',request);}
 private renderParty(){
  const state=this.state;if(!state)return;const key=JSON.stringify(state);if(key===this.signature)return;this.signature=key;
  el('social-party-tab').textContent=state.invites.length?`Party · ${state.invites.length} invite${state.invites.length===1?'':'s'}`:'Party';
  const name=(id:string)=>state.players.find(p=>p.id===id)?.name??'Adventurer',party=state.party;
  el('party-status').textContent=party?`${party.members.length}/4 members · Leader: ${name(party.leader)}`:'No party yet. Invite an online player to start one.';
  el('party-leave').hidden=!party;
  const invites=el('party-invites');invites.replaceChildren();
  for(const invite of state.invites){const row=document.createElement('div');row.className='party-row';const text=document.createElement('span');text.textContent=`${name(invite.leader)} invited you`;row.append(text);for(const kind of ['accept','decline']){const button=document.createElement('button');button.type='button';button.textContent=kind==='accept'?'Accept':'Decline';button.dataset.partyAction=kind;button.onclick=()=>this.action({kind,partyId:invite.partyId});row.append(button);}invites.append(row);}
  const members=el('party-members');members.replaceChildren();
  for(const id of party?.members??[]){const p=state.players.find(p=>p.id===id);if(!p)continue;const row=document.createElement('div');row.className='party-row';const label=document.createElement('span');label.textContent=`${p.name}${id===state.self?' (you)':''}${id===party!.leader?' · Leader':''} · Lv ${p.level} · ${regions[p.region].name} · ${Math.ceil(p.hp)} HP`;row.append(label);if(party!.leader===state.self&&id!==state.self){const kick=document.createElement('button');kick.type='button';kick.textContent='Remove';kick.onclick=()=>this.action({kind:'kick',target:id});row.append(kick);}members.append(row);}
  const players=el('party-online');players.replaceChildren();
  for(const p of state.players.filter(p=>p.id!==state.self)){
   const row=document.createElement('div');row.className='party-row';const label=document.createElement('span');label.textContent=`${p.name} · Lv ${p.level} · ${regions[p.region].name}`;const invite=document.createElement('button');invite.type='button';invite.textContent=party?.members.includes(p.id)?'In party':'Invite';invite.dataset.invitePlayer=p.id;invite.disabled=!!party&&(party.leader!==state.self||party.members.includes(p.id)||party.members.length>=4);invite.onclick=()=>this.action({kind:'invite',target:p.id});row.append(label,invite);players.append(row);
  }
  if(!players.children.length)players.textContent='No other players in this hunting world yet.';
 }
}
