import {createServer} from 'node:http';
import {Server,Room,Client} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {Schema,MapSchema,defineTypes} from '@colyseus/schema';
import {WORLD} from '@realm/game-data';
import {move,type Input} from '@realm/shared';
class Player extends Schema {x=WORLD.spawn.x;y=WORLD.spawn.y;stamina=100;seq=0;}
defineTypes(Player,{x:'number',y:'number',stamina:'number',seq:'number'});
class State extends Schema {players=new MapSchema<Player>();}
defineTypes(State,{players:{map:Player}});
class Elderwood extends Room<State>{
 maxClients=WORLD.capacity;inputs=new Map<string,Input>();received=new Map<string,number>();
 onCreate(){this.setState(new State());this.setPatchRate(50);
 this.onMessage('input',(client:Client,data:unknown)=>{const d=data as Input;if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||Math.abs(d.x)>1||Math.abs(d.y)>1||typeof d.sprint!=='boolean'||!Number.isSafeInteger(d.seq)||d.seq<0||d.seq<=(this.received.get(client.sessionId)??-1))return;this.received.set(client.sessionId,d.seq);this.inputs.set(client.sessionId,{x:d.x,y:d.y,sprint:d.sprint,seq:d.seq});});
 // One input is consumed per server tick; flooding cannot increase speed.
 this.setSimulationInterval(()=>{for(const [id,p] of this.state.players){const input=this.inputs.get(id)??{x:0,y:0,sprint:false,seq:p.seq};const next=move(p,input,1/20);Object.assign(p,next);p.seq=input.seq;this.inputs.delete(id);}},50);
 }
 onJoin(client:Client){this.state.players.set(client.sessionId,new Player());}
 onLeave(client:Client){this.state.players.delete(client.sessionId);this.inputs.delete(client.sessionId);this.received.delete(client.sessionId);}
}
const http=createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ok',world:'Elderwood',phase:1}));});
const server=new Server({transport:new WebSocketTransport({server:http})});server.define('elderwood',Elderwood);
await server.listen(Number(process.env.PORT??2567));console.log('Elderwood listening on port',process.env.PORT??2567);
