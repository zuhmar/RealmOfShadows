import {CosmeticStore} from './cosmetic-store';
import {SupabaseStore} from './persistence';
import {earnedCosmetics,ownsCosmetics,accessibleCosmetics,migrateCosmetics,validCosmetics} from '@realm/game-data';
import {playerHouses,emptyHouse,houseById,housingRegions,type HouseRecord} from '@realm/game-data';
import {planHousing,publicHouse} from '@realm/shared';
import {createServer} from 'node:http';
import {progressStore,SaveSession,type Identity} from './persistence';
import {writeProgress} from '../../../packages/shared/src/saves';
import {Server,Room,Client} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {Schema,MapSchema,defineTypes} from '@colyseus/schema';
import {villageDoors,closedVillageDoors,cosmeticLook,availableStair,newAttributes,maxHealth,maxMana,equipmentItems,WORLD,portalFor,equipmentArmor,canTravel,type RegionId,type WeaponId} from '@realm/game-data';
import {toggleVillageDoor,applyEquipment,move,occupiedCells,freeLanding,CombatSimulation,Economy,type Input,type Fighter} from '@realm/shared';
const shop=new CosmeticStore(progressStore instanceof SupabaseStore?progressStore:undefined);
class Player extends Schema {attributes=newAttributes();weaponBonus=0;shieldArmor=0;shieldingXp=0;appearance='';look='';armor=0;weapon:WeaponId='wand';meleeXp=0;distanceXp=0;magicXp=0;x=WORLD.spawn.x;y=WORLD.spawn.y;stepX=WORLD.spawn.x;stepY=WORLD.spawn.y;stamina=100;seq=0;region:RegionId='elderwood';hp=100;mana=100;deadUntil=0;shotAt=0;spellAt=0;target='';auto=false;}
defineTypes(Player,{look:'string',stepX:'number',stepY:'number',weaponBonus:'number',shieldArmor:'number',shieldingXp:'number',appearance:'string',armor:'number',weapon:'string',meleeXp:'number',distanceXp:'number',magicXp:'number',x:'number',y:'number',stamina:'number',seq:'number',region:'string',hp:'number',mana:'number',deadUntil:'number',shotAt:'number',spellAt:'number',target:'string',auto:'boolean'});
class WolfState extends Schema{stepX=0;stepY=0;kind='wolf';region='woods';x=0;y=0;hp=65;mode='idle';facing='down';aimX=0;aimY=0;}
defineTypes(WolfState,{stepX:'number',stepY:'number',kind:'string',region:'string',x:'number',y:'number',hp:'number',mode:'string',facing:'string',aimX:'number',aimY:'number'});
class State extends Schema {doors=new MapSchema<boolean>();players=new MapSchema<Player>();wolves=new MapSchema<WolfState>();}
defineTypes(State,{doors:{map:'boolean'},players:{map:Player},wolves:{map:WolfState}});
class Elderwood extends Room<State>{
 saves=new Map<string,SaveSession>();saving=new Set<string>();saveFailed=new Set<string>();
 economy=new Economy();economyReceived=new Map<string,{tokens:number;time:number}>();rewardTicks=0;combatReceived=new Map<string,number>();simulation=new CombatSimulation();maxClients=WORLD.capacity;inputs=new Map<string,Input>();received=new Map<string,number>();
 houses=new Map<string,HouseRecord>(playerHouses.map(h=>[h.id,emptyHouse(h.id)]));housingReady=false;housingLoading?:Promise<void>;housingBusy=new Map<string,Promise<void>>();
 houseReceived=new Map<string,number>();doorReceived=new Map<string,number>();
 occupied(region:RegionId,except?:Fighter){const cells=occupiedCells([...this.state.players.values(),...this.simulation.wolves.values()],region,except);for(const cell of closedVillageDoors(this.state.doors,region))cells.add(cell);if(region===housingRegions[0])for(const h of playerHouses)if(!this.houses.get(h.id)?.ownerId)cells.add(`${Math.floor(h.door.x)},${Math.floor(h.door.y)}`);return cells;}
 async refreshHouses(){if(this.housingLoading)return this.housingLoading;if(!progressStore?.houses)return;this.housingLoading=(async()=>{try{const rows=await progressStore.houses!();for(const h of rows)if(houseById(h.id)){const old=this.houses.get(h.id);if(!old||h.revision>=old.revision)this.houses.set(h.id,h);}this.housingReady=playerHouses.every(h=>rows.some(r=>r.id===h.id));}catch{this.housingReady=false;}finally{this.housingLoading=undefined;}})();return this.housingLoading;}
 async houseAction(client:Client,raw:unknown){
  const id=client.sessionId;if(this.housingBusy.has(id)||this.saveFailed.has(id))return;
  const work=(async()=>{const save=this.saves.get(id);if(!save){client.send('house-result','Sign in to buy a permanent house or decorate it.');return;}
   await this.refreshHouses();const p=this.state.players.get(id),profile=this.economy.profiles.get(id);if(!p||!profile)return;
   if(!this.housingReady){client.send('house-result','Housing saves are unavailable. The server needs the housing database migration.');return;}
   const h=houseById((raw as {house?:unknown})?.house);if(!h)return;const current=this.houses.get(h.id)!;
   const name=save.characterName||save.identity.displayName||`Adventurer ${save.identity.id.slice(-6)}`;
   const plan=planHousing(profile,p,current,save.identity.id,name,raw);if(typeof plan==='string'){client.send('house-result',plan);return;}
   this.economy.professions.casts.delete(id);this.inputs.delete(id);this.simulation.clear(p);
   this.economy.profiles.set(id,plan.profile);this.economy.serial=Math.max(this.economy.serial,...[...plan.profile.inventory,...plan.profile.depot.supplies].map(s=>s.id));
   try{await save.commitHouse(plan.house,current.revision,writeProgress(plan.profile,this.simulation.time,this.simulation.spellCooldowns.get(id)));this.houses.set(h.id,plan.house);client.send('house-result',plan.message);for(const c of this.clients)this.sendSnapshot(c);}
   catch{this.saveFailed.add(id);client.send('save-error','The house changed or its transaction could not be confirmed. Reconnect to reload saved gold and items safely.');client.leave(4005);}
  })();this.housingBusy.set(id,work);try{await work;}finally{this.housingBusy.delete(id);this.sendSnapshot(client);}
 }
 onCreate(){this.economy.automaticLoot=true;this.setState(new State());this.setPatchRate(50);void this.refreshHouses();this.clock.setInterval(()=>void this.refreshHouses(),5000);this.onMessage('house',(client:Client,raw:unknown)=>{const now=this.simulation.time;if(now-(this.houseReceived.get(client.sessionId)??-Infinity)<.25){client.send('house-result','Please wait a moment before another house action.');return;}this.houseReceived.set(client.sessionId,now);void this.houseAction(client,raw)});for(const door of villageDoors('elderwood'))this.state.doors.set(door.id,true);
 this.onMessage('door',(client:Client,id:unknown)=>{const p=this.state.players.get(client.sessionId),time=this.simulation.time;if(!p||(this.saveFailed.has(client.sessionId)||this.housingBusy.has(client.sessionId))||time-(this.doorReceived.get(client.sessionId)??-Infinity)<.25)return;this.doorReceived.set(client.sessionId,time);client.send('door-result',toggleVillageDoor(this.state.doors,p,id,this.state.players.values()));});
 this.onMessage('travel',(client:Client,destination:unknown)=>{
 const p=this.state.players.get(client.sessionId);
 if((this.saveFailed.has(client.sessionId)||this.housingBusy.has(client.sessionId))||!p||p.hp<=0||!canTravel(p,p.region,destination)){client.send('travel-error','Walk closer to the portal and choose another destination.');return;}
 this.inputs.delete(client.sessionId);p.seq=this.received.get(client.sessionId)??p.seq;
 this.simulation.clear(p);p.region=destination;p.x=portalFor(destination).arrival.x;p.y=portalFor(destination).arrival.y;Object.assign(p,freeLanding(p,p.region,this.occupied(p.region,p)));p.stepX=p.x;p.stepY=p.y;
 client.send('travel-complete',{region:p.region,x:p.x,y:p.y,stamina:p.stamina,seq:p.seq});
 });
 this.onMessage('stairs',(client:Client,id:unknown)=>{
 const p=this.state.players.get(client.sessionId),stair=p?availableStair(p,p.region,id):undefined;
 if(!p||p.hp<=0||(this.saveFailed.has(client.sessionId)||this.housingBusy.has(client.sessionId))||!stair||(typeof id==='string'&&id.startsWith('home-')&&!this.houses.get(id.split('-')[1])?.ownerId)){client.send('travel-error','Move closer to the stairs to change depth.');return;}
 this.inputs.delete(client.sessionId);p.seq=this.received.get(client.sessionId)??p.seq;this.simulation.clear(p);p.region=stair.to;p.x=stair.arrival.x;p.y=stair.arrival.y;Object.assign(p,freeLanding(p,p.region,this.occupied(p.region,p)));p.stepX=p.x;p.stepY=p.y;client.send('travel-complete',{region:p.region,x:p.x,y:p.y,stamina:p.stamina,seq:p.seq});
 });
 this.onMessage('economy',(client:Client,request:unknown)=>{const now=this.simulation.time;const budget=this.economyReceived.get(client.sessionId)??{tokens:4,time:now};budget.tokens=Math.min(4,budget.tokens+(now-budget.time)*10);budget.time=now;this.economyReceived.set(client.sessionId,budget);if(budget.tokens<1)return;budget.tokens--; const p=this.state.players.get(client.sessionId);if(!p||(this.saveFailed.has(client.sessionId)||this.housingBusy.has(client.sessionId)))return;const profile=this.economy.profiles.get(client.sessionId)!;if((request as {kind?:unknown})?.kind==='cosmetics'){const next=migrateCosmetics((request as {cosmetics?:unknown}).cosmetics);if(!validCosmetics(next)||!ownsCosmetics(next,[...earnedCosmetics(profile),...shop.cached(this.saves.get(client.sessionId)?.identity.id)])){client.send('economy-result','This cosmetic is locked. Unlock it in the shop first.');return;}}const message=this.economy.act(client.sessionId,p,request,now);p.appearance=JSON.stringify(this.economy.profiles.get(client.sessionId)!.equipment);p.look=JSON.stringify(cosmeticLook(this.economy.profiles.get(client.sessionId)!.cosmetics,this.economy.profiles.get(client.sessionId)!.classId));client.send('economy-result',message);this.sendSnapshot(client);void this.savePlayer(client);});
 this.onMessage('combat',(client:Client,data:unknown)=>{if((this.saveFailed.has(client.sessionId)||this.housingBusy.has(client.sessionId))||!data||typeof data!=='object')return;const now=this.simulation.time;if(now-(this.combatReceived.get(client.sessionId)??-Infinity)<.1)return;this.combatReceived.set(client.sessionId,now);const p=this.state.players.get(client.sessionId);if(p){const {kind,target,spell}=data as {kind:unknown;target:unknown;spell:unknown};if(!(kind==='spell'?this.simulation.castSpell(client.sessionId,p,spell,target,this.economy.profiles.get(client.sessionId)):this.simulation.action(client.sessionId,p,kind,target)))client.send('combat-error','Attack unavailable: check your target, range, mana, cooldown, and portal sanctuary.');}});
 this.onMessage('input',(client:Client,data:unknown)=>{if((this.saveFailed.has(client.sessionId)||this.housingBusy.has(client.sessionId)))return;const d=data as Input;if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||Math.abs(d.x)>1||Math.abs(d.y)>1||typeof d.sprint!=='boolean'||!Number.isSafeInteger(d.seq)||d.seq<0||d.seq<=(this.received.get(client.sessionId)??-1))return;this.received.set(client.sessionId,d.seq);this.inputs.set(client.sessionId,{x:d.x,y:d.y,sprint:d.sprint,seq:d.seq});});
 // One input is consumed per server tick; flooding cannot increase speed.
 this.setSimulationInterval(()=>{
 for(const [id,p] of this.state.players){const input=this.inputs.get(id)??{x:0,y:0,sprint:false,seq:p.seq};if(p.hp>0&&!this.housingBusy.has(id))Object.assign(p,move(p,input,1/20,p.region,this.occupied(p.region,p)));p.seq=input.seq;this.inputs.delete(id);}
 this.simulation.tick(.05,this.state.players as Iterable<[string,Fighter]>);
 for(const [id,p] of this.state.players)this.economy.sync(id,p);
 this.economy.process(this.simulation.kills.splice(0),this.state.players,this.simulation.time);for(const id of this.economy.collected){const client=this.clients.find(c=>c.sessionId===id);if(client)void this.savePlayer(client);}this.economy.collected.clear();for(const result of this.economy.professions.results.splice(0)){const client=this.clients.find(c=>c.sessionId===result.id);if(client){client.send('economy-result',result.message);void this.savePlayer(client);}}if(++this.rewardTicks%4===0)for(const client of this.clients)this.sendSnapshot(client);
 if(this.rewardTicks%100===0)for(const client of this.clients){void this.savePlayer(client);if(shop.enabled){const save=this.saves.get(client.sessionId);if(save)void shop.owned(save.identity.id).then(()=>{const profile=this.economy.profiles.get(client.sessionId),p=this.state.players.get(client.sessionId);if(profile&&p){profile.cosmetics=accessibleCosmetics(profile.cosmetics,[...earnedCosmetics(profile),...shop.cached(save.identity.id)]);p.look=JSON.stringify(cosmeticLook(profile.cosmetics,profile.classId));}}).catch(()=>{});}}
 for(const [id,w] of this.simulation.wolves){if(!this.state.wolves.has(id))this.state.wolves.set(id,new WolfState());const state=this.state.wolves.get(id)!;state.stepX=w.stepX??w.x;state.stepY=w.stepY??w.y;state.kind=w.kind;state.region=w.region??'woods';state.x=w.x;state.y=w.y;state.hp=w.hp;state.mode=w.mode;state.facing=w.facing;state.aimX=w.aimX;state.aimY=w.aimY;}
 for(const event of this.simulation.events.splice(0))for(const client of this.clients)if(this.state.players.get(client.sessionId)?.region===event.region)client.send('combat-event',event);
 },50);
 }
 async onAuth(_client:Client,options:{accessToken?:unknown;characterSlot?:unknown;characterName?:unknown}){if(!options?.accessToken)return {guest:true};if(!progressStore)throw Error('Account saves are not configured on the game server.');const slot=options.characterSlot??1;if(!Number.isInteger(slot)||Number(slot)<1||Number(slot)>4)throw Error('Choose one of the four character slots.');const name=options.characterName===undefined?(options.characterSlot===undefined?'Adventurer':''):options.characterName;if(typeof name!=='string'||name.length>24||/[\x00-\x1f<>]/.test(name)||name!==name.trim())throw Error('Use a character name of 1–24 letters or numbers.');const identity=await progressStore.verify(options.accessToken);const rows=await progressStore.roster?.(identity.id) as {slot:number;name?:string}[]|undefined;if(shop.enabled)await shop.owned(identity.id);return {...identity,slot,name:rows?.find(r=>r.slot===slot)?.name??name};}
 async onJoin(client:Client){
 await this.refreshHouses();
 this.economy.join(client.sessionId);const p=new Player();
 try{if(client.auth?.id){const save=new SaveSession(progressStore!,client.auth as Identity,client.auth.slot,client.auth.name);const data=await save.claim(writeProgress(this.economy.profiles.get(client.sessionId)!,0));
 this.saves.set(client.sessionId,save);this.economy.profiles.set(client.sessionId,data.profile);this.economy.serial=Math.max(this.economy.serial,...[...data.profile.inventory,...data.profile.depot.supplies].map(s=>s.id));
 {const owned=shop.cached(save.identity.id);data.profile.cosmetics=accessibleCosmetics(data.profile.cosmetics,[...earnedCosmetics(data.profile),...owned]);}applyEquipment(data.profile,p);p.shieldingXp=data.profile.skillXp.shielding;p.hp=maxHealth(p.attributes);p.mana=maxMana(p.attributes);p.meleeXp=data.profile.skillXp.melee;p.distanceXp=data.profile.skillXp.distance;p.magicXp=data.profile.skillXp.magic;
 data.profile.potionReadyAt=this.simulation.time+data.potionRemaining;this.simulation.spellCooldowns.set(client.sessionId,Object.fromEntries(Object.entries(data.cooldowns).map(([id,remaining])=>[id,this.simulation.time+remaining!])));
 }
 Object.assign(p,freeLanding(p,p.region,this.occupied(p.region)));p.stepX=p.x;p.stepY=p.y;p.appearance=JSON.stringify(this.economy.profiles.get(client.sessionId)!.equipment);p.look=JSON.stringify(cosmeticLook(this.economy.profiles.get(client.sessionId)!.cosmetics,this.economy.profiles.get(client.sessionId)!.classId));this.state.players.set(client.sessionId,p);
 }catch(err){this.economy.leave(client.sessionId);throw err;}
 }
 sendSnapshot(client:Client){if(!this.economy.profiles.has(client.sessionId)||!this.state.players.has(client.sessionId))return;const save=this.saves.get(client.sessionId);client.send('economy-state',{...this.economy.snapshot(client.sessionId,this.simulation.time),houses:[...this.houses.values()].map(h=>publicHouse(h,save?.identity.id)),housingAvailable:this.housingReady,housingBusy:this.housingBusy.has(client.sessionId),shopEnabled:shop.enabled,cosmeticOwned:shop.cached(save?.identity.id),account:save?{email:save.identity.email,characterSlot:save.slot,characterName:save.characterName,savedAt:save.savedAt,state:this.saveFailed.has(client.sessionId)?'error':(this.saving.has(client.sessionId)||this.housingBusy.has(client.sessionId))?'saving':'ready'}:null});}
 async savePlayer(client:Client){const id=client.sessionId,save=this.saves.get(id),profile=this.economy.profiles.get(id);if(!save||!profile||this.saving.has(id)||this.saveFailed.has(id)||this.housingBusy.has(id))return;this.saving.add(id);
 try{await save.save(writeProgress(profile,this.simulation.time,this.simulation.spellCooldowns.get(id)));}
 catch{this.saveFailed.add(id);client.send('save-error','Saving failed. Reconnect before continuing; your last confirmed save is safe.');client.leave(4005);}
 finally{this.saving.delete(id);}
 }
 async onLeave(client:Client){await this.housingBusy.get(client.sessionId);const id=client.sessionId,save=this.saves.get(id),profile=this.economy.profiles.get(id);const final=save&&profile?writeProgress(profile,this.simulation.time,this.simulation.spellCooldowns.get(id)):undefined;
 this.state.players.delete(id);this.economy.leave(id);this.simulation.spellCooldowns.delete(id);this.economyReceived.delete(id);this.inputs.delete(id);this.received.delete(id);this.doorReceived.delete(id);this.houseReceived.delete(id);this.combatReceived.delete(id);this.saves.delete(id);this.saveFailed.delete(id);
 if(save&&final)try{await save.save(final,true);}catch{console.error('Final character save failed; database session will expire.');}
 }

}
const http=createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Cache-Control','no-store');if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 if(await shop.handle(req,res))return;
 if(req.url==='/characters'&&req.method==='GET'){if(!progressStore?.roster){res.writeHead(503);res.end(JSON.stringify({error:'Character selection is unavailable. Check server configuration and the character slots migration.'}));return;}let identity:Identity;try{identity=await progressStore.verify(req.headers.authorization?.replace(/^Bearer /,''));}catch{res.writeHead(401);res.end(JSON.stringify({error:'Sign in again to load your characters.'}));return;}try{res.end(JSON.stringify({slots:await progressStore.roster(identity.id)}));}catch{res.writeHead(503);res.end(JSON.stringify({error:'Could not load characters. Check the character slots database migration and retry.'}));}return;}
 res.end(JSON.stringify({status:'ok',world:'Elderwood',accountsConfigured:Boolean(progressStore)}));});
const server=new Server({transport:new WebSocketTransport({server:http})});server.define('elderwood',Elderwood);
await server.listen(Number(process.env.PORT??2567));console.log('Elderwood listening on port',process.env.PORT??2567);
