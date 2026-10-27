import {equipmentItems} from './equipment';
import {weapons} from './classes';
import type {RegionId} from './index';
export const professionDefinitions={mining:{name:'Mining',craft:'blacksmithing'},blacksmithing:{name:'Blacksmithing',craft:null},fishing:{name:'Fishing',craft:'cooking'},cooking:{name:'Cooking',craft:null},herbalism:{name:'Herbalism',craft:'alchemy'},alchemy:{name:'Alchemy',craft:null},woodcutting:{name:'Woodcutting',craft:'woodworking'},woodworking:{name:'Woodworking',craft:null}} as const;
export type ProfessionId=keyof typeof professionDefinitions;
export type ProfessionXp=Record<ProfessionId,number>;
export const professionRules={cap:100,factor:10,range:1.8,gatherCooldown:2,nodeRespawn:45};
export const professionLevel=(xp:number)=>Math.min(100,Math.floor(Math.sqrt(Math.max(0,xp)/10))+1);
export const newProfessions=():ProfessionXp=>({mining:0,blacksmithing:0,fishing:0,cooking:0,herbalism:0,alchemy:0,woodcutting:0,woodworking:0});
export const metalTiers=['copper','iron','gold','mythril','dragon','shadow'] as const;
export const professionMaterials={
 copperOre:{name:'Copper Ore',stack:50,sell:2},ironOre:{name:'Iron Ore',stack:50,sell:3},goldOre:{name:'Gold Ore',stack:50,sell:5},mythrilOre:{name:'Mythril Ore',stack:50,sell:8},dragonOre:{name:'Dragon Ore',stack:50,sell:12},shadowOre:{name:'Shadow Ore',stack:50,sell:18},
 copperBar:{name:'Copper Bar',stack:50,sell:6},ironBar:{name:'Iron Bar',stack:50,sell:9},goldBar:{name:'Gold Bar',stack:50,sell:15},mythrilBar:{name:'Mythril Bar',stack:50,sell:24},dragonBar:{name:'Dragon Bar',stack:50,sell:36},shadowBar:{name:'Shadow Bar',stack:50,sell:54},
 rawFish:{name:'Raw Fish',stack:20,sell:2},cookedFish:{name:'Cooked Fish',stack:20,sell:4},herb:{name:'Healing Herb',stack:50,sell:2},log:{name:'Wood Log',stack:50,sell:2},timber:{name:'Timber',stack:50,sell:4},
} as const;
export type ProfessionMaterial=keyof typeof professionMaterials;
export interface ResourceNode{id:string;region:RegionId|'tundra'|'celestial'|'peaks'|'fortress';x:number;y:number;skill:'mining'|'fishing'|'herbalism'|'woodcutting';item:ProfessionMaterial;level:number;name:string;xp:number}
// Centers beside passable trails; nodes do not block player/monster grid cells.
export const resourceNodes:ResourceNode[]=[
 ...(['woods','caverns','swamp','tundra','peaks','fortress'] as const).flatMap((region,i)=>[0,1].map(n=>({id:`${region}-ore-${n+1}`,region,x:region==='woods'?20.5+n*3:region==='caverns'?28.5+n*8:18.5+n*3,y:region==='woods'?8.5:region==='caverns'?38.5:12.5,skill:'mining' as const,item:`${metalTiers[i]}Ore` as ProfessionMaterial,level:i*10+1,name:`${metalTiers[i][0].toUpperCase()+metalTiers[i].slice(1)} vein`,xp:25+i*5}))),
 ...(['elderwood','woods','caverns'] as const).flatMap(region=>[
 {id:`${region}-fish`,region,x:region==='woods'?8.5:region==='caverns'?32.5:12.5,y:region==='woods'?21.5:region==='caverns'?29.5:18.5,skill:'fishing' as const,item:'rawFish' as const,level:1,name:'Fishing spot',xp:25},
 {id:`${region}-herb`,region,x:region==='woods'?12.5:region==='caverns'?35.5:18.5,y:region==='woods'?23.5:region==='caverns'?40.5:16.5,skill:'herbalism' as const,item:'herb' as const,level:1,name:'Healing herbs',xp:25},
 {id:`${region}-wood`,region,x:region==='woods'?18.5:region==='caverns'?29.5:12.5,y:region==='woods'?9.5:region==='caverns'?42.5:17.5,skill:'woodcutting' as const,item:'log' as const,level:1,name:'Harvestable timber',xp:25},
 ]),
];
export interface CraftRecipe{id:string;name:string;skill:'blacksmithing'|'woodworking'|'alchemy'|'cooking';level:number;xp:number;ingredients:Partial<Record<ProfessionMaterial,number>>;output:{item:string;quantity:number;gear?:boolean}}
export const craftRecipes:CraftRecipe[]=[
 ...metalTiers.map((tier,i)=>({id:`smelt-${tier}`,name:`Smelt ${tier} bar`,skill:'blacksmithing' as const,level:i*10+1,xp:75+i*15,ingredients:{[`${tier}Ore`]:3},output:{item:`${tier}Bar`,quantity:1}})),
 {id:'cook-fish',name:'Cook fish',skill:'cooking',level:1,xp:50,ingredients:{rawFish:2},output:{item:'cookedFish',quantity:1}},
 {id:'brew-potion',name:'Brew healing potion',skill:'alchemy',level:1,xp:75,ingredients:{herb:3},output:{item:'potion',quantity:1}},
 {id:'cut-timber',name:'Cut timber',skill:'woodworking',level:1,xp:50,ingredients:{log:2},output:{item:'timber',quantity:1}},
];

for(const [base,definition]of Object.entries({...equipmentItems,...weapons})){
 const tier=metalTiers.indexOf(definition.tier as typeof metalTiers[number]);if(tier<0)continue;
 const woodworking='skill'in definition&&(definition.skill==='distance'||definition.skill==='magic');
 craftRecipes.push({id:`craft-${base}`,name:`Craft ${definition.name}`,skill:woodworking?'woodworking':'blacksmithing',level:tier*10+1,xp:40+tier*10,ingredients:woodworking?{timber:6,[`${definition.tier}Bar`]:2}:{[`${definition.tier}Bar`]:4},output:{item:base,quantity:1,gear:true}});
}
export const craftingBench={x:20.5,y:10.5,range:2};
