export type StairFacing='north'|'south'|'east'|'west';
export interface StairGeometry{x:number;y:number;top:{x:number;y:number}}
/** Repeat native cells along the authored climb; never stretch a one-cell staircase. */
export function cliffStairFlight(s:StairGeometry){
 const dx=Math.sign(s.top.x-s.x),dy=Math.sign(s.top.y-s.y),length=Math.max(1,Math.abs(s.top.x-s.x),Math.abs(s.top.y-s.y));
 return Array.from({length},(_,i)=>({x:s.x+dx*i,y:s.y+dy*i,part:length===1?'single' as const:i===0?'bottom' as const:i===length-1?'top' as const:'middle' as const}));
}
