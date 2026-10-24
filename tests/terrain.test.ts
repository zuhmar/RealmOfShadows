import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,PORTAL,merchant,elderwoodObjects,elderwoodTerrainGeometry,elderwoodPositionBlocked} from '@realm/game-data';
import {legal,move,pathfind} from '@realm/shared';
const point=(x:number,y:number)=>({x:x/48,y:y/48+4/3});
test('reference village districts, gates, farm, training yard and footbridges stay connected',()=>{
 const destinations=[WORLD.spawn,PORTAL,PORTAL.arrival,merchant,
 ...elderwoodObjects.filter(o=>o.name&&!o.name.includes('stall')).map(o=>point(o.x+o.w/2,o.y+o.h+12)),
 point(400,600),point(200,680),point(1340,185),point(135,500),point(1405,500),point(765,115),point(765,890),point(275,970),point(1182,985),point(700,985)];
 for(const destination of destinations){assert.equal(legal(destination),true,JSON.stringify(destination));const route=pathfind(WORLD.spawn,destination);assert.ok(route.length||destination===WORLD.spawn,JSON.stringify(destination));for(const step of route)assert.equal(legal(step),true);}
});
test('building footprints, tree trunks and fences are solid while canopy overhang and gates stay open',()=>{
 for(const building of elderwoodObjects.filter(o=>o.name&&!o.name.includes('stall'))){const p=point(building.x+building.w/2,building.y+building.h*.75);assert.equal(legal(p),false,building.name);assert.deepEqual(pathfind(WORLD.spawn,p),[]);}
 assert.equal(elderwoodPositionBlocked(point(230,176).x,point(230,176).y),true);
 assert.equal(legal(point(206,125)),true); // Canopy overhang, away from its trunk.
 assert.equal(legal(point(400,845)),false);assert.equal(legal(point(765,845)),true);
});
test('new shoreline blocks walking and sprint without blocking the dry approach',()=>{
 const p={...point(14.2*48,985),stamina:100};assert.equal(legal(p),true);
 for(const sprint of [false,true])assert.equal(move(p,{x:-1,y:0,sprint,seq:1},.05).x,p.x);
 assert.equal(legal(point(640,985)),false);assert.deepEqual(pathfind(WORLD.spawn,point(640,985)),[]);
});
test('all reference bridge decks are walkable and nearby river remains blocked',()=>{
 for(const polygon of elderwoodTerrainGeometry.bridges){const x=polygon.reduce((sum,p)=>sum+p[0],0)/polygon.length,y=polygon.reduce((sum,p)=>sum+p[1],0)/polygon.length;assert.equal(legal(point(x,y)),true,`${x},${y}`);}
 assert.equal(legal(point(45,300)),false);
});
