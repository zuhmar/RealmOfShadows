import {islandResourceSets,resourceVarietyMaterials} from './resource-varieties';
import {resourcePositions,resourceRegions} from './resource-spawns';
import {equipmentItems} from './equipment';
import {weapons} from './classes';
import type {RegionId} from './index';
export const professionDefinitions={mining:{name:'Mining',craft:'blacksmithing'},blacksmithing:{name:'Blacksmithing',craft:null},fishing:{name:'Fishing',craft:'cooking'},cooking:{name:'Cooking',craft:null},herbalism:{name:'Herbalism',craft:'alchemy'},alchemy:{name:'Alchemy',craft:null},woodcutting:{name:'Woodcutting',craft:'woodworking'},woodworking:{name:'Woodworking',craft:null}} as const;
export type ProfessionId=keyof typeof professionDefinitions;
export type ProfessionXp=Record<ProfessionId,number>;
export const professionRules={cap:100,factor:10,range:1.8,gatherCooldown:2,nodeRespawn:300};
export const professionLevel=(xp:number)=>Math.min(100,Math.floor(Math.sqrt(Math.max(0,xp)/10))+1);
export const newProfessions=():ProfessionXp=>({mining:0,blacksmithing:0,fishing:0,cooking:0,herbalism:0,alchemy:0,woodcutting:0,woodworking:0});
export const metalTiers=['copper','iron','gold','mythril','dragon','shadow'] as const;
export const professionMaterials={...resourceVarietyMaterials,
 copperOre:{name:'Copper Ore',stack:50,sell:2},ironOre:{name:'Iron Ore',stack:50,sell:3},goldOre:{name:'Gold Ore',stack:50,sell:5},mythrilOre:{name:'Mythril Ore',stack:50,sell:8},dragonOre:{name:'Dragon Ore',stack:50,sell:12},shadowOre:{name:'Shadow Ore',stack:50,sell:18},
 copperBar:{name:'Copper Bar',stack:50,sell:6},ironBar:{name:'Iron Bar',stack:50,sell:9},goldBar:{name:'Gold Bar',stack:50,sell:15},mythrilBar:{name:'Mythril Bar',stack:50,sell:24},dragonBar:{name:'Dragon Bar',stack:50,sell:36},shadowBar:{name:'Shadow Bar',stack:50,sell:54},
 rawFish:{name:'Raw Fish',stack:20,sell:2},cookedFish:{name:'Cooked Fish',stack:20,sell:4},herb:{name:'Healing Herb',stack:50,sell:2},log:{name:'Wood Log',stack:50,sell:2},timber:{name:'Timber',stack:50,sell:4},
} as const;
export type ProfessionMaterial=keyof typeof professionMaterials;
export interface ResourceNode{water?:true;id:string;region:RegionId;x:number;y:number;skill:'mining'|'fishing'|'herbalism'|'woodcutting';item:ProfessionMaterial;level:number;name:string;xp:number}
// Every ore, tree and plant variety appears on every playable map. Island
// themes describe resource origins, not geography restrictions on gathering.
const resourceKinds:Omit<ResourceNode,'id'|'region'|'x'|'y'>[]=[
 ...metalTiers.map((tier,i)=>({skill:'mining' as const,item:`${tier}Ore` as ProfessionMaterial,level:i*10+1,name:`${tier[0].toUpperCase()+tier.slice(1)} vein`,xp:25+i*5})),
 ...Object.values(islandResourceSets).map(s=>({skill:'woodcutting' as const,item:s.tree.item,level:s.level,name:s.tree.name,xp:25+Math.floor(s.level/10)*5})),
 ...Object.values(islandResourceSets).map(s=>({skill:'herbalism' as const,item:s.plant.item,level:s.level,name:s.plant.name,xp:25+Math.floor(s.level/10)*5})),
];
export function localResourceKinds(region:string){
 const island=region==='woods-depths'?'woods':region==='caverns-depths'?'caverns':region,set=islandResourceSets[island as keyof typeof islandResourceSets]??islandResourceSets.elderwood;
 return [resourceKinds.filter(k=>k.skill==='mining'&&k.level<=set.level).at(-1)!,resourceKinds.find(k=>k.item===set.tree.item)!,resourceKinds.find(k=>k.item===set.plant.item)!];
}
export const resourceNodes:ResourceNode[]=resourceRegions.flatMap(region=>{
 const local=localResourceKinds(region),kinds=[...resourceKinds,...Array.from({length:5},()=>local).flat()];
 return resourcePositions(region,kinds.length).map((p,i)=>{
 const kind=kinds[i],index=i<6?i+1:i<14?i-5:i-13,id=i>=22?`${region}-local-${kind.skill}-${Math.floor((i-22)/3)+1}`:i<6?`${region}-ore-${index}`:i<14?`${region}-wood${index===1?'':`-${index}`}`:`${region}-herb${index===1?'':`-${index}`}`;
 return {...kind,...p,region,id};
 });
});
export interface CraftRecipe{id:string;name:string;skill:'blacksmithing'|'woodworking'|'alchemy'|'cooking';level:number;xp:number;ingredients:Partial<Record<ProfessionMaterial,number>>;output:{item:string;quantity:number;gear?:boolean}}
export const craftRecipes:CraftRecipe[]=[
 ...metalTiers.map((tier,i)=>({id:`smelt-${tier}`,name:`Smelt ${tier} bar`,skill:'blacksmithing' as const,level:i*10+1,xp:75+i*15,ingredients:{[`${tier}Ore`]:3},output:{item:`${tier}Bar`,quantity:1}})),
 {id:'cook-fish',name:'Cook fish',skill:'cooking',level:1,xp:50,ingredients:{rawFish:2},output:{item:'cookedFish',quantity:1}},
 {id:'brew-potion',name:'Brew healing potion',skill:'alchemy',level:1,xp:75,ingredients:{herb:3},output:{item:'potion',quantity:1}},
 {id:'cut-timber',name:'Cut timber',skill:'woodworking',level:1,xp:50,ingredients:{log:2},output:{item:'timber',quantity:1}},
];

