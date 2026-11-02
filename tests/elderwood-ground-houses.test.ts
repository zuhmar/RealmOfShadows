import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {playerHouses,cliffPlayerHouses,groundPlayerHouses,houseBaseRegion,houseAt,houseDisplayTiles,emptyHouse,gridMap,gridCrossesWall,portalFor,storyNpcs,villageBuildings,insideBuilding,onElderwoodLowland,elderwoodRimStairs,elderwoodStairTile} from '@realm/game-data';
import {legal,pathfind,Economy,newFighter,planHousing} from '@realm/shared';
import {database,userA} from './fixtures/supabase';
test('ten main-floor homes extend the thirty-house catalog with reachable one-door interiors',()=>{
 assert.equal(playerHouses.length,30);assert.equal(cliffPlayerHouses.length,20);assert.equal(groundPlayerHouses.length,10);assert.equal(new Set(playerHouses.map(h=>h.id)).size,30);
 for(const h of groundPlayerHouses){assert.equal(houseBaseRegion(h),'elderwood');assert.equal(h.floors.length,1);const outside={x:h.door.x,y:h.door.y+1};assert.ok(pathfind(portalFor('elderwood').arrival,outside,'elderwood').length,h.id);assert.equal(gridCrossesWall('elderwood',outside,h.door),false);
  for(const room of h.floors[0])for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++){const p={x:x+.5,y:y+.5,region:'elderwood'};assert.ok(onElderwoodLowland(x,y));assert.ok(legal(p,'elderwood'));assert.equal(houseAt(p)?.id,h.id);}
  for(const tile of houseDisplayTiles(h,0))assert.ok(pathfind(h.door,tile,'elderwood').length,h.id+' display access');
 }
});
test('all four class mentors share the accessible Class Hall, with no blocked NPC cells',()=>{
 const hall=villageBuildings.find(b=>b.id==='hall')!;assert.equal(hall.name,'Class Hall');for(const id of ['aldren','lyra','selene','corvin']){const npc=storyNpcs.find(n=>n.id===id)!;assert.ok(insideBuilding(npc,hall));assert.ok(legal(npc,'elderwood'));assert.ok(pathfind(portalFor('elderwood').arrival,npc,'elderwood').length,id);}
});
test('the lower cliff contour varies and cardinal stairs use the same physical upper tile',()=>{
 const left=new Set<number>();for(let y=31;y<=70;y++){const x=Array.from({length:104},(_,x)=>x).find(x=>onElderwoodLowland(x,y));if(x!==undefined)left.add(x);}assert.ok(left.size>=5);
 for(const s of elderwoodRimStairs){assert.ok(legal(s,'elderwood'));assert.ok(legal(s.return,'elderwood'));assert.ok(legal(elderwoodStairTile(s),'elderwood-upper'));assert.ok(legal(s.top,'elderwood-upper'));}
});
test('ground-house purchases and item displays use the existing ownership checks on the ground floor',()=>{
 const e=new Economy();e.join('p');const p=e.profiles.get('p')!;p.gold=5000;p.inventory=[{id:1,item:'potion',quantity:2}];const h=groundPlayerHouses[0],actor={...newFighter(),region:'elderwood' as const,x:h.door.x,y:h.door.y+1};const bought=planHousing(p,actor,emptyHouse(h.id),'owner','Hero',{kind:'buy',house:h.id});assert.ok(typeof bought!=='string');if(typeof bought==='string')return;assert.equal(bought.profile.gold,5000-h.price);const tile=houseDisplayTiles(h,0)[0],placed=planHousing(bought.profile,{...actor,...tile},bought.house,'owner','Hero',{kind:'place',house:h.id,floor:0,...tile,category:'supply',item:'1'});assert.ok(typeof placed!=='string');if(typeof placed==='string')return;assert.equal(placed.house.displays.length,1);assert.equal(placed.profile.inventory[0].quantity,1);assert.match(String(planHousing(placed.profile,{...actor,...tile},placed.house,'outsider','Other',{kind:'take',house:h.id,floor:0,...tile})),/Only the owner/);
});
test('the new house migration is idempotent and preserves existing owners, displays and prices',async()=>{
 const db=await database();try{await db.query("update public.player_houses set owner_id=$1,owner_name='Hero',revision=7 where id='briar'",[userA]);const before=await db.query("select * from public.player_houses where id='briar'");const sql=await readFile(new URL('../supabase/migrations/202611020001_ground_houses.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);const after=await db.query("select * from public.player_houses where id='briar'");assert.deepEqual(after.rows,before.rows);const rows=await db.query<{id:string;price:number;layout_version:number}>('select id,price,layout_version from public.player_houses');assert.equal(rows.rows.length,30);for(const h of groundPlayerHouses){const row=rows.rows.find(r=>r.id===h.id)!;assert.equal(row.price,h.price);assert.equal(row.layout_version,2);}}finally{await db.close();}
});
