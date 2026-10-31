export type WindowSide='n'|'s'|'w'|'e';
export interface WindowAnchor{x:number;y:number;side:WindowSide;building:string;kind:'village'|'house';region:string}
/** Even spacing across a facade, rather than a window on every wall panel. */
export function selectWindowPanels<T>(panels:readonly T[],budget?:number):Set<T>{
 const count=Math.min(panels.length,budget??Math.min(4,Math.max(2,Math.floor(panels.length/4))));
 return new Set(Array.from({length:count},(_,i)=>panels[Math.floor((i+1)*panels.length/(count+1))]));
}
/** Local visual reveal only; windows do not change doors, collision or line of sight. */
export function nearBuildingWindow(p:{x:number;y:number},region:string,w:WindowAnchor){
 if(region!==w.region||Math.hypot(p.x-w.x,p.y-w.y)>1.25)return false;
 return w.side==='n'?p.y<w.y:w.side==='s'?p.y>w.y:w.side==='w'?p.x<w.x:p.x>w.x;
}
