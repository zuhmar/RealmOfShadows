import {townPoint,elderwoodTown} from './elderwood-layout';
import {baseVillageBuildings,villageBuildings} from './village-buildings';
export type CraftSkill='blacksmithing'|'woodworking'|'cooking'|'alchemy';
const authoredStations=[
 {id:'workbench',name:'Town workbench',x:20.5,y:10.5,range:2,building:null,skills:['blacksmithing','woodworking','cooking','alchemy'],guide:'Gather materials, then choose a recipe. Crafting improves its own profession.'},
 {id:'smithy',name:'Bram the Smith',x:4.5,y:14.5,range:1.4,building:'workshop',npc:{x:2.5,y:12.5,skin:'citizen',facing:'down'},bench:{key:'craft-bench-blacksmithing',x:2,y:12,width:2,height:2,cells:[[3,12],[3,13],[2,13]]},skills:['blacksmithing'],guide:'Bring ore to smelt bars, then forge shared armor and melee weapons. Crafted equipment is Uncommon. You can also identify monster equipment in your bag.'},
 {id:'workshop',name:'Elara the Woodworker',x:10.5,y:14.5,range:1.4,building:'workshop',npc:{x:12.5,y:12.5,skin:'citizen-female',facing:'down'},bench:{key:'craft-bench-woodworking',x:11,y:12,width:2,height:2,cells:[[11,12],[11,13],[12,13]]},skills:['woodworking'],guide:'Turn gathered logs into timber, then craft bows and staves. Each recipe improves Woodworking; better materials require higher profession levels.'},
 {id:'cooking',name:'Tobin the Cook',x:4.5,y:15.5,range:1.4,building:'workshop',npc:{x:2.5,y:17.5,skin:'sand-nomad',facing:'up'},bench:{key:'craft-bench-cooking',x:2,y:16,width:2,height:2,cells:[[3,17],[3,16],[2,16]]},skills:['cooking'],guide:'Bring your catch to this kitchen counter. Cook fish into food that restores health. Practice local recipes to improve Cooking.'},
 {id:'alchemy',name:'Iris the Alchemist',x:10.5,y:15.5,range:1.4,building:'workshop',npc:{x:12.5,y:17.5,skin:'mage-female',facing:'up'},bench:{key:'craft-bench-alchemy',x:11,y:16,width:2,height:2,cells:[[11,17],[11,16],[12,16]]},skills:['alchemy'],guide:'Gather plants and brew them into healing potions at this alchemy bench. Higher-level herbs unlock stronger batches as Alchemy improves.'},
] as const;
export const baseCraftingStations=authoredStations.map(station=>{
 if(!('npc'in station))return {...station,x:33.5,y:25.5};
 const hall=baseVillageBuildings.find(b=>b.id==='workshop')!,dx=hall.x-2,dy=hall.y-12;
 return {...station,x:station.x+dx,y:station.y+dy,npc:{...station.npc,x:station.npc.x+dx,y:station.npc.y+dy},bench:{...station.bench,x:station.bench.x+dx,y:station.bench.y+dy,cells:station.bench.cells.map(([x,y])=>[x+dx,y+dy] as const)}};
});
export const craftingStations=baseCraftingStations.map(s=>'npc'in s?{...townPoint(s),npc:townPoint(s.npc),bench:{...townPoint(s.bench),cells:s.bench.cells.map(([x,y])=>[x+elderwoodTown.x,y+elderwoodTown.y] as const)}}:townPoint(s));
export type CraftingStation=typeof craftingStations[number];
export function canUseCraftingStation(p:{x:number;y:number;region:string},station:CraftingStation,skill?:string){
 if(p.region!=='elderwood'||Math.hypot(p.x-station.x,p.y-station.y)>station.range||(skill&&!station.skills.some(s=>s===skill)))return false;
 if(!station.building)return true;
 const b=villageBuildings.find(b=>b.id===station.building)!;
 return p.x>b.x&&p.x<b.x+b.width&&p.y>b.y&&p.y<b.y+b.height;
}
export const craftingStation=(id:string)=>craftingStations.find(s=>s.id===id);

export const craftingPairs={blacksmithing:'mining',woodworking:'woodcutting',cooking:'fishing',alchemy:'herbalism'} as const;
