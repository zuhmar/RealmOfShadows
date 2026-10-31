import {test} from 'node:test';import assert from 'node:assert/strict';
import {gridMap,gridCrossesWall,playerHouses,elderwoodRimStairs,elderwoodStairTile,neighborhoodPlaces} from '@realm/game-data';
import {legal,pathfind} from '@realm/shared';
test('compact housing lanes connect all twenty doors and the new public spaces without crossing grass',()=>{
 const region='elderwood-upper',m=gridMap(region),start=elderwoodStairTile(elderwoodRimStairs[0]),seen=new Set<string>(),queue=[[Math.floor(start.x),Math.floor(start.y)]];
 for(let i=0;i<queue.length;i++){const[x,y]=queue[i],key=`${x},${y}`;if(seen.has(key)||m.cells[y]?.[x]!==2||m.blocked.has(key))continue;seen.add(key);for(const[dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])if(!gridCrossesWall(region,{x:x+.5,y:y+.5},{x:x+dx+.5,y:y+dy+.5}))queue.push([x+dx,y+dy]);}
 for(const h of playerHouses)assert.ok(seen.has(`${Math.floor(h.door.x)},${Math.floor(h.door.y)+1}`),h.id+' paved doorstep');
 for(const p of neighborhoodPlaces){assert.ok(seen.has(`${p.entry.x},${p.entry.y}`),p.name+' connected entry');const center={x:p.x+Math.floor(p.w/2)+.5,y:p.y+Math.floor(p.h/2)+.5};assert.ok(legal(center,region),p.name+' usable center');assert.ok(pathfind(start,center,region).length,p.name+' reachable');}
 assert.equal(m.cells[15][9],2,'one-cell cottage lane');assert.equal(m.cells[15][8],0,'grass restored beside narrow lane');assert.equal(m.cells[21][35],2);assert.equal(m.cells[22][35],2);assert.equal(m.cells[20][35],0,'two-cell promenade');
 for(const name of ['North Well Court','Picnic table','Flower walk bench'])assert.ok(m.objects.some(o=>o.name===name),name+' placed');
});
