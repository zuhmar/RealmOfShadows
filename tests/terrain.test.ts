import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,PORTAL,merchant,landmarks,elderwoodGround,elderwoodPonds,blocked} from '@realm/game-data';
import {legal,move,pathfind} from '@realm/shared';
test('every water tile is blocked and ponds never overlap roads, plaza or buildings',()=>{
 let water=0;
 for(let y=0;y<WORLD.height;y++)for(let x=0;x<WORLD.width;x++){
 const inside=elderwoodPonds.some(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h);
 if(!inside)continue;water++;assert.equal(elderwoodGround(x,y),'water');assert.equal(blocked(x,y,'elderwood'),true);assert.equal(legal({x:x+.5,y:y+.5},'elderwood'),false);
 assert.ok(Math.abs(x-16)>=2&&Math.abs(y-13)>=2);assert.ok(!(Math.abs(x-16)<=3&&Math.abs(y-13)<=3));assert.ok(!landmarks.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h));
 }
 assert.equal(water,21);assert.equal(legal(WORLD.spawn),true);assert.equal(legal(PORTAL.arrival),true);assert.ok(pathfind(PORTAL.arrival,merchant).length);
});
test('shared movement blocks all pond edges and pathfinding routes around water',()=>{
 for(const pond of elderwoodPonds){
 for(const [x,y,dx,dy] of [[pond.x-.25,pond.y+.5,1,0],[pond.x+pond.w+.25,pond.y+.5,-1,0],[pond.x+.5,pond.y-.25,0,1],[pond.x+.5,pond.y+pond.h+.25,0,-1]]){
 const p={x,y,stamina:100};assert.equal(legal(p),true);const next=move(p,{x:dx,y:dy,sprint:false,seq:1},.05);assert.equal(next.x,p.x);assert.equal(next.y,p.y);
 }
 const start={x:pond.x-.5,y:pond.y+.5},end={x:pond.x+pond.w+.5,y:pond.y+.5};const route=pathfind(start,end);assert.ok(route.length);assert.ok(route.every(p=>legal(p)&&elderwoodGround(Math.floor(p.x),Math.floor(p.y))!=='water'));assert.deepEqual(pathfind(start,{x:pond.x+.5,y:pond.y+.5}),[]);
 }
});
