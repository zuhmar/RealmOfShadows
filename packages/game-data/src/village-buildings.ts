/** Same-map room footprints with render-only wall shells and cutaway roofs. Walls sit on cell edges; door offsets are south-facing. */
export const villageBuildings=[
 {id:'depot',name:'Depot',x:5,y:2,width:9,height:7,door:3,doorWidth:3},
 {id:'smithy',name:'Smithy',x:22,y:3,width:6,height:5,door:2,doorWidth:2},
 {id:'workshop',name:'Crafting Hall',x:2,y:12,width:11,height:6,door:4,doorWidth:3},
 {id:'bank',name:'Bank',x:23,y:12,width:6,height:4,door:2,doorWidth:2},
 {id:'hall',name:'Hall',x:20,y:18,width:6,height:4,door:2,doorWidth:2},
] as const;
export const isVillageUpper=(region:string)=>region==='elderwood-upper';
export const buildingsFor=(region:string)=>region==='elderwood'?villageBuildings:isVillageUpper(region)?villageBuildings.filter(b=>b.id==='depot'||b.id==='hall'):[];
export function villageDoors(region:string){return (region==='elderwood'?buildingsFor(region):[]).map(b=>({id:`${region}/${b.id}`,name:b.name,x:b.x+b.door+b.doorWidth/2,y:b.y+b.height-.5,width:b.doorWidth,cells:Array.from({length:b.doorWidth},(_,i)=>`${b.x+b.door+i},${b.y+b.height-1}`)}));}
export function closedVillageDoors(states:Iterable<[string,boolean]>,region:string){const values=new Map(states),result=new Set<string>();for(const d of villageDoors(region))if(values.get(d.id)===false)for(const cell of d.cells)result.add(cell);return result;}

export const isBuildingFloor=(key:string)=>key==='depot-floor'||key==='town-floor-stone';
