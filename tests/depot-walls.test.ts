import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,gridCrossesWall,portalFor} from '@realm/game-data';
import {move,pathfind,legal,sight} from '@realm/shared';
test('Depot uses four distinct directional corner sprites and four edge wall types',()=>{
 const map=gridMap('elderwood'),corners=[['nw',5,2],['ne',13,2],['sw',5,8],['se',13,8]] as const;
 for(const [direction,x,y]of corners){const found=map.objects.filter(o=>o.key===`depot-wall-${direction}`);assert.equal(found.length,1);assert.equal(found[0].x,x*48);assert.equal(found[0].y,y*48);}
 for(const d of ['n','e','s','w'])assert.ok(map.objects.some(o=>o.key===`depot-wall-${d}`));
 assert.ok(!map.objects.some(o=>['depot-wall-h','depot-wall-v','depot-wall-corner'].includes(o.key)));
});
test('floor cells against the wall remain usable; only crossing the perimeter is blocked',()=>{
 for(const p of [{x:5.5,y:5.5},{x:13.5,y:5.5},{x:6.5,y:2.5},{x:6.5,y:8.5}])assert.ok(legal(p));
 for(const [a,b]of [[{x:4.5,y:5.5},{x:5.5,y:5.5}],[{x:13.5,y:5.5},{x:14.5,y:5.5}],[{x:6.5,y:1.5},{x:6.5,y:2.5}],[{x:6.5,y:8.5},{x:6.5,y:9.5}]] as const){
  assert.ok(gridCrossesWall('elderwood',a,b));assert.ok(gridCrossesWall('elderwood',b,a));assert.equal(sight(a,b,'elderwood'),false);
  const next=move({...a,stamina:100},{x:b.x-a.x,y:b.y-a.y,sprint:true,seq:1},.05);assert.equal(next.x,a.x);assert.equal(next.y,a.y);
 }
 const route=pathfind(portalFor('elderwood').arrival,{x:5.5,y:5.5});assert.ok(route.length);let previous=portalFor('elderwood').arrival;for(const p of route){assert.equal(gridCrossesWall('elderwood',previous,p),false);previous=p;}
 assert.ok(route.some(p=>p.y===9.5&&p.x>=8.5&&p.x<=10.5));
});
test('doorway stays open and diagonals cannot cut wall corners or door jambs',()=>{
 for(const x of [8.5,9.5,10.5])assert.equal(gridCrossesWall('elderwood',{x,y:8.5},{x,y:9.5}),false);
 for(const [a,b]of [[{x:4.5,y:1.5},{x:5.5,y:2.5}],[{x:13.5,y:8.5},{x:14.5,y:9.5}],[{x:7.5,y:9.5},{x:8.5,y:8.5}]] as const)assert.ok(gridCrossesWall('elderwood',a,b));
 assert.equal(gridCrossesWall('elderwood',{x:8.5,y:9.5},{x:9.5,y:8.5}),false);
 assert.equal(legal({x:5.05,y:5.5}),false,'actor footprint cannot overlap the edge wall');
});
