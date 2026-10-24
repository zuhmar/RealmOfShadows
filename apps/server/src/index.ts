import {createServer} from 'node:http';
import {progressStore,SaveSession,type Identity} from './persistence';
import {writeProgress} from '../../../packages/shared/src/saves';
import {Server,Room,Client} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {Schema,MapSchema,defineTypes} from '@colyseus/schema';
import {WORLD,PORTAL,equipmentArmor,canTravel,type RegionId,type WeaponId} from '@realm/game-data';
import {move,CombatSimulation,Economy,type Input,type Fighter} from '@realm/shared';
class Player extends Schema {armor=0;weapon:WeaponId='wand';meleeXp=0;distanceXp=0;magicXp=0;x=WORLD.spawn.x;y=WORLD.spawn.y;stamina=100;seq=0;region:RegionId='elderwood';hp=100;mana=100;deadUntil=0;shotAt=0;spellAt=0;target='';auto=false;}
defineTypes(Player,{armor:'number',weapon:'string',meleeXp:'number',distanceXp:'number',magicXp:'number',x:'number',y:'number',stamina:'number',seq:'number',region:'string',hp:'number',mana:'number',deadUntil:'number',shotAt:'number',spellAt:'number',target:'string',auto:'boolean'});
class WolfState extends Schema{x=0;y=0;hp=65;mode='idle';facing='down';}
defineTypes(WolfState,{x:'number',y:'number',hp:'number',mode:'string',facing:'string'});
class State extends Schema {players=new MapSchema<Player>();wolves=new MapSchema<WolfState>();}
defineTypes(State,{players:{map:Player},wolves:{map:WolfState}});
class Elderwood extends Room<State>{
 saves=new Map<string,SaveSession>();saving=new Set<string>();saveFailed=new Set<string>();
 economy=new Economy();economyReceived=new Map<string,{tokens:number;time:number}>();rewardTicks=0;combatReceived=new Map<string,number>();simulation=new CombatSimulation();maxClients=WORLD.capacity;inputs=new Map<string,Input>();received=new Map<string,number>();
 onCreate(){this.setState(new State());this.setPatchRate(50);
 this.onMessage('travel',(client:Client,destination:unknown)=>{
 const p=this.state.players.get(client.sessionId);
 if(this.saveFailed.has(client.sessionId)||!p||p.hp<=0||!canTravel(p,p.region,destination)){client.send('travel-error','Walk closer to the portal and choose another destination.');return;}
 this.inputs.delete(client.sessionId);p.seq=this.received.get(client.sessionId)??p.seq;
 this.simulation.clear(p);p.region=destination;p.x=PORTAL.arrival.x;p.y=PORTAL.arrival.y;
 client.send('travel-complete',{region:p.region,x:p.x,y:p.y,stamina:p.stamina,seq:p.seq});
 });
 this.onMessage('economy',(client:Client,request:unknown)=>{const now=this.simulation.time;const budget=this.economyReceived.get(client.sessionId)??{tokens:4,time:now};budget.tokens=Math.min(4,budget.tokens+(now-budget.time)*10);budget.time=now;this.economyReceived.set(client.sessionId,budget);if(budget.tokens<1)return;budget.tokens--; const p=this.state.players.get(client.sessionId);if(!p||this.saveFailed.has(client.sessionId))return;const message=this.economy.act(client.sessionId,p,request,now);client.send('economy-result',message);this.sendSnapshot(client);void this.savePlayer(client);});
 this.onMessage('combat',(client:Client,data:unknown)=>{if(this.saveFailed.has(client.sessionId)||!data||typeof data!=='object')return;const now=this.simulation.time;if(now-(this.combatReceived.get(client.sessionId)??-Infinity)<.1)return;this.combatReceived.set(client.sessionId,now);const p=this.state.players.get(client.sessionId);if(p){const {kind,target,spell}=data as {kind:unknown;target:unknown;spell:unknown};if(!(kind==='spell'?this.simulation.castSpell(client.sessionId,p,spell,target,this.economy.profiles.get(client.sessionId)):this.simulation.action(client.sessionId,p,kind,target)))client.send('combat-error','Attack unavailable: check your target, range, mana, cooldown, and portal sanctuary.');}});
 this.onMessage('input',(client:Client,data:unknown)=>{if(this.saveFailed.has(client.sessionId))return;const d=data as Input;if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||Math.abs(d.x)>1||Math.abs(d.y)>1||typeof d.sprint!=='boolean'||!Number.isSafeInteger(d.seq)||d.seq<0||d.seq<=(this.received.get(client.sessionId)??-1))return;this.received.set(client.sessionId,d.seq);this.inputs.set(client.sessionId,{x:d.x,y:d.y,sprint:d.sprint,seq:d.seq});});
 // One input is consumed per server tick; flooding cannot increase speed.
 this.setSimulationInterval(()=>{
 for(const [id,p] of this.state.players){const input=this.inputs.get(id)??{x:0,y:0,sprint:false,seq:p.seq};if(p.hp>0)Object.assign(p,move(p,input,1/20,p.region));p.seq=input.seq;this.inputs.delete(id);}
 this.simulation.tick(.05,this.state.players as Iterable<[string,Fighter]>);
 for(const [id,p] of this.state.players)this.economy.sync(id,p);
 this.economy.process(this.simulation.kills.splice(0),this.state.players,this.simulation.time);if(++this.rewardTicks%4===0)for(const client of this.clients)this.sendSnapshot(client);
 if(this.rewardTicks%100===0)for(const client of this.clients)void this.savePlayer(client);
 for(const [id,w] of this.simulation.wolves){if(!this.state.wolves.has(id))this.state.wolves.set(id,new WolfState());const state=this.state.wolves.get(id)!;state.x=w.x;state.y=w.y;state.hp=w.hp;state.mode=w.mode;state.facing=w.facing;}
 for(const event of this.simulation.events.splice(0))for(const client of this.clients)if(this.state.players.get(client.sessionId)?.region===event.region)client.send('combat-event',event);
 },50);
 }
 async onAuth(_client:Client,options:{accessToken?:unknown}){if(!options?.accessToken)return {guest:true};if(!progressStore)throw Error('Account saves are not configured on the game server.');return progressStore.verify(options.accessToken);}
 async onJoin(client:Client){
 this.economy.join(client.sessionId);const p=new Player();
 try{if(client.auth?.id){const save=new SaveSession(progressStore!,client.auth as Identity);const data=await save.claim(writeProgress(this.economy.profiles.get(client.sessionId)!,0));
 this.saves.set(client.sessionId,save);this.economy.profiles.set(client.sessionId,data.profile);this.economy.serial=Math.max(this.economy.serial,...data.profile.inventory.map(s=>s.id));
 p.armor=equipmentArmor(data.profile.equipment);p.weapon=data.profile.weapon;p.meleeXp=data.profile.skillXp.melee;p.distanceXp=data.profile.skillXp.distance;p.magicXp=data.profile.skillXp.magic;
 data.profile.potionReadyAt=this.simulation.time+data.potionRemaining;this.simulation.spellCooldowns.set(client.sessionId,Object.fromEntries(Object.entries(data.cooldowns).map(([id,remaining])=>[id,this.simulation.time+remaining!])));
 }
 this.state.players.set(client.sessionId,p);
 }catch(err){this.economy.leave(client.sessionId);throw err;}
 }
 sendSnapshot(client:Client){if(!this.economy.profiles.has(client.sessionId)||!this.state.players.has(client.sessionId))return;const save=this.saves.get(client.sessionId);client.send('economy-state',{...this.economy.snapshot(client.sessionId,this.simulation.time),account:save?{email:save.identity.email,savedAt:save.savedAt,state:this.saveFailed.has(client.sessionId)?'error':this.saving.has(client.sessionId)?'saving':'ready'}:null});}
 async savePlayer(client:Client){const id=client.sessionId,save=this.saves.get(id),profile=this.economy.profiles.get(id);if(!save||!profile||this.saving.has(id)||this.saveFailed.has(id))return;this.saving.add(id);
 try{await save.save(writeProgress(profile,this.simulation.time,this.simulation.spellCooldowns.get(id)));}
 catch{this.saveFailed.add(id);client.send('save-error','Saving failed. Reconnect before continuing; your last confirmed save is safe.');client.leave(4005);}
 finally{this.saving.delete(id);}
 }
 async onLeave(client:Client){const id=client.sessionId,save=this.saves.get(id),profile=this.economy.profiles.get(id);const final=save&&profile?writeProgress(profile,this.simulation.time,this.simulation.spellCooldowns.get(id)):undefined;
 this.state.players.delete(id);this.economy.leave(id);this.simulation.spellCooldowns.delete(id);this.economyReceived.delete(id);this.inputs.delete(id);this.received.delete(id);this.combatReceived.delete(id);this.saves.delete(id);this.saveFailed.delete(id);
 if(save&&final)try{await save.save(final,true);}catch{console.error('Final character save failed; database session will expire.');}
 }

}
const http=createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ok',world:'Elderwood',accountsConfigured:Boolean(progressStore)}));});
const server=new Server({transport:new WebSocketTransport({server:http})});server.define('elderwood',Elderwood);
await server.listen(Number(process.env.PORT??2567));console.log('Elderwood listening on port',process.env.PORT??2567);
