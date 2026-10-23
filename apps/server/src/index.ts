import {createServer} from 'node:http';
import {Server,Room,Client} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {Schema,MapSchema,defineTypes} from '@colyseus/schema';
import {WORLD,PORTAL,canTravel,type RegionId} from '@realm/game-data';
import {move,CombatSimulation,type Input,type Fighter} from '@realm/shared';
class Player extends Schema {x=WORLD.spawn.x;y=WORLD.spawn.y;stamina=100;seq=0;region:RegionId='elderwood';hp=100;mana=100;deadUntil=0;shotAt=0;spellAt=0;target='';auto=false;}
defineTypes(Player,{x:'number',y:'number',stamina:'number',seq:'number',region:'string',hp:'number',mana:'number',deadUntil:'number',shotAt:'number',spellAt:'number',target:'string',auto:'boolean'});
class WolfState extends Schema{x=0;y=0;hp=65;mode='idle';facing='down';}
defineTypes(WolfState,{x:'number',y:'number',hp:'number',mode:'string',facing:'string'});
class State extends Schema {players=new MapSchema<Player>();wolves=new MapSchema<WolfState>();}
defineTypes(State,{players:{map:Player},wolves:{map:WolfState}});
class Elderwood extends Room<State>{
 combatReceived=new Map<string,number>();simulation=new CombatSimulation();maxClients=WORLD.capacity;inputs=new Map<string,Input>();received=new Map<string,number>();
 onCreate(){this.setState(new State());this.setPatchRate(50);
 this.onMessage('travel',(client:Client,destination:unknown)=>{
 const p=this.state.players.get(client.sessionId);
 if(!p||p.hp<=0||!canTravel(p,p.region,destination)){client.send('travel-error','Walk closer to the portal and choose another destination.');return;}
 this.inputs.delete(client.sessionId);p.seq=this.received.get(client.sessionId)??p.seq;
 this.simulation.clear(p);p.region=destination;p.x=PORTAL.arrival.x;p.y=PORTAL.arrival.y;
 client.send('travel-complete',{region:p.region,x:p.x,y:p.y,stamina:p.stamina,seq:p.seq});
 });
 this.onMessage('combat',(client:Client,data:unknown)=>{if(!data||typeof data!=='object')return;const now=this.simulation.time;if(now-(this.combatReceived.get(client.sessionId)??-Infinity)<.1)return;this.combatReceived.set(client.sessionId,now);const p=this.state.players.get(client.sessionId);if(p){const {kind,target}=data as {kind:unknown;target:unknown};if(!this.simulation.action(client.sessionId,p,kind,target))client.send('combat-error','Attack unavailable: check your target, range, mana, cooldown, and portal sanctuary.');}});
 this.onMessage('input',(client:Client,data:unknown)=>{const d=data as Input;if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||Math.abs(d.x)>1||Math.abs(d.y)>1||typeof d.sprint!=='boolean'||!Number.isSafeInteger(d.seq)||d.seq<0||d.seq<=(this.received.get(client.sessionId)??-1))return;this.received.set(client.sessionId,d.seq);this.inputs.set(client.sessionId,{x:d.x,y:d.y,sprint:d.sprint,seq:d.seq});});
 // One input is consumed per server tick; flooding cannot increase speed.
 this.setSimulationInterval(()=>{
 for(const [id,p] of this.state.players){const input=this.inputs.get(id)??{x:0,y:0,sprint:false,seq:p.seq};if(p.hp>0)Object.assign(p,move(p,input,1/20,p.region));p.seq=input.seq;this.inputs.delete(id);}
 this.simulation.tick(.05,this.state.players as Iterable<[string,Fighter]>);
 for(const [id,w] of this.simulation.wolves){if(!this.state.wolves.has(id))this.state.wolves.set(id,new WolfState());const state=this.state.wolves.get(id)!;state.x=w.x;state.y=w.y;state.hp=w.hp;state.mode=w.mode;state.facing=w.facing;}
 for(const event of this.simulation.events.splice(0))for(const client of this.clients)if(this.state.players.get(client.sessionId)?.region===event.region)client.send('combat-event',event);
 },50);
 }
 onJoin(client:Client){this.state.players.set(client.sessionId,new Player());}
 onLeave(client:Client){this.state.players.delete(client.sessionId);this.inputs.delete(client.sessionId);this.received.delete(client.sessionId);this.combatReceived.delete(client.sessionId);}
}
const http=createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ok',world:'Elderwood',phase:1}));});
const server=new Server({transport:new WebSocketTransport({server:http})});server.define('elderwood',Elderwood);
await server.listen(Number(process.env.PORT??2567));console.log('Elderwood listening on port',process.env.PORT??2567);
