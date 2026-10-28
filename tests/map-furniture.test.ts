import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {gridMap,buildingVisuals,craftingStations,modularFurniture,furniturePiece} from '@realm/game-data';
test('crafting counters occupy three joined cells exactly over their collision row',()=>{
 for(const station of craftingStations){if(!('bench'in station))continue;
 const map=gridMap('elderwood'),before=[...map.blocked],visuals=buildingVisuals('elderwood',map.objects,false),pieces=visuals.filter(o=>o.sourceKey===station.bench.key).sort((a,b)=>a.x-b.x);
 assert.equal(pieces.length,3);assert.ok(pieces[0].key.endsWith('-start'));assert.ok(pieces[1].key.includes(station.skills[0]));assert.ok(pieces[2].key.endsWith('-end'));
 for(let i=0;i<3;i++){const p=pieces[i];assert.equal(p.w,48);assert.equal(p.h,60);assert.equal(p.x,(station.bench.x+i)*48);assert.equal(p.y,(station.bench.y+station.bench.height-1.25)*48);assert.ok(map.blocked.has(`${station.bench.x+i},${station.bench.y+station.bench.height-1}`));if(i)assert.equal(p.x,pieces[i-1].x+pieces[i-1].w);}
 assert.deepEqual([...map.blocked],before);
 }
});
test('all modular furniture uses one native scale with reusable ends and no interior gaps',()=>{
 for(const region of ['elderwood','elderwood-upper','woods','caverns'])for(const object of gridMap(region).objects){const pieces=modularFurniture(object);if(!pieces)continue;
 for(const [i,p]of pieces.entries()){const file=new URL(`../assets/world/objects/${p.key}.png`,import.meta.url);assert.ok(existsSync(file),p.key);const data=readFileSync(file);assert.equal(p.w/data.readUInt32BE(16),p.h/data.readUInt32BE(20));assert.equal(p.sourceKey,object.key);if(i)assert.equal(p.x,pieces[i-1].x+48);}
 }
 for(const corner of ['corner-nw','corner-ne','corner-sw','corner-se'] as const)assert.ok(existsSync(new URL(`../assets/world/objects/${furniturePiece('counter',corner,0,0).key}.png`,import.meta.url)));
});
