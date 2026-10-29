/** Solid scenic outcrops. Walkable connected highlands are defined separately below. */
export const woodsCliffs=[
 {x:28,y:2,size:5},
 {x:2,y:25,size:4},
 {x:20,y:28,size:4},
 {x:44,y:15,size:4},
 {x:39,y:39,size:4},
 {x:71,y:2,size:4},{x:75,y:2,size:4},
 {x:85,y:38,size:5},{x:89,y:38,size:5},
 {x:3,y:48,size:5},{x:7,y:48,size:5},
 {x:53,y:47,size:5},{x:57,y:47,size:5},
 {x:3,y:63,size:5},{x:44,y:64,size:4},{x:79,y:66,size:4},
] as const;

export const woodsSize={width:96,height:72} as const;
export const woodsRidges=[
 {id:'east',name:'Wolf Ridge',parts:[{x:72,y:6,w:12,h:7},{x:82,y:9,w:8,h:8}],stair:{x:77.5,y:12.5},monsters:'wolf'},
 {id:'south',name:'Silkstone Heights',parts:[{x:20,y:53,w:12,h:7},{x:30,y:55,w:14,h:7}],stair:{x:25.5,y:59.5},monsters:'spider'},
 {id:'quiet',name:'Mosswatch Overlook',parts:[{x:64,y:52,w:9,h:8},{x:71,y:54,w:10,h:6}],stair:{x:68.5,y:59.5},monsters:null},
] as const;
export type WoodsRidge=typeof woodsRidges[number];
export function ridgeCells(ridge:WoodsRidge){const cells=new Set<string>();for(const p of ridge.parts)for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)cells.add(`${x},${y}`);return cells;}
/** Additional surface encounters along the new trails. */
export const woodsExpansionSpawns=[
 ...[[69,23],[78,24],[87,24],[88,32],[77,34],[70,38]].map(([x,y],i)=>({id:`east-wolf-${i+1}`,kind:'wolf' as const,x:x+.5,y:y+.5})),
 ...[[13,51],[13,59],[13,65],[25,65],[39,66],[49,61]].map(([x,y],i)=>({id:`south-spider-${i+1}`,kind:'spider' as const,x:x+.5,y:y+.5})),
 ...[[63,46],[75,44],[86,46],[89,55],[87,64],[56,64]].map(([x,y],i)=>({id:`wild-boar-${i+1}`,kind:'boar' as const,x:x+.5,y:y+.5})),
];
