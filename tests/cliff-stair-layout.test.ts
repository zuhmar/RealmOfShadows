import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cliffStairFlight} from '../apps/client/src/cliff-stair-layout';
import {elderwoodRimStairs,elderwoodStairTile} from '@realm/game-data';
test('cardinal flights connect the lower approach to the plateau with native contiguous cells',()=>{
 for(const s of elderwoodRimStairs){const flight=cliffStairFlight(s);assert.equal(flight.length,3);assert.deepEqual(flight.map(t=>t.part),['bottom','middle','top']);assert.deepEqual({x:flight[1].x,y:flight[1].y},elderwoodStairTile(s));const dx=Math.sign(s.top.x-s.x),dy=Math.sign(s.top.y-s.y);for(let i=0;i<flight.length;i++)assert.deepEqual({x:flight[i].x,y:flight[i].y},{x:s.x+dx*i,y:s.y+dy*i});assert.equal(flight.at(-1)!.x+dx,s.top.x);assert.equal(flight.at(-1)!.y+dy,s.top.y);}
});
test('taller cliffs repeat middle sections rather than resize artwork; single-cell climbs need one tile',()=>{
 assert.deepEqual(cliffStairFlight({x:.5,y:5.5,top:{x:.5,y:4.5}}).map(t=>t.part),['single']);
 const tall=cliffStairFlight({x:1.5,y:8.5,top:{x:1.5,y:3.5}});assert.equal(tall.length,5);assert.equal(tall.filter(t=>t.part==='middle').length,3);
});
