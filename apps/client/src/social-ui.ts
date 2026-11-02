import type {Room} from 'colyseus.js';
import {regions} from '@realm/game-data';
import {chatChannels,type ChatChannel,type SocialState,type ChatMessage} from '@realm/shared';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export class SocialUI{
 private room?:Room;private state?:SocialState;private messages:ChatMessage[]=[];private channel:ChatChannel='world';private connected=false;private signature='';private wasActive=false;
 private serial=0;private error='';private pending?:{channel:ChatChannel;text:string;at:number};private drafts=new Map<ChatChannel,string>();private unread=new Set<ChatChannel>();
 private dialog=el<HTMLDialogElement>('party-dialog');
 constructor(private stop:()=>void){
  for(const [channel,name]of Object.entries(chatChannels)){
   const button=document.createElement('button');button.id=`social-${channel}-tab`;button.type='button';button.setAttribute('role','tab');button.textContent=name;
   button.onclick=()=>{this.drafts.set(this.channel,el<HTMLInputElement>('chat-input').value);this.channel=channel as ChatChannel;this.unread.delete(this.channel);this.error='';el<HTMLInputElement>('chat-input').value=this.drafts.get(this.channel)??'';this.renderTabs();this.renderChat(true);};el('chat-tabs').append(button);
  }
  el('social-open').onclick=()=>{stop();this.dialog.showModal();};el('social-close').onclick=()=>this.dialog.close();
  const form=el<HTMLFormElement>('chat-form');for(const type of ['keydown','keyup'])form.addEventListener(type,e=>e.stopPropagation());
  const alignKeyboard=()=>{const viewport=window.visualViewport,inset=viewport?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;if(this.typing()&&inset>80)document.documentElement.style.setProperty('--chat-bottom',`${inset+8}px`);else document.documentElement.style.removeProperty('--chat-bottom');};
  el('chat-input').addEventListener('focus',()=>{stop();alignKeyboard();});el('chat-input').addEventListener('blur',alignKeyboard);window.visualViewport?.addEventListener('resize',alignKeyboard);window.visualViewport?.addEventListener('scroll',alignKeyboard);
  form.onsubmit=e=>{e.preventDefault();const input=el<HTMLInputElement>('chat-input');if(this.canSend()&&input.value.trim()&&!this.pending){this.error='';this.pending={channel:this.channel,text:input.value,at:Date.now()};this.room?.send('chat',{channel:this.channel,text:input.value});}};
  el('party-leave').onclick=()=>this.action({kind:'leave'});this.renderTabs();
 }
 typing(){return document.activeElement===el('chat-input')&&!el<HTMLInputElement>('chat-input').readOnly;}
 reset(){
  el('chat-panel').hidden=true;el('social-controls').hidden=true;if(this.dialog.open)this.dialog.close();this.room=undefined;this.state=undefined;this.messages=[];this.signature='';this.error='';this.pending=undefined;this.drafts.clear();this.unread.clear();this.channel='world';this.renderTabs();el<HTMLInputElement>('chat-input').value='';
  for(const id of ['party-members','party-invites','party-online'])el(id).replaceChildren();el('party-status').textContent='Connect to multiplayer to form a party.';el('party-leave').hidden=true;el('social-feedback').textContent='';this.badge();this.renderChat();
 }
 bind(room:Room){
  this.reset();this.room=room;this.channel='world';this.renderTabs();
  room.onMessage('social-state',(state:SocialState)=>{if(this.room!==room)return;const previous=this.state?.party?.id;this.state=state;if(previous!==state.party?.id){this.messages=this.messages.filter(m=>m.channel!=='party');this.drafts.delete('party');if(this.channel==='party')el<HTMLInputElement>('chat-input').value='';this.renderChat();}this.renderParty();this.badge();});
  room.onMessage('chat-history',(messages:ChatMessage[])=>{if(this.room!==room)return;for(const message of messages)this.store(message);this.renderChat(true);});
  room.onMessage('chat-message',(message:ChatMessage)=>{
   if(this.room!==room)return;this.store(message);if(this.channel!==message.channel)this.unread.add(message.channel);
   if(message.sender===room.sessionId&&this.pending?.channel===message.channel){const input=el<HTMLInputElement>('chat-input');if(this.channel===message.channel&&input.value===this.pending.text)input.value='';this.drafts.delete(message.channel);this.pending=undefined;this.error='';}
   this.renderTabs();this.renderChat();
  });
  room.onMessage('chat-error',(message:string)=>{if(this.room!==room)return;this.pending=undefined;this.error=message;this.log(message);});
  room.onMessage('social-result',(message:string)=>{if(this.room!==room)return;el('social-feedback').textContent=message;this.log(message);});
  room.onMessage('server-log',(message:string)=>{if(this.room===room)this.log(message);});
  for(const type of ['economy-result','combat-error','travel-error','service-result','house-result','save-error'])room.onMessage(type,(message:string)=>{if(this.room===room&&typeof message==='string')this.log(message);});
  room.onMessage('travel-complete',(data:{region:keyof typeof regions})=>{if(this.room===room)this.log(`Arrived in ${regions[data.region]?.name??data.region}.`);});
  let previous:{xp:number;gold:number}|undefined;
  room.onMessage('economy-state',(data:{xp:number;gold:number})=>{if(this.room!==room)return;if(previous){const xp=data.xp-previous.xp,gold=data.gold-previous.gold;if(xp>0||gold>0)this.log([xp>0?`Gained ${xp} EXP`:'',gold>0?`Received ${gold} gold`:''].filter(Boolean).join(' · '));}previous={xp:data.xp,gold:data.gold};});
  room.send('social-sync');
 }
 log(text:string){this.store({id:--this.serial,channel:'server',sender:'server',name:'Server',text,at:Date.now()});if(this.channel!=='server')this.unread.add('server');this.renderTabs();if(this.channel==='server')this.renderChat();}
 private canSend(){return this.connected&&this.channel!=='server'&&(this.channel!=='party'||!!this.state?.party);}
 update(active:boolean,connected:boolean){
  if(!active&&this.wasActive)this.reset();this.wasActive=active;el('chat-panel').hidden=!active;el('social-controls').hidden=!active;this.connected=connected;if(!active&&this.dialog.open)this.dialog.close();
  if(this.pending&&Date.now()-this.pending.at>8000){this.pending=undefined;this.error='Message not confirmed. Your draft is kept.';}
  const input=el<HTMLInputElement>('chat-input');input.disabled=false;input.readOnly=this.channel==='server';el<HTMLButtonElement>('chat-send').disabled=!this.canSend()||!!this.pending;
  el('chat-status').textContent=this.error||(this.channel==='server'?'Server Log · Read-only':!connected?'Offline · You can type a draft. Connect to multiplayer to send.':this.channel==='party'&&!this.state?.party?'Join a party to send party messages.':this.pending?'Sending…':`${chatChannels[this.channel]} · Enter to send`);
 }
 private store(message:ChatMessage){if(this.messages.some(m=>m.id===message.id))return;this.messages.push(message);const same=this.messages.filter(m=>m.channel===message.channel);if(same.length>100)this.messages=this.messages.filter(m=>m!==same[0]);}
 private badge(){const count=this.state?.invites.length??0;el('social-badge').textContent=count?String(count):'';el('social-badge').hidden=!count;}
 private renderTabs(){
  for(const channel of Object.keys(chatChannels) as ChatChannel[]){el(`social-${channel}-tab`).setAttribute('aria-selected',String(this.channel===channel));el(`social-${channel}-tab`).dataset.unread=String(this.unread.has(channel));}
  el<HTMLInputElement>('chat-input').readOnly=this.channel==='server';el<HTMLButtonElement>('chat-send').disabled=!this.canSend()||!!this.pending;
  el<HTMLInputElement>('chat-input').placeholder=this.channel==='server'?'Server Log is read-only':`Message ${chatChannels[this.channel]}…`;el('chat-messages').setAttribute('aria-label',`${chatChannels[this.channel]} messages`);
 }
 private renderChat(forceBottom=false){
  const list=el('chat-messages'),bottom=forceBottom||list.scrollHeight-list.scrollTop-list.clientHeight<35,top=list.scrollTop;list.replaceChildren();
  for(const message of this.messages.filter(m=>m.channel===this.channel).sort((a,b)=>a.at-b.at)){
   const row=document.createElement('p');row.className='chat-line';row.dataset.sender=message.sender;const time=document.createElement('time');time.dateTime=new Date(message.at).toISOString();time.textContent=new Date(message.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});const name=document.createElement('strong');name.textContent=message.name+': ';const text=document.createElement('span');text.textContent=message.text;row.append(time,name,text);list.append(row);
  }
  if(!list.children.length){const p=document.createElement('p');p.className='chat-empty';p.textContent=this.channel==='server'?'Server activity and rewards appear here.':`No ${chatChannels[this.channel]} messages yet.`;list.append(p);}list.scrollTop=bottom?list.scrollHeight:top;
 }
 private action(request:object){if(this.connected)this.room?.send('party',request);}
 private renderParty(){
  const state=this.state;if(!state)return;const key=JSON.stringify(state);if(key===this.signature)return;this.signature=key;
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
