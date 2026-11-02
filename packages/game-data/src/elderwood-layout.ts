/** The original village is preserved as a 48×40 inset; the new land is outside it. */
export const elderwoodTown={x:28,y:28,width:48,height:40} as const;
export const elderwoodSize={width:104,height:96} as const;
export const townPoint=<T extends {x:number;y:number}>(p:T):T=>({...p,x:p.x+elderwoodTown.x,y:p.y+elderwoodTown.y});
export const elderwoodPortal={...townPoint({x:24.5,y:26.5}),radius:2.5,arrival:townPoint({x:24.5,y:28.5})};
export const elderwoodRimStairs=[
 {id:'north',x:52.5,y:31.5,top:{x:52.5,y:28.5},return:{x:52.5,y:32.5}},
 {id:'south',x:52.5,y:65.5,top:{x:52.5,y:68.5},return:{x:52.5,y:64.5}},
 {id:'west',x:20.5,y:48.5,top:{x:17.5,y:48.5},return:{x:21.5,y:48.5}},
 {id:'east',x:82.5,y:48.5,top:{x:85.5,y:48.5},return:{x:81.5,y:48.5}},
] as const;
/** A scalloped lower village, including the two ground-floor housing bays. */
export function onElderwoodLowland(x:number,y:number){
 if(x>=33&&x<=70&&y>=33&&y<=62)return true;
 if(x>=39&&x<=64&&y>=31&&y<=32)return true;
 if(x>=36&&x<=66&&y>=63&&y<=65)return true;
 if(y<31||y>70)return false;
 const left=y<=33?24:y<=36?21:y<=66?20:y<=69?22:25,right=y<=33?78:y<=36?81:y<=66?82:y<=69?80:77;
 return x>=left&&x<=32||x>=71&&x<=right;
}
export function elderwoodCliffDistance(x:number,y:number){
 if(onElderwoodLowland(x,y))return 0;
 for(let d=1;d<=2;d++)for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++)if(onElderwoodLowland(x+dx,y+dy))return d;
 return 3;
}
/** Stepped headlands and shallow inlets; housing and the original town remain inland. */
export function onElderwoodLand(x:number,y:number){
 const notch=(value:number,centers:number[])=>{const d=Math.min(...centers.map(c=>Math.abs(value-c)));return d<3?Math.round((3-d)*2.5):0;};
 const north=[5,3,2,4,2,3,5,2,4,3,5,4,5][Math.min(12,Math.max(0,Math.floor(x/8)))];
 const south=[5,4,2,3,4,2,3,5,3,2,4,3,5][Math.min(12,Math.max(0,Math.floor(x/8)))];
 const west=[5,4,3,2,4,3,2,4,2,3,4,5][Math.min(11,Math.max(0,Math.floor(y/8)))];
 const east=[5,3,4,2,3,4,2,3,4,2,3,5][Math.min(11,Math.max(0,Math.floor(y/8)))];
 const northBay=notch(x,[21,39,57,75,94]),southBay=notch(x,[21,39,57,75]),sideBay=notch(y,[33,44,57,70]);
 const cx=Math.min(x,elderwoodSize.width-1-x),cy=Math.min(y,elderwoodSize.height-1-y);return x>=west+sideBay&&x<elderwoodSize.width-east-sideBay&&y>=north+northBay&&y<elderwoodSize.height-south-southBay&&!(cx<12&&cy<12&&Math.hypot(12-cx,12-cy)>11);
}
export const onElderwoodRim=(x:number,y:number)=>onElderwoodLand(x,y)&&elderwoodCliffDistance(x,y)===3;

/** Shared physical stair cell: artwork, upper arrival and descent use this location. */
export function elderwoodStairTile(s:typeof elderwoodRimStairs[number]){
 const dx=Math.sign(s.top.x-s.x),dy=Math.sign(s.top.y-s.y);
 return {x:s.x+dx,y:s.y+dy};
}
