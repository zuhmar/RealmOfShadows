/** Same-map, roofless rooms. Walls sit on cell edges; door offsets are south-facing. */
export const villageBuildings=[
 {id:'depot',name:'Depot',x:5,y:2,width:9,height:7,door:3,doorWidth:3},
 {id:'smithy',name:'Smithy',x:22,y:3,width:6,height:5,door:2,doorWidth:2},
 {id:'workshop',name:'Workshop',x:3,y:12,width:6,height:4,door:2,doorWidth:2},
 {id:'bank',name:'Bank',x:23,y:12,width:6,height:4,door:2,doorWidth:2},
 {id:'hall',name:'Hall',x:20,y:18,width:6,height:4,door:2,doorWidth:2},
] as const;
