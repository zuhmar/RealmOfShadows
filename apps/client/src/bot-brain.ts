import {isSpell,spells,monsters,type RegionId,type SpellId,type MonsterKind} from '@realm/game-data';
export interface BotConfig{monster:'any'|MonsterKind;radius:number;rotation:SpellId[];potions:boolean;potionPercent:number}
export const defaultBotConfig=():BotConfig=>({monster:'any',radius:10,rotation:[],potions:true,potionPercent:50});
export function readBotConfig(value:unknown):BotConfig{const c=value as Partial<BotConfig>|null,d=defaultBotConfig();if(!c||typeof c!=='object')return d;return{monster:c.monster==='any'||typeof c.monster==='string'&&Object.hasOwn(monsters,c.monster)?c.monster:d.monster,radius:[6,10,16].includes(c.radius??0)?c.radius!:d.radius,rotation:Array.isArray(c.rotation)?[...new Set(c.rotation.filter(isSpell))]:[],potions:typeof c.potions==='boolean'?c.potions:d.potions,potionPercent:Number.isInteger(c.potionPercent)&&c.potionPercent!>=1&&c.potionPercent!<=95?c.potionPercent!:d.potionPercent};}
export interface BotTarget{id:string;kind:MonsterKind;hp:number;region:RegionId;mode:string;x:number;y:number}
export interface BotContext{now:number;blocked:boolean;blockReason?:string;hp:number;maxHp:number;mana:number;region:string;x:number;y:number;selected:string;learned:readonly SpellId[];targets:BotTarget[];potionReady:boolean;hasPotion:boolean;reachable:(t:BotTarget)=>boolean;spellSight:(t:BotTarget)=>boolean;safe:boolean}
export interface BotDecision{target?:string;spell?:SpellId;potion?:boolean;stop?:boolean}
export class BotBrain{
 enabled=false;status='Stopped';config=defaultBotConfig();private next=0;private cursor=0;private potionAt=0;private ready=new Map<SpellId,number>();private driving=false;
 stop(){this.enabled=false;this.status='Stopped';this.driving=false;this.next=0;}
 recordSpell(id:SpellId,now:number){this.ready.set(id,now+spells[id].cooldown*1000)}
 range(weapon:number,learned:readonly SpellId[]){return this.enabled?Math.min(weapon,...this.config.rotation.filter(id=>learned.includes(id)&&spells[id].effect!=='heal').map(id=>spells[id].range)):weapon}
 tick(c:BotContext):BotDecision{
 if(!this.enabled)return{};
 if(c.blocked||c.hp<=0){this.status=c.hp<=0?'Stopped · Defeated':c.blockReason??'Paused · Close menus to continue';const stop=this.driving;this.driving=false;return{stop};}
 if(c.now<this.next)return{};this.next=c.now+300;const decision:BotDecision={};
 if(this.config.potions&&c.hp/c.maxHp*100<=this.config.potionPercent&&c.hp<c.maxHp&&c.hasPotion&&c.potionReady&&c.now>=this.potionAt){decision.potion=true;this.potionAt=c.now+3000;}
 const allowed=c.targets.filter(t=>t.hp>0&&t.mode!=='return'&&t.region===c.region&&(this.config.monster==='any'?!monsters[t.kind].boss:t.kind===this.config.monster)&&Math.hypot(t.x-c.x,t.y-c.y)<=this.config.radius);
 const current=allowed.find(t=>t.id===c.selected),ordered=allowed.sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));const target=current&&c.reachable(current)?current:ordered.find(t=>c.reachable(t));
 if(!target){this.status='Waiting · No reachable matching monster nearby';if(this.driving)decision.stop=true;this.driving=false;return decision;}
 decision.target=target.id;this.driving=true;this.status=`Hunting · ${monsters[target.kind].name}`;
 for(let n=0;n<this.config.rotation.length;n++){const i=(this.cursor+n)%this.config.rotation.length,id=this.config.rotation[i],s=spells[id];if(!c.learned.includes(id)||c.mana<s.cost||c.now<(this.ready.get(id)??0))continue;if(s.effect==='heal'?c.hp>=c.maxHp:c.safe||Math.hypot(target.x-c.x,target.y-c.y)>s.range||!c.spellSight(target))continue;decision.spell=id;this.cursor=(i+1)%this.config.rotation.length;this.recordSpell(id,c.now);break;}
 return decision;
 }
}
