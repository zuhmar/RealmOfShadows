import {test} from 'node:test';
import assert from 'node:assert/strict';
import {islandCollision,mapObject,rectangle,type IslandGeometry} from '@realm/game-data';
const geometry:IslandGeometry={rivers:[rectangle(0,40,200,70)],cliffs:[],bridges:[rectangle(70,30,40,100)]};
test('thin props collide with the full footprint, including across spatial bucket boundaries',()=>{
 const collide=islandCollision(200,200,{rivers:[],cliffs:[],bridges:[]},[mapObject('post',63,10,2,25,rectangle(0,0,1,1))]);
 assert.equal(collide(60,20),false);assert.equal(collide(60,20,2),false);assert.equal(collide(60,20,7),true);assert.equal(collide(66,20,4),true);assert.equal(collide(60,20,12),true);
});
test('bridge decks cover wet footprints, including the transition from dry land',()=>{
 const collide=islandCollision(200,200,geometry,[]);assert.equal(collide(90,35,10),false);assert.equal(collide(90,60,10),false);assert.equal(collide(69,60,10),true);assert.equal(collide(40,60,5),true);
});
test('bridge terrain override never removes placed-object collision',()=>{
 const collide=islandCollision(200,200,geometry,[mapObject('crate',88,54,5,8,rectangle(0,0,1,1))]);assert.equal(collide(90,60,10),true);assert.equal(collide(90,90,8),false);
});
