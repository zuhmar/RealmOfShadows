import {isPublicChatChannel,type ChatMessage} from '@realm/shared';
/** Shared by all island rooms on this world server; party delivery stays private. */
export class WorldChat{
 private listeners=new Map<string,{name:string;send:(message:ChatMessage)=>void}>();
 private budget=new Map<string,{tokens:number;at:number}>();private messages:ChatMessage[]=[];private serial=0;
 connect(id:string,name:string,send:(message:ChatMessage)=>void){this.listeners.set(id,{name,send});}
 disconnect(id:string){this.listeners.delete(id);this.budget.delete(id);}
 history(){return this.messages.map(m=>({...m}));}
 send(id:string,request:unknown,party?:readonly string[],now=Date.now()):string|undefined{
  const sender=this.listeners.get(id);if(!sender||!request||typeof request!=='object')return 'Chat unavailable.';
  const {text,channel}=request as {text?:unknown;channel?:unknown};
  if(!isPublicChatChannel(channel)&&channel!=='party')return 'Choose a public channel or Party. Server Log is read-only.';
  if(channel==='party'&&!party?.includes(id))return 'Join a party to use party chat.';
  if(typeof text!=='string'||text.length>240)return 'Messages can contain up to 240 characters.';
  const clean=text.replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim();if(!clean)return 'Type a message first.';
  const budget=this.budget.get(id)??{tokens:3,at:now};budget.tokens=Math.min(3,budget.tokens+Math.max(0,now-budget.at)/1500);budget.at=now;this.budget.set(id,budget);
  if(budget.tokens<1)return 'Please wait a moment before sending another message.';budget.tokens--;
  const message:ChatMessage={id:++this.serial,channel,sender:id,name:sender.name,text:clean,at:now};
  if(isPublicChatChannel(channel)){this.messages.push(message);const same=this.messages.filter(m=>m.channel===channel);if(same.length>80)this.messages.splice(this.messages.findIndex(m=>m.id===same[0].id),1);for(const listener of this.listeners.values())listener.send(message);}
  else for(const member of party!)this.listeners.get(member)?.send(message);
 }
}
export const worldChat=new WorldChat();
