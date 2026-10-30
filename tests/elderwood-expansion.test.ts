import {test} from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {readFile} from 'node:fs/promises';
import {elderwoodTown,elderwoodSize,gridMap,playerHouses} from '@realm/game-data';import {database,userA} from './fixtures/supabase';
test('expanding the outer cliffs preserves the complete pre-housing village terrain and collision',()=>{
 const m=gridMap('elderwood'),t=elderwoodTown;
 const relative=(keys:Set<string>,edge=false)=>[...keys].map(k=>{const a=k.split(':'),prefix=edge?a[0]+':':'',[x,y]=(edge?a[1]:a[0]).split(',').map(Number);return{x:x-t.x,y:y-t.y,prefix};}).filter(p=>p.x>=0&&p.y>=0&&p.x<t.width&&p.y<t.height).map(p=>p.prefix+`${p.x},${p.y}`).sort();
 const snapshot={cells:m.cells.slice(t.y,t.y+t.height).map(r=>r.slice(t.x,t.x+t.width)),blocked:relative(m.blocked),edges:relative(m.edges,true)};
 // Captured from 738e3d8, before the misplaced house terraces were added.
 assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),'2f6759a38bafdcc35bf3d98ce609d9e20200bbcc24e26da7f83e7e736990c6be');
 assert.deepEqual(elderwoodSize,{width:104,height:96});for(const h of playerHouses)assert.ok(h.terrace.x+h.terrace.w<t.x||h.terrace.x>t.x+t.width||h.terrace.y+h.terrace.h<t.y||h.terrace.y>t.y+t.height,h.id+' yard outside original town');
});
test('housing expansion migrates existing displays once while preserving owners, item instances and new lots',async()=>{const db=await database();try{
 const item={category:'gear',gear:{id:'30000000-0000-4000-8000-000000000001',base:'knightSword',rarity:'legendary'}},old=[{floor:0,x:12.5,y:1.5,item}];
 await db.query("update public.player_houses set owner_id=$1,owner_name='Hero',revision=5,layout_version=1,displays=$2::jsonb where id='briar'",[userA,JSON.stringify(old)]);
 const sql=await readFile(new URL('../supabase/migrations/202610300002_expand_cliff_neighborhoods.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
 const result=await db.query<{owner_id:string;revision:number;displays:any[];layout_version:number}>("select owner_id,revision,displays,layout_version from public.player_houses where id='briar'");assert.equal(result.rows[0].owner_id,userA);assert.equal(result.rows[0].revision,6);assert.equal(result.rows[0].layout_version,2);assert.deepEqual(result.rows[0].displays,[{...old[0],x:11.5,y:7.5}]);await assert.rejects(db.query('select public.commit_player_house($1,$2,$3,$4,$5::jsonb,$6::jsonb)',[userA,'40000000-0000-4000-8000-000000000001','briar',6,JSON.stringify({id:'briar',ownerId:userA,ownerName:'Hero',displays:old}),JSON.stringify({})]),/HOUSE_LAYOUT_CHANGED/);const count=await db.query<{count:number}>('select count(*)::integer as count from public.player_houses');assert.equal(count.rows[0].count,20);
 }finally{await db.close();}});
