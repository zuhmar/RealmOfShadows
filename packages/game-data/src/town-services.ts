import {villageBuildings} from './village-buildings';
export type CraftSkill='blacksmithing'|'woodworking'|'cooking'|'alchemy';
export const craftingStations=[
 {id:'workbench',name:'Town workbench',x:20.5,y:10.5,range:2,building:null,skills:['blacksmithing','woodworking','cooking','alchemy'],guide:'Gather materials, then choose a recipe. Crafting improves its own profession.'},
 {id:'smithy',name:'Bram the Smith',x:4.5,y:15.5,range:1.4,building:'workshop',npc:{x:4.5,y:13.5,skin:'citizen'},bench:{key:'craft-bench-blacksmithing',x:3,y:13},skills:['blacksmithing'],guide:'Bring ore to smelt bars, then forge shared armor and melee weapons. Crafted equipment is Uncommon. You can also identify monster equipment in your bag.'},
 {id:'workshop',name:'Elara the Woodworker',x:6.5,y:15.5,range:1.4,building:'workshop',npc:{x:6.5,y:13.5,skin:'citizen-female'},bench:{key:'craft-bench-woodworking',x:5,y:13},skills:['woodworking'],guide:'Turn gathered logs into timber, then craft bows and staves. Each recipe improves Woodworking; better materials require higher profession levels.'},
 {id:'cooking',name:'Tobin the Cook',x:8.5,y:15.5,range:1.4,building:'workshop',npc:{x:8.5,y:13.5,skin:'sand-nomad'},bench:{key:'craft-bench-cooking',x:7,y:13},skills:['cooking'],guide:'Bring your catch to this kitchen counter. Cook fish into food that restores health. Practice local recipes to improve Cooking.'},
 {id:'alchemy',name:'Iris the Alchemist',x:10.5,y:15.5,range:1.4,building:'workshop',npc:{x:10.5,y:13.5,skin:'mage-female'},bench:{key:'craft-bench-alchemy',x:9,y:13},skills:['alchemy'],guide:'Gather plants and brew them into healing potions at this alchemy bench. Higher-level herbs unlock stronger batches as Alchemy improves.'},
] as const;
export type CraftingStation=typeof craftingStations[number];
export function canUseCraftingStation(p:{x:number;y:number;region:string},station:CraftingStation,skill?:string){
 if(p.region!=='elderwood'||Math.hypot(p.x-station.x,p.y-station.y)>station.range||(skill&&!station.skills.some(s=>s===skill)))return false;
 if(!station.building)return true;
 const b=villageBuildings.find(b=>b.id===station.building)!;
 return p.x>b.x&&p.x<b.x+b.width&&p.y>b.y&&p.y<b.y+b.height;
}
export const craftingStation=(id:string)=>craftingStations.find(s=>s.id===id);

export const craftingPairs={blacksmithing:'mining',woodworking:'woodcutting',cooking:'fishing',alchemy:'herbalism'} as const;
