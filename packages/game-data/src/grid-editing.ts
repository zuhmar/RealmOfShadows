import sizes from './map-prop-sizes.json';
import {mapObject,type IslandObject} from './island-layout';
export interface EditorProp{key:string;x:number;y:number;w:number;h:number;solidW:number;solidH:number}
export interface EditorSpawn{id:string;kind:'wolf'|'spider'|'boar'|'bear'|'bat'|'crawler'|'golem'|'wyrm';x:number;y:number}
export interface GridEdits{cells?:number[][];props?:EditorProp[];removedProps?:string[];spawns?:EditorSpawn[];removedSpawns?:string[]}
export interface GridDocument{version:2;maps:Record<string,GridEdits>}
export const editorPropKeys=Object.keys(sizes).filter(k=>!/(portal|stairs|depot|craft-bench|house-|roof-|town-|village-)/.test(k));
export const propIdentity=(p:Pick<IslandObject,'key'|'x'|'y'>)=>`${p.key}@${p.x},${p.y}`;
export const editableProp=(p:Pick<IslandObject,'key'>)=>editorPropKeys.includes(p.key)&&!p.key.startsWith('furn-');
export function editorObject(p:EditorProp):IslandObject{const o=mapObject(p.key,p.x*48,p.y*48,p.w*48,p.h*48);if(p.solidW&&p.solidH)o.footprint={x:p.x,y:p.y+p.h-p.solidH,width:p.solidW,height:p.solidH};return o;}
export function validateGridEdits(raw:unknown,width:number,height:number):GridEdits{
 const fail=():never=>{throw Error('Invalid map edit: check terrain dimensions, prop bounds and spawn positions.');};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return fail();const d=raw as GridEdits;
 const integer=(v:number,min:number,max:number)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(d.cells!==undefined&&(!Array.isArray(d.cells)||d.cells.length!==height||d.cells.some(r=>!Array.isArray(r)||r.length!==width||r.some(n=>!integer(n,0,5)))))fail();
 for(const ids of [d.removedProps,d.removedSpawns])if(ids!==undefined&&(!Array.isArray(ids)||ids.length>3000||ids.some(id=>typeof id!=='string'||id.length>150)))fail();
 if(d.props!==undefined&&(!Array.isArray(d.props)||d.props.length>2000||d.props.some(p=>!p||!editorPropKeys.includes(p.key)||!integer(p.x,1,width-2)||!integer(p.y,1,height-2)||!integer(p.w,1,12)||!integer(p.h,1,12)||p.x+p.w>width-1||p.y+p.h>height-1||!integer(p.solidW,0,p.w)||!integer(p.solidH,0,p.h))))fail();
 if(d.spawns!==undefined&&(!Array.isArray(d.spawns)||d.spawns.length>500||d.spawns.some(p=>!p||!/^editor-[a-z0-9-]{1,90}$/.test(p.id)||!['wolf','spider','boar','bear','bat','crawler','golem','wyrm'].includes(p.kind)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x%1!==.5||p.y%1!==.5||p.x<1||p.y<1||p.x>=width-1||p.y>=height-1)||new Set(d.spawns.map(p=>p.id)).size!==d.spawns.length))fail();
 return structuredClone(d);
}
export function applyPropEdits(objects:IslandObject[],blocked:Set<string>,edit:GridEdits){
 const removed=new Set(edit.removedProps??[]),next=objects.filter(o=>!editableProp(o)||!removed.has(propIdentity(o)));
 for(const o of objects)if(o.footprint){const f=o.footprint;for(let y=f.y;y<f.y+f.height;y++)for(let x=f.x;x<f.x+f.width;x++)blocked.delete(`${x},${y}`);}
 next.push(...(edit.props??[]).map(editorObject));
 for(const o of next)if(o.footprint){const f=o.footprint;for(let y=f.y;y<f.y+f.height;y++)for(let x=f.x;x<f.x+f.width;x++)blocked.add(`${x},${y}`);}
 objects.splice(0,objects.length,...next);
}
