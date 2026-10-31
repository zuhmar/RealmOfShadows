import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildingVisuals,housingVisuals,gridMap,villageBuildings,playerHouses,nearBuildingWindow,type WindowAnchor} from '@realm/game-data';
test('every building side uses two to four windows across its complete visible shell',()=>{
 const town=buildingVisuals('elderwood',gridMap('elderwood').objects);
 for(const b of villageBuildings)for(const side of ['n','s','w','e']){const windows=town.filter(o=>o.wallFor===b.id&&o.wallSide===side&&o.key.endsWith('-window'));assert.ok(windows.length>=2&&windows.length<=4,`${b.id} ${side}: ${windows.length}`);}
 const homes=housingVisuals('elderwood-upper');for(const h of playerHouses)for(const side of ['n','s','w','e']){const windows=homes.filter(o=>o.houseFor===h.id&&o.houseWallSide===side&&o.key.endsWith('-window'));assert.ok(windows.length>=2&&windows.length<=4,`${h.id} ${side}: ${windows.length}`);}
 for(const o of [...town,...homes].filter(o=>o.windowAt)){assert.ok(o.key.endsWith('-window'));assert.ok(!o.houseUpper&&!o.upperFor,'only current-floor windows reveal interiors');}
});
test('window reveals require standing beside its exterior face on the same floor',()=>{
 for(const side of ['n','s','w','e'] as const){const w:WindowAnchor={x:10,y:10,side,kind:'house',building:'briar',region:'elderwood-upper'},dx=side==='w'?-.5:side==='e'?.5:0,dy=side==='n'?-.5:side==='s'?.5:0;assert.ok(nearBuildingWindow({x:10+dx,y:10+dy},w.region,w));assert.equal(nearBuildingWindow({x:10-dx,y:10-dy},w.region,w),false);assert.equal(nearBuildingWindow({x:10+dx*4,y:10+dy*4},w.region,w),false);assert.equal(nearBuildingWindow({x:10+dx,y:10+dy},'elderwood',w),false);}
});
