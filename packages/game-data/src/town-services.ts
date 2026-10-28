import {villageBuildings} from './village-buildings';
export type CraftSkill='blacksmithing'|'woodworking'|'cooking'|'alchemy';
export const craftingStations=[
 {id:'workbench',name:'Town workbench',x:20.5,y:10.5,range:2,building:null,skills:['blacksmithing','woodworking','cooking','alchemy'],guide:'Gather materials, then choose a recipe. Crafting improves its own profession.'},
 {id:'smithy',name:'Bram the Smith',x:25.5,y:5.5,range:1.5,building:'smithy',npc:{x:25.5,y:4.5,skin:'citizen'},skills:['blacksmithing'],guide:'Bring ore to smelt bars, then forge shared armor and melee weapons. Crafted equipment is Uncommon. You can also identify monster equipment in your bag.'},
 {id:'workshop',name:'Elara the Artisan',x:6.5,y:13.5,range:1.5,building:'workshop',npc:{x:6.5,y:12.5,skin:'citizen-female'},skills:['woodworking','cooking','alchemy'],guide:'Cut logs into timber for bows and staves, cook your fish, or brew gathered plants into healing potions. Practice recipes to improve each profession.'},
] as const;
export type CraftingStation=typeof craftingStations[number];
export function canUseCraftingStation(p:{x:number;y:number;region:string},station:CraftingStation,skill?:string){
 if(p.region!=='elderwood'||Math.hypot(p.x-station.x,p.y-station.y)>station.range||(skill&&!station.skills.some(s=>s===skill)))return false;
 if(!station.building)return true;
 const b=villageBuildings.find(b=>b.id===station.building)!;
 return p.x>b.x&&p.x<b.x+b.width&&p.y>b.y&&p.y<b.y+b.height;
}
export const craftingStation=(id:string)=>craftingStations.find(s=>s.id===id);
