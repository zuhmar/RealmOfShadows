import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,PORTAL,gridMap,villageBuildings,elderwoodSize,elderwoodRimStairs,stairsFor,onElderwoodRim,depotBoxes,craftingStations,resourceNodes} from '@realm/game-data';
import {legal,pathfind} from '@realm/shared';
test('the doubled central Depot, one-cell southern portal and four corner buildings are connected',()=>{
 const depot=villageBuildings.find(b=>b.id==='depot')!,map=gridMap('elderwood');assert.equal(depot.width*depot.height,9*7*2);assert.equal(depot.x+depot.width/2,elderwoodSize.width/2);assert.ok(Math.abs(depot.y+depot.height/2-elderwoodSize.height/2)<=1);
 const portal=map.objects.find(o=>o.key==='elderwood-portal')!;assert.equal(portal.w,48);assert.equal(portal.h,48);assert.ok(PORTAL.y>depot.y+depot.height);assert.equal(PORTAL.x,depot.x+depot.door+depot.doorWidth/2);
 for(const b of villageBuildings.filter(b=>b.id!=='depot'))assert.ok((b.x<12||b.x>30)&&(b.y<12||b.y>26),b.id+' corner');
 for(const p of [PORTAL,...depotBoxes.map(b=>({x:b.x,y:b.y+1})),...craftingStations])assert.ok(pathfind(WORLD.spawn,p).length,JSON.stringify(p));assert.equal(resourceNodes.filter(n=>n.region==='elderwood').length,0);
});
test('four cardinal stairs climb to one connected, bounded cliff walk and return to town',()=>{
 assert.equal(elderwoodRimStairs.length,4);const first=elderwoodRimStairs[0].top;
 for(const s of elderwoodRimStairs){const up=stairsFor('elderwood').find(r=>r.id===`elderwood-rim-${s.id}-up`)!,down=stairsFor('elderwood-upper').find(r=>r.id===`elderwood-rim-${s.id}-down`)!;
 assert.ok(pathfind(WORLD.spawn,up).length,s.id+' approach');assert.ok(legal(up.arrival,up.to));assert.ok(legal(down.arrival,down.to));assert.ok(pathfind(first,s.top,'elderwood-upper').length||s.id==='north');assert.ok(onElderwoodRim(Math.floor(s.top.x),Math.floor(s.top.y)));}
 assert.equal(legal({x:.5,y:20.5},'elderwood-upper'),false);assert.equal(legal({x:3.5,y:20.5},'elderwood-upper'),false,'rim cannot fall into town');
});
