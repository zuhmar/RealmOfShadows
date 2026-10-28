import {resourceTarget,fishForIsland,fishingCastClear,craftRecipes,professionRules,professionLevel,craftingStations,canUseCraftingStation,items,gearDefinition,isGearBase,lootEquipmentRules,inventoryFits,type ProfessionId,type ItemId} from '@realm/game-data';
import type {Profile,Stack} from './economy';
import type {Fighter} from './combat';
import {sight} from './combat';
export interface FishingCast{node:string;region:Fighter['region'];x:number;y:number;startX:number;startY:number;startedAt:number;endsAt:number}
export class ProfessionSystem{
 casts=new Map<string,FishingCast>();results:{id:string;message:string}[]=[];
 status(id:string){const cast=this.casts.get(id);return cast?{...cast}:null;}

 depleted=new Map<string,number>();ready=new Map<string,number>();
 leave(id:string){this.ready.delete(id);this.casts.delete(id);}
 tick(time:number,players:{get(id:string):Fighter|undefined},profiles:Map<string,Profile>,add:(stacks:Stack[],item:ItemId,quantity:number)=>Stack[]|null,random:()=>number){
 for(const [id,cast]of this.casts){const p=players.get(id),profile=profiles.get(id);if(!p||!profile){this.casts.delete(id);continue;}
 const cancelled=p.hp<=0||p.region!==cast.region||p.auto||Math.hypot(p.x-cast.startX,p.y-cast.startY)>.05||!fishingCastClear(p,cast,p.region);
 if(cancelled){this.casts.delete(id);this.results.push({id,message:'Fishing cancelled.'});continue;}
 if(time<cast.endsAt)continue;this.casts.delete(id);
 const pool=fishForIsland(p.region).filter(f=>f.level<=professionLevel(profile.professions.fishing)),fish=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];if(!fish)continue;
 const inventory=add(profile.inventory,fish.item,1);if(!inventory||!inventoryFits(profile,{...profile,inventory})){this.results.push({id,message:'Your bag is full. No fish collected.'});continue;}
 profile.inventory=inventory;profile.professions.fishing=Math.min(10*99**2,profile.professions.fishing+fish.xp);this.results.push({id,message:`Caught ${items[fish.item].name}. +${fish.xp} fishing EXP. Click water to cast again.`});
 }
 }
 act(id:string,p:Fighter,profile:Profile,kind:string,item:unknown,time:number,add:(stacks:Stack[],item:ItemId,quantity:number)=>Stack[]|null,random:()=>number=Math.random):string{
 if(this.casts.has(id))return 'Already fishing. Wait for your catch or move to cancel.';
 if(p.auto)return 'Stop attacking before gathering or crafting.';
 if(typeof item!=='string')return 'Choose a resource or recipe.';
 const gain=(skill:ProfessionId,xp:number)=>profile.professions[skill]=Math.min(10*99**2,profile.professions[skill]+xp);
 if(kind==='gather'){
 const node=resourceTarget(item);if(!node||node.region!==p.region||Math.hypot(p.x-node.x,p.y-node.y)>professionRules.range||!(node.water?fishingCastClear(p,node,p.region):sight(p,{x:node.x,y:node.y},p.region)))return 'Walk closer to that resource.';
 if(professionLevel(profile.professions[node.skill])<node.level)return `Requires ${node.skill} level ${node.level}.`;
 if(node.water){
 if(Math.hypot((p.stepX??p.x)-p.x,(p.stepY??p.y)-p.y)>.0001)return 'Finish stepping before casting.';
 const pool=fishForIsland(p.region).filter(f=>f.level<=professionLevel(profile.professions.fishing)),space=pool.some(f=>profile.inventory.some(s=>s.item===f.item&&s.quantity<items[f.item].stack)||profile.inventory.length<32&&inventoryFits(profile,{...profile,inventory:[...profile.inventory,{id:0,item:f.item,quantity:1}]}));if(!space)return 'Your bag is full. Free a slot before fishing.';
 const duration=1+Math.min(9,Math.floor(random()*10));this.casts.set(id,{node:node.id,region:p.region,x:node.x,y:node.y,startX:p.x,startY:p.y,startedAt:time,endsAt:time+duration});return 'Fishing… Move to cancel; click water again after your catch.';
 }
 if(time<(this.depleted.get(node.id)??0))return `This resource is replenishing · ${Math.ceil((this.depleted.get(node.id)!-time)/60)} min remaining.`;
 if(time<(this.ready.get(id)??0))return 'Wait a moment before gathering again.';
 const inventory=add(profile.inventory,node.item,1);if(!inventory||!inventoryFits(profile,{...profile,inventory}))return 'Your bag is full. Free a slot before gathering.';
 profile.inventory=inventory;gain(node.skill,node.xp);this.depleted.set(node.id,time+professionRules.nodeRespawn);this.ready.set(id,time+professionRules.gatherCooldown);return `Gathered ${items[node.item].name}. +${node.xp} ${node.skill} EXP.`;
 }
 const recipe=craftRecipes.find(r=>r.id===item);if(!recipe)return 'Choose a valid recipe.';
 if(!craftingStations.some(station=>canUseCraftingStation(p,station,recipe.skill)&&sight(p,station,p.region)))return 'Visit the matching crafting workbench in the Crafting Hall.';
 if(professionLevel(profile.professions[recipe.skill])<recipe.level)return `Requires ${recipe.skill} level ${recipe.level}.`;
 for(const [key,count]of Object.entries(recipe.ingredients))if(profile.inventory.filter(s=>s.item===key).reduce((n,s)=>n+s.quantity,0)<count)return 'Missing crafting materials.';
 // Work on copies; neither ingredients nor EXP are lost when output cannot fit.
 let inventory=profile.inventory.map(s=>({...s}));for(const [key,count]of Object.entries(recipe.ingredients)){let remaining=count;for(const stack of inventory){if(stack.item!==key)continue;const used=Math.min(remaining,stack.quantity);stack.quantity-=used;remaining-=used;}}inventory=inventory.filter(s=>s.quantity>0);
 let gear=[...profile.gear];
 if(recipe.output.gear){if(!isGearBase(recipe.output.item)||gear.length>=lootEquipmentRules.maxInstances)return 'Your equipment storage is full.';gear.push({id:crypto.randomUUID(),base:recipe.output.item,rarity:'uncommon'});}
 else{const output=add(inventory,recipe.output.item as ItemId,recipe.output.quantity);if(!output)return 'Your bag is full. Free a slot before crafting.';inventory=output;}
 if(!inventoryFits(profile,{...profile,inventory,gear}))return 'Your bag is full. Free a slot before crafting.';
 profile.inventory=inventory;profile.gear=gear;gain(recipe.skill,recipe.xp);return `Crafted ${recipe.output.gear?`Uncommon ${gearDefinition(recipe.output.item as never).name}`:items[recipe.output.item as ItemId].name}. +${recipe.xp} ${recipe.skill} EXP.`;
 }
}
