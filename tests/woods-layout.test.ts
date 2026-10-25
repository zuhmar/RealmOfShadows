const PORTAL=portalFor('woods');
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {woodsHabitats,woodsEncounterSpawns,woodsTrails,woodsSpawnTrails,woodsBossBoundary,woodsMap,portalFor,monsters,weapons,monsterSpawns} from '@realm/game-data';
import {pathfind,legal,sight,move,attackPath} from '@realm/shared';
const world=(x:number,y:number)=>({x:x/48,y:y/48+woodsMap.offsetY});
test('normal habitats have equal sizes and populations, with a painted access trail to every pocket',()=>{
 const normal=woodsHabitats.filter(h=>h.kind!=='bear');for(const h of normal){assert.deepEqual([h.rx,h.ry],[360,240]);const spawns=woodsEncounterSpawns.filter(s=>s.kind===h.kind&&s.area==='habitat');assert.equal(spawns.length,6);
 for(const s of spawns){assert.ok([...woodsTrails,...woodsSpawnTrails].some(t=>t.some(([x,y])=>x===s.x&&y===s.y)),s.id);assert.ok(pathfind(PORTAL.arrival,world(s.x,s.y),'woods').length,s.id);}}
 const wolf=normal.find(h=>h.kind==='wolf')!,spider=normal.find(h=>h.kind==='spider')!;assert.ok(spider.y-spider.ry>wolf.y+wolf.ry+500);
});
test('boss enclosure has solid sides and floor, a single northern approach and blocked wall sightlines',()=>{
 const b=woodsBossBoundary,center=world((b.left+b.right)/2,(b.top+b.bottom)/2),gate=world((b.gateLeft+b.gateRight)/2,b.top+b.thickness/2);
 assert.ok(legal(gate,'woods'));for(const [x,y]of [[b.left+b.thickness/2,1590],[b.right-b.thickness/2,1590],[2600,b.bottom-b.thickness/2],[2300,b.top+b.thickness/2]])assert.ok(!legal(world(x,y),'woods'));
 assert.ok(!sight(world(b.left-30,1590),center));const outside=world(b.left-15,1590),blocked=move({...outside,stamina:100},{x:1,y:0,sprint:false,seq:1},.05,'woods');assert.equal(blocked.x,outside.x);
 const route=pathfind(PORTAL.arrival,center,'woods');assert.ok(route.length);const crossing=route.filter(p=>p.x*48>=b.left&&p.x*48<=b.right&&Math.abs((p.y-woodsMap.offsetY)*48-(b.top+b.thickness/2))<28);assert.ok(crossing.length);for(const p of crossing)assert.ok(p.x*48>b.gateLeft&&p.x*48<b.gateRight);
});

test('ranged boss approach enters the gate and encounter leash before settling into combat',()=>{
 const boss=monsterSpawns.find(s=>s.kind==='bear')!,range=Math.min(weapons.wand.range,monsters.bear.leash-.5),route=attackPath(world(2600,1180),boss,range),last=route.at(-1)!;
 assert.ok(last);assert.ok(Math.hypot(last.x-boss.x,last.y-boss.y)<monsters.bear.leash);assert.ok(sight(last,boss));assert.ok(last.y>world(2600,woodsBossBoundary.top+woodsBossBoundary.thickness).y);
});
