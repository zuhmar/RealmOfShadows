import {resourceNodes,craftRecipes,professionRules,professionLevel,craftingBench,items,gearDefinition,isGearBase,lootEquipmentRules,inventoryFits,type ProfessionId,type ItemId} from '@realm/game-data';
import type {Profile,Stack} from './economy';
import type {Fighter} from './combat';
import {sight} from './combat';
export class ProfessionSystem{
 depleted=new Map<string,number>();ready=new Map<string,number>();
 leave(id:string){this.ready.delete(id);}
 act(id:string,p:Fighter,profile:Profile,kind:string,item:unknown,time:number,add:(stacks:Stack[],item:ItemId,quantity:number)=>Stack[]|null):string{
 if(p.auto)return 'Stop attacking before gathering or crafting.';
 if(typeof item!=='string')return 'Choose a resource or recipe.';
 const gain=(skill:ProfessionId,xp:number)=>profile.professions[skill]=Math.min(10*99**2,profile.professions[skill]+xp);
 if(kind==='gather'){
 const node=resourceNodes.find(n=>n.id===item);if(!node||node.region!==p.region||Math.hypot(p.x-node.x,p.y-node.y)>professionRules.range||!sight(p,{x:node.x,y:node.y},p.region))return 'Walk closer to that resource.';
 if(professionLevel(profile.professions[node.skill])<node.level)return `Requires ${node.skill} level ${node.level}.`;
 if(time<(this.depleted.get(node.id)??0))return 'This resource is replenishing.';
 if(time<(this.ready.get(id)??0))return 'Wait a moment before gathering again.';
 const inventory=add(profile.inventory,node.item,1);if(!inventory||!inventoryFits(profile,{...profile,inventory}))return 'Your bag is full. Free a slot before gathering.';
 profile.inventory=inventory;gain(node.skill,node.xp);this.depleted.set(node.id,time+professionRules.nodeRespawn);this.ready.set(id,time+professionRules.gatherCooldown);return `Gathered ${items[node.item].name}. +${node.xp} ${node.skill} EXP.`;
 }
 const recipe=craftRecipes.find(r=>r.id===item);if(!recipe)return 'Choose a valid recipe.';
 if(p.region!=='elderwood'||Math.hypot(p.x-craftingBench.x,p.y-craftingBench.y)>craftingBench.range)return 'Visit the crafting workbench in Elderwood.';
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
