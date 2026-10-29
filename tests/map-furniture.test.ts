import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {gridMap,buildingVisuals,craftingStations,modularFurniture,furniturePiece} from '@realm/game-data';
test('three connected counter cells wrap each corner NPC without changing authored collision',()=>{
 for(const station of craftingStations){if(!('bench'in station))continue;
 const map=gridMap('elderwood'),before=[...map.blocked],visuals=buildingVisuals('elderwood',map.objects,false),pieces=visuals.filter(o=>o.sourceKey===station.bench.key);
 const bases=pieces.filter(p=>p.key.startsWith('counter-connected-'));assert.equal(bases.length,3);assert.equal(pieces.filter(p=>p.key.startsWith('counter-tools-')).length,1);assert.ok(pieces.some(p=>p.key===`counter-tools-${station.skills[0]}-${station.npc.facing}`));
 const occupiedCells:ReadonlySet<string>=new Set<string>(station.bench.cells.map(([cellX,cellY])=>`${cellX},${cellY}`));
 for(const [x,y]of station.bench.cells){const p=bases.find(p=>p.x===(x-.125)*48&&p.y===(y-.25)*48)!;assert.ok(p);assert.equal(p.w,60);assert.equal(p.h,60);assert.ok(map.blocked.has(`${x},${y}`));
 const mask=Number(p.key.split('-').at(-1));
 for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])assert.equal(!!(mask&bit),occupiedCells.has(`${x+dx},${y+dy}`));
 }
 assert.deepEqual([...map.blocked],before);
 }
});
test('all modular furniture uses one native scale with reusable ends and no interior gaps',()=>{
 for(const region of ['elderwood','elderwood-upper','woods','caverns'])for(const object of gridMap(region).objects){const pieces=modularFurniture(object);if(!pieces)continue;
 for(const [i,p]of pieces.entries()){const square=new URL(`../assets/world/square-props/${p.key}.png`,import.meta.url),file=existsSync(square)?square:new URL(`../assets/world/objects/${p.key}.png`,import.meta.url);assert.ok(existsSync(file),p.key);const data=readFileSync(file);assert.equal(p.w/data.readUInt32BE(16),p.h/data.readUInt32BE(20));assert.equal(p.sourceKey,object.key);if(i&&!object.key.startsWith('craft-bench-'))assert.equal(p.x,pieces[i-1].x+48);}
 }
 for(const corner of ['corner-nw','corner-ne','corner-sw','corner-se'] as const)assert.ok(existsSync(new URL(`../assets/world/objects/${furniturePiece('counter',corner,0,0).key}.png`,import.meta.url)));
});

test('profession items have four separately drawn cardinal views with stable padded canvases',()=>{
 for(const skill of ['blacksmithing','woodworking','cooking','alchemy']){
  const views=['down','left','right','up'].map(facing=>readFileSync(new URL(`../assets/world/objects/counter-tools-${skill}-${facing}.png`,import.meta.url)));
  for(const png of views){assert.equal(png.readUInt32BE(16),64);assert.equal(png.readUInt32BE(20),64);}
  assert.equal(new Set(views.map(png=>png.toString('base64'))).size,4,skill+' needs four distinct images');
 }
});
