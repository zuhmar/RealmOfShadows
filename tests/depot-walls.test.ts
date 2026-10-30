import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,gridCrossesWall,portalFor} from '@realm/game-data';
import {move,pathfind,legal,sight} from '@realm/shared';
test('Depot uses four distinct directional corner sprites and four edge wall types',()=>{
 const map=gridMap('elderwood'),corners=[['nw',17,15],['ne',30,15],['sw',17,23],['se',30,23]] as const;
 for(const [direction,x,y]of corners){const found=map.objects.filter(o=>o.key===`depot-wall-${direction}`);assert.equal(found.length,1);assert.equal(found[0].x,x*48);assert.equal(found[0].y,y*48);}
 for(const d of ['n','e','s','w'])assert.ok(map.objects.some(o=>o.key===`depot-wall-${d}`));
 assert.ok(!map.objects.some(o=>['depot-wall-h','depot-wall-v','depot-wall-corner'].includes(o.key)));
});
test('floor cells against the wall remain usable; only crossing the perimeter is blocked',()=>{
 for(const p of [{x:17.5,y:18.5},{x:30.5,y:18.5},{x:18.5,y:15.5},{x:21.5,y:23.5}])assert.ok(legal(p));
 for(const [a,b]of [[{x:16.5,y:18.5},{x:17.5,y:18.5}],[{x:30.5,y:18.5},{x:31.5,y:18.5}],[{x:18.5,y:14.5},{x:18.5,y:15.5}],[{x:21.5,y:23.5},{x:21.5,y:24.5}]] as const){
  assert.ok(gridCrossesWall('elderwood',a,b));assert.ok(gridCrossesWall('elderwood',b,a));assert.equal(sight(a,b,'elderwood'),false);
  const next=move({...a,stamina:100},{x:b.x-a.x,y:b.y-a.y,sprint:true,seq:1},.05);assert.equal(next.x,a.x);assert.equal(next.y,a.y);
 }
 const route=pathfind(portalFor('elderwood').arrival,{x:17.5,y:18.5});assert.ok(route.length);let previous=portalFor('elderwood').arrival;for(const p of route){assert.equal(gridCrossesWall('elderwood',previous,p),false);previous=p;}
 assert.ok(route.some(p=>p.y===24.5&&p.x>=23.5&&p.x<=25.5));
});
test('doorway stays open and diagonals cannot cut wall corners or door jambs',()=>{
 for(const x of [23.5,24.5,25.5])assert.equal(gridCrossesWall('elderwood',{x,y:23.5},{x,y:24.5}),false);
 for(const [a,b]of [[{x:16.5,y:14.5},{x:17.5,y:15.5}],[{x:30.5,y:23.5},{x:31.5,y:24.5}],[{x:22.5,y:24.5},{x:23.5,y:23.5}]] as const)assert.ok(gridCrossesWall('elderwood',a,b));
 assert.equal(gridCrossesWall('elderwood',{x:23.5,y:24.5},{x:24.5,y:23.5}),false);
 assert.equal(legal({x:17.05,y:18.5}),false,'actor footprint cannot overlap the edge wall');
});
