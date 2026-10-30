/** The original village is preserved as a 48×40 inset; the new land is outside it. */
export const elderwoodTown={x:28,y:28,width:48,height:40} as const;
export const elderwoodSize={width:104,height:96} as const;
export const townPoint=<T extends {x:number;y:number}>(p:T):T=>({...p,x:p.x+elderwoodTown.x,y:p.y+elderwoodTown.y});
export const elderwoodPortal={...townPoint({x:24.5,y:26.5}),radius:2.5,arrival:townPoint({x:24.5,y:28.5})};
const oldStairs=[
 {id:'north',x:24.5,y:5.5,top:{x:24.5,y:2.5},return:{x:24.5,y:6.5}},
 {id:'south',x:24.5,y:34.5,top:{x:24.5,y:37.5},return:{x:24.5,y:33.5}},
 {id:'west',x:5.5,y:20.5,top:{x:2.5,y:20.5},return:{x:6.5,y:20.5}},
 {id:'east',x:42.5,y:20.5,top:{x:45.5,y:20.5},return:{x:41.5,y:20.5}},
] as const;
export const elderwoodRimStairs=oldStairs.map(s=>({...townPoint(s),top:townPoint(s.top),return:townPoint(s.return)}));
export const onElderwoodRim=(x:number,y:number)=>x>=1&&y>=1&&x<elderwoodSize.width-1&&y<elderwoodSize.height-1&&(x<elderwoodTown.x+3||x>=elderwoodTown.x+45||y<elderwoodTown.y+3||y>=elderwoodTown.y+37);
