import {mapObject,type IslandObject} from './island-layout';
export const fenceDirections=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]] as const;
export function fenceMask(cells:ReadonlySet<string>,x:number,y:number){return fenceDirections.reduce((mask,[dx,dy,bit])=>mask|(cells.has(`${x+dx},${y+dy}`)?bit:0),0);}
export const isMapFence=(key:string)=>key.startsWith('map-fence-')||key==='elderwood-fence-h'||key==='elderwood-fence-v';
/** Existing long fence footprints become connected native cells, without changing collision. */
export function connectedFenceVisuals(objects:readonly IslandObject[]){const cells=new Set<string>();for(const o of objects)if(isMapFence(o.key)&&o.footprint){const f=o.footprint;for(let y=f.y;y<f.y+f.height;y++)for(let x=f.x;x<f.x+f.width;x++)cells.add(`${x},${y}`);}return [...cells].map(k=>{const[x,y]=k.split(',').map(Number);return{...mapObject(`map-fence-${fenceMask(cells,x,y)}`,x*48,y*48,48,48),footY:(y+.9)*48};});}
