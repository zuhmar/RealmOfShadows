/** Shared village plan: grid cells, not sprite pixels. */
export const elderwoodSize={width:48,height:40} as const;
export const elderwoodPortal={x:24.5,y:26.5,radius:2.5,arrival:{x:24.5,y:28.5}};
export const elderwoodRimStairs=[
 {id:'north',x:24.5,y:5.5,top:{x:24.5,y:2.5},return:{x:24.5,y:6.5}},
 {id:'south',x:24.5,y:34.5,top:{x:24.5,y:37.5},return:{x:24.5,y:33.5}},
 {id:'west',x:5.5,y:20.5,top:{x:2.5,y:20.5},return:{x:6.5,y:20.5}},
 {id:'east',x:42.5,y:20.5,top:{x:45.5,y:20.5},return:{x:41.5,y:20.5}},
] as const;
export const onElderwoodRim=(x:number,y:number)=>x>=1&&y>=1&&x<47&&y<39&&(x<3||x>=45||y<3||y>=37);
