import {villageBuildings} from './village-buildings';
import {gridMap,gridCrossesWall,gridSpawns} from './grid-world';
import type {RegionId} from './index';
export const resourceRegions=['elderwood','woods','caverns','swamp','woods-depths','caverns-depths'] as const;
export function resourcePositions(region:RegionId,count:number):{x:number;y:number}[]{
 const map=gridMap(region),lower=region.endsWith('-depths'),arrival=lower?{x:24.5,y:32.5}:region==='woods'?{x:34.5,y:27.5}:region==='caverns'?{x:32.5,y:42.5}:{x:16.5,y:14.5};
 const queue=[arrival],seen=new Set([`${Math.floor(arrival.x)},${Math.floor(arrival.y)}`]);
 for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=queue[i],b={x:a.x+dx,y:a.y+dy},key=`${Math.floor(b.x)},${Math.floor(b.y)}`;if(b.x<1||b.y<1||b.x>=map.width-1||b.y>=map.height-1||seen.has(key)||map.blocked.has(key)||gridCrossesWall(region,a,b))continue;seen.add(key);queue.push(b);}
 const portal=lower?{x:24.5,y:30.5}:region==='woods'?{x:34.5,y:25.5}:region==='caverns'?{x:32.5,y:40.5}:{x:16.5,y:12.5};
 const avoid=[portal,...(region==='elderwood'?[{x:14.5,y:8.5},{x:20.5,y:10.5}]:[]),...(region==='woods'?[{x:34.5,y:12.5}]:region==='caverns'?[{x:32.5,y:23.5}]:[])];
 const monsters=region==='woods'||region==='caverns'||lower?gridSpawns(region):[];
 const entrances=region==='elderwood'?villageBuildings.flatMap(b=>Array.from({length:b.doorWidth},(_,i)=>({x:b.x+b.door+i+.5,y:b.y+b.height+.5}))):[];
 const candidates=queue.filter(p=>p.x>2&&p.y>2&&p.x<map.width-2&&p.y<map.height-2&&!(region==='elderwood'&&p.x>=5&&p.x<=14&&p.y>=2&&p.y<=9)&&entrances.every(a=>Math.hypot(a.x-p.x,a.y-p.y)>1.5)&&avoid.every(a=>Math.hypot(a.x-p.x,a.y-p.y)>3)&&monsters.every(a=>Math.hypot(a.x-p.x,a.y-p.y)>1.5)&&map.cells[Math.floor(p.y)][Math.floor(p.x)]!==4&&!map.objects.some(o=>p.x>o.x/48-.5&&p.x<(o.x+o.w)/48+.5&&p.y>o.y/48-.5&&p.y<(o.y+o.h)/48+.5));
 // Farthest-point sampling spreads all resource kinds through reachable land,
 // including higher-level varieties on beginner maps. No character level filter.
 const result:{x:number;y:number}[]=[];
 for(let i=0;i<count;i++){
  let best:typeof arrival|undefined,score=-1;
  for(const p of candidates){if(result.some(a=>a.x===p.x&&a.y===p.y))continue;const spacing=Math.min(...[...result,...avoid].map(a=>Math.hypot(a.x-p.x,a.y-p.y))),road=map.cells[Math.floor(p.y)][Math.floor(p.x)]===1?.8:1,value=spacing*road;if(value>score){score=value;best=p;}}
  if(!best)throw Error(`Not enough resource locations in ${region}`);result.push(best);
 }
 return result;
}
