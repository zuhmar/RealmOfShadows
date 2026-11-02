import {test} from 'node:test';import assert from 'node:assert/strict';
import {gridMap,gridSpawns,portalFor,monsters} from '@realm/game-data';import {legal,pathfind} from '@realm/shared';
import {caveWallEdges,caveCliffTopRect,caveCliffContours} from '../apps/client/src/cave-wall-art';
test('cavern pockets retain equal populations and connect approachable bats to harder galleries',()=>{
 const spawns=gridSpawns('caverns'),arrival=portalFor('caverns').arrival;assert.equal(spawns.length,28);assert.equal(new Set(spawns.map(s=>s.id)).size,28);
 for(const kind of ['bat','crawler','golem','wyrm'])assert.equal(spawns.filter(s=>s.kind===kind).length,kind==='wyrm'?1:9);
 assert.equal([...spawns].sort((a,b)=>Math.hypot(a.x-arrival.x,a.y-arrival.y)-Math.hypot(b.x-arrival.x,b.y-arrival.y))[0].kind,'bat');
 for(const spawn of spawns){assert.ok(legal(spawn,'caverns'),spawn.id);assert.ok(pathfind(arrival,spawn,'caverns').length,spawn.id);assert.ok(Math.hypot(spawn.x-arrival.x,spawn.y-arrival.y)>3.5,spawn.id+' outside sanctuary');}
 const boss=spawns.find(s=>s.kind==='wyrm')!,guards=spawns.filter(s=>s.kind==='golem'&&s.y<25);assert.equal(guards.length,4);
 for(const g of guards)assert.ok(Math.hypot(g.x-boss.x,g.y-boss.y)>monsters.wyrm.detect,'guards do not force boss engagement');
});
test('Wyrm chamber has one connected three-cell entrance and exploration recesses remain reachable',()=>{
 const grid=gridMap('caverns');for(let x=41;x<58;x++)assert.equal(grid.cells[16][x]===5,!(x>=49&&x<=51));
 for(const p of [{x:28.5,y:18.5},{x:24.5,y:41.5},{x:50.5,y:16.5}])assert.ok(pathfind(portalFor('caverns').arrival,p,'caverns').length);
 assert.equal(legal({x:10.5,y:10.5},'caverns'),false);assert.equal(legal({x:52.5,y:32.5},'caverns'),false);
});
test('wall faces follow blocked cells, face all exposed directions and never cover cave floor or water',()=>{
 const shape=[[5,5,5],[5,0,5],[5,5,5]];
 assert.equal(caveWallEdges(shape,1,1),undefined);assert.deepEqual(caveWallEdges(shape,1,0),{north:false,east:false,south:true,west:false});assert.equal(caveWallEdges(shape,0,1)!.east,true);assert.equal(caveWallEdges(shape,2,1)!.west,true);assert.equal(caveWallEdges(shape,1,2)!.north,true);
 for(const region of ['caverns','caverns-depths'] as const){const grid=gridMap(region);let edges=0;for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++){const e=caveWallEdges(grid.cells,x,y);assert.equal(!!e,grid.cells[y][x]===5);if(e&&Object.values(e).some(Boolean))edges++;}assert.ok(edges>100,'continuous wall boundaries exist on both floors');}
});

test('cliff tops share closed outlines across every side, inward turn and isolated outcrop',()=>{
 const shapes=[[[5]],[[5,5],[5,5]],[[5,5,5],[5,0,5],[5,5,5]],[[5,0],[0,5]],gridMap('caverns').cells,gridMap('caverns-depths').cells];
 for(const cells of shapes){let area=0;for(let y=0;y<cells.length;y++)for(let x=0;x<cells[y].length;x++){const r=caveCliffTopRect(cells,x,y);if(r){assert.ok(r.right>r.left&&r.bottom>r.top);area+=(r.right-r.left)*(r.bottom-r.top);}}
  let outlinedArea=0;const contours=caveCliffContours(cells);assert.ok(contours.length>0);
  for(const loop of contours){assert.deepEqual(loop[0],loop.at(-1));for(let i=1;i<loop.length;i++){const a=loop[i-1],b=loop[i];assert.equal(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]),4);outlinedArea+=(a[0]*b[1]-b[0]*a[1])/2;}}
  assert.equal(outlinedArea,area,'closed joins cover the exact top plane, including holes');
 }
});
