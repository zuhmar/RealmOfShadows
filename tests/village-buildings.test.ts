import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,gridCrossesWall,portalFor,villageBuildings,resourceNodes} from '@realm/game-data';
import {legal,pathfind} from '@realm/shared';
test('every active Elderwood building has reachable open doors and boundary walls on all four sides',()=>{
 const map=gridMap('elderwood'),arrival=portalFor('elderwood').arrival;
 for(const b of villageBuildings){
  const inside={x:b.x+b.door+.5,y:b.y+b.height-1.5},outside={x:inside.x,y:b.y+b.height+.5};
  assert.ok(legal(inside),b.id+' interior');assert.ok(legal(outside),b.id+' outside');assert.ok(pathfind(arrival,inside).length,b.id+' reachable from portal');
  for(const node of resourceNodes.filter(n=>n.region==='elderwood'))for(let offset=0;offset<b.doorWidth;offset++)assert.ok(Math.hypot(node.x-(outside.x+offset),node.y-outside.y)>1.5,b.id+' entrance clear of gathering nodes');
  for(let offset=0;offset<b.doorWidth;offset++)assert.equal(gridCrossesWall('elderwood',{x:b.x+b.door+offset+.5,y:b.y+b.height-.5},{x:b.x+b.door+offset+.5,y:b.y+b.height+.5}),false,b.id+' doorway');
  for(const [a,z]of [[{x:b.x-.5,y:b.y+1.5},{x:b.x+.5,y:b.y+1.5}],[{x:b.x+b.width-.5,y:b.y+1.5},{x:b.x+b.width+.5,y:b.y+1.5}],[{x:b.x+1.5,y:b.y-.5},{x:b.x+1.5,y:b.y+.5}],[{x:b.x+.5,y:b.y+b.height-.5},{x:b.x+.5,y:b.y+b.height+.5}]])assert.ok(gridCrossesWall('elderwood',a,z),b.id+' wall');
  assert.equal(map.objects.filter(o=>o.key==='depot-floor'&&o.x>=b.x*48&&o.x<(b.x+b.width)*48&&o.y>=b.y*48&&o.y<(b.y+b.height)*48).length,b.width*b.height,b.id+' tiled floor');
 }
 assert.ok(!map.objects.some(o=>['elderwood-blacksmith','elderwood-workshop','elderwood-bank','elderwood-hall','elderwood-tavern'].includes(o.key)));
});
