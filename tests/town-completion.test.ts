import {test} from 'node:test';
import assert from 'node:assert/strict';
import {floorConnections,villageDoors,closedVillageDoors,canTravel,portalFor,gridCrossesWall} from '@realm/game-data';
import {toggleVillageDoor,legal,pathfind,move} from '@realm/shared';
test('both upper rooms have legal paired stairs and reachable return stairs without an outdoor shortcut',()=>{
 const up=floorConnections.filter(s=>s.to==='elderwood-upper'&&!s.id.startsWith('home-')&&!s.id.startsWith('elderwood-rim-'));assert.equal(up.length,2);
 for(const s of up){assert.ok(legal(s.arrival,s.to));const down=floorConnections.find(d=>d.from===s.to&&d.to===s.from&&d.x===s.x)!;assert.ok(down);assert.ok(pathfind(s.arrival,{x:down.x,y:down.y+1},s.to).length||Math.hypot(s.arrival.x-down.x,s.arrival.y-down.y-1)<.01);assert.ok(legal(down.arrival,down.to));assert.ok(pathfind(portalFor('elderwood').arrival,down.arrival,'elderwood').length);}
 assert.equal(canTravel(portalFor('elderwood-upper'),'elderwood-upper','woods'),false);assert.equal(canTravel(portalFor('elderwood'),'elderwood','elderwood-upper'),false);assert.equal(legal({x:16.5,y:15.5},'elderwood-upper'),false);
});
test('doors validate range, life, occupants and reserved steps, block movement and routes, and remain room-local',()=>{
 for(const door of villageDoors('elderwood')){
  const states=new Map<string,boolean>(),otherRoom=new Map<string,boolean>(),p={x:door.x-.5,y:door.y+1,region:'elderwood',hp:100};
  assert.match(toggleVillageDoor(states,{...p,x:1,y:1},door.id,[p]),/closer/);assert.match(toggleVillageDoor(states,{...p,hp:0},door.id,[p]),/closer/);assert.match(toggleVillageDoor(states,p,'not-a-door',[p]),/closer/);
  const crossing={...p,x:door.x-.5,y:door.y};assert.match(toggleVillageDoor(states,p,door.id,[p,crossing]),/occupied/);assert.match(toggleVillageDoor(states,p,door.id,[p,{...p,stepX:crossing.x,stepY:crossing.y}]),/occupied/);
  const inside={x:p.x,y:door.y-1};assert.ok(pathfind(p,inside,'elderwood').length);assert.match(toggleVillageDoor(states,p,door.id,[p]),/closed/);const blocked=closedVillageDoors(states,'elderwood');assert.ok(door.cells.every(c=>blocked.has(c)));assert.equal(pathfind(p,inside,'elderwood',blocked).length,0);assert.equal(move({...p,stamina:100},{x:0,y:-1,sprint:false,seq:1},.1,'elderwood',blocked).y,p.y);assert.equal(closedVillageDoors(otherRoom,'elderwood').size,0);assert.equal(closedVillageDoors(states,'woods').size,0);
  assert.match(toggleVillageDoor(states,p,door.id,[p]),/opened/);assert.equal(closedVillageDoors(states,'elderwood').size,0);
 }
});