for(const set of Object.values(islandResourceSets)){
 for(const [i,[item,name]]of set.fish.entries())craftRecipes.push({id:`cook-${item}`,name:`Cook ${name}`,skill:'cooking',level:set.level+i*3,xp:50+Math.floor(set.level/10)*10+i*5,ingredients:{[item]:1},output:{item:'cookedFish',quantity:1+Math.floor(set.level/20)}});
 craftRecipes.push({id:`brew-${set.plant.item}`,name:`Brew with ${set.plant.name}`,skill:'alchemy',level:set.level,xp:75+Math.floor(set.level/10)*15,ingredients:{[set.plant.item]:3},output:{item:'potion',quantity:1+Math.floor(set.level/30)}});
 craftRecipes.push({id:`cut-${set.tree.item}`,name:`Cut ${set.tree.material}`,skill:'woodworking',level:set.level,xp:50+Math.floor(set.level/10)*10,ingredients:{[set.tree.item]:2},output:{item:'timber',quantity:1+Math.floor(set.level/20)}});
}

for(const [base,definition]of Object.entries({...equipmentItems,...weapons})){
 const tier=metalTiers.indexOf(definition.tier as typeof metalTiers[number]);if(tier<0)continue;
 const woodworking='skill'in definition&&(definition.skill==='distance'||definition.skill==='magic');
 craftRecipes.push({id:`craft-${base}`,name:`Craft ${definition.name}`,skill:woodworking?'woodworking':'blacksmithing',level:tier*10+1,xp:40+tier*10,ingredients:woodworking?{timber:6,[`${definition.tier}Bar`]:2}:{[`${definition.tier}Bar`]:4},output:{item:base,quantity:1,gear:true}});
}
export const craftingBench={x:20.5,y:10.5,range:2};
