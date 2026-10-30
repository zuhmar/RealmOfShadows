import {townPoint,elderwoodTown} from '@realm/game-data';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,portalFor,resourceNodes,gridSpawns} from '@realm/game-data';
import {legal,pathfind} from '@realm/shared';
test('Elderwood garden, workyard and pond walk have open approaches and solid fences',()=>{
 const map=gridMap('elderwood'),arrival=portalFor('elderwood').arrival;
 for(const goal of [townPoint({x:18.5,y:9.5}),townPoint({x:18.5,y:11.5}),townPoint({x:18.5,y:12.5}),townPoint({x:12.5,y:13.5}),townPoint({x:7.5,y:24.5})]){assert.ok(legal(goal),JSON.stringify(goal));assert.ok(pathfind(arrival,goal).length,JSON.stringify(goal)+' reachable');}
 for(const p of [townPoint({x:16.5,y:9.5}),townPoint({x:20.5,y:9.5}),townPoint({x:18.5,y:7.5})])assert.equal(legal(p),false,'garden fence blocks movement');
 assert.ok(map.objects.some(p=>p.key==='furn-chest-left'));assert.ok(map.objects.some(p=>p.key==='elderwood-fence-h'));
 assert.equal(resourceNodes.filter(n=>n.region==='elderwood').length,0,'town remains fishing-only');
 for(let y=19;y<25;y++)for(let x=37;x<38;x++)assert.equal(map.cells[y+elderwoodTown.y][x+elderwoodTown.x],4,'continuous timber crossing');
});
test('scattered forest trees leave all encounter routes and portal/stair connections open',()=>{
 const map=gridMap('woods'),trees=map.objects.filter(o=>o.key==='woods-oak'||o.key==='woods-pine');
 assert.ok(trees.length>=50);assert.ok(new Set(trees.map(t=>t.x/48%3)).size===3,'tree positions are not fixed rows');
 for(const spawn of gridSpawns('woods'))assert.ok(pathfind(portalFor('woods').arrival,spawn,'woods').length,spawn.id);
 const before=[...map.blocked];gridMap('woods');assert.deepEqual([...map.blocked],before,'layout is stable across reads');
});

test('weathered Woods trails retain a connected marked route to every approach encounter',()=>{
 const map=gridMap('woods'),start=portalFor('woods').arrival,queue:[number,number][]=[[Math.floor(start.x),Math.floor(start.y)]],seen=new Set<string>(queue.map(([x,y])=>`${x},${y}`));
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(seen.has(key)||![1,2,4].includes(map.cells[ny]?.[nx]))continue;seen.add(key);queue.push([nx,ny]);}}
 for(const s of gridSpawns('woods')){const x=Math.floor(s.x),y=Math.floor(s.y);if(map.cells[y][x]===1)assert.ok(seen.has(`${x},${y}`),s.id+' follows connected dirt/stone/bridge');}
});
