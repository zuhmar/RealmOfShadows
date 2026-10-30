import {test} from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
import {playerHouses,houseCells,housingRegions,houseDisplayTiles,emptyHouse,houseStairs,housingVisuals,elderwoodRimStairs,gridMap,gridCrossesWall,type HouseRecord} from '@realm/game-data';
import {Economy,planHousing,publicHouse,pathfind,legal,newFighter} from '@realm/shared';
const profile=()=>{const e=new Economy();e.join('p');const p=e.profiles.get('p')!;p.gold=4000;p.inventory=[{id:1,item:'potion',quantity:2}];return p;};
test('five distinct irregular cliff houses have connected floors, one door and reachable entrances',()=>{
 assert.equal(playerHouses.length,5);assert.equal(new Set(playerHouses.map(h=>houseCells(h,0).size)).size,5);
 for(const h of playerHouses){const base=houseCells(h,0),xs=[...base].map(k=>+k.split(',')[0]),ys=[...base].map(k=>+k.split(',')[1]);assert.ok(base.size<(Math.max(...xs)-Math.min(...xs)+1)*(Math.max(...ys)-Math.min(...ys)+1),h.id+' irregular plan');
 const outside={x:h.door.x,y:h.door.y+1};assert.ok(legal(outside,housingRegions[0]),h.id+' doorstep');assert.equal(gridCrossesWall(housingRegions[0],outside,h.door),false);assert.ok(elderwoodRimStairs.some(s=>pathfind(s.top,outside,housingRegions[0]).length),h.id+' connected to cliff stairs');
 for(let f=0;f<h.floors.length;f++){const cells=houseCells(h,f),start=f?{x:h.stairs.x+1,y:h.stairs.y}:h.door;assert.ok(legal(start,housingRegions[f]),h.id+' floor landing');for(const key of cells){const[x,y]=key.split(',').map(Number),goal={x:x+.5,y:y+.5};assert.ok(legal(goal,housingRegions[f]));if(goal.x!==start.x||goal.y!==start.y)assert.ok(pathfind(start,goal,housingRegions[f]).length,h.id+' connected room');}assert.ok(houseDisplayTiles(h,f).length);}
 }
 for(const region of housingRegions)for(const o of housingVisuals(region))assert.ok(existsSync(new URL(`../assets/world/objects/${o.key}.png`,import.meta.url)),o.key);
 for(const stair of houseStairs()){assert.ok(legal(stair,stair.from));assert.ok(legal(stair.arrival,stair.to));}
});
test('house purchases validate position, gold and ownership without mutating failed requests',()=>{const h=playerHouses[0],p=profile(),actor={...newFighter(),region:housingRegions[0],x:h.door.x,y:h.door.y+1};const unowned=emptyHouse(h.id);
 assert.equal(typeof planHousing(p,{...actor,region:'elderwood'},unowned,'a','Hero',{kind:'buy',house:h.id}),'string');assert.equal(typeof planHousing({...p,gold:0},actor,unowned,'a','Hero',{kind:'buy',house:h.id}),'string');assert.equal(p.gold,4000);
 const result=planHousing(p,actor,unowned,'a','Hero',{kind:'buy',house:h.id});assert.notEqual(typeof result,'string');if(typeof result==='string')return;assert.equal(result.profile.gold,3500);assert.equal(result.house.ownerId,'a');assert.equal(result.house.revision,1);assert.equal(p.gold,4000);assert.equal(unowned.ownerId,null);
 assert.match(planHousing(p,actor,result.house,'b','Other',{kind:'buy',house:h.id}) as string,/Owned by Hero/);assert.equal('ownerId'in publicHouse(result.house,'b'),false);
});
test('display transfers preserve real ownership and rarity, reject outsiders, equipped gear and full bags',()=>{const h=playerHouses[0],tile=houseDisplayTiles(h,0)[0],actor={...newFighter(),region:housingRegions[0],...tile},house:HouseRecord={...emptyHouse(h.id),ownerId:'a',ownerName:'Hero',revision:1},p=profile();
 const request={kind:'place',house:h.id,floor:0,...tile,category:'supply',item:'1'};
 assert.match(planHousing(p,actor,house,'b','Visitor',request) as string,/Only the owner/);
 const placed=planHousing(p,actor,house,'a','Hero',request);assert.notEqual(typeof placed,'string');if(typeof placed==='string')return;assert.equal(placed.profile.inventory[0].quantity,1);assert.equal(placed.house.displays.length,1);
 const taken=planHousing(placed.profile,actor,placed.house,'a','Hero',{...request,kind:'take'});assert.notEqual(typeof taken,'string');if(typeof taken==='string')return;assert.equal(taken.profile.inventory[0].quantity,2);assert.equal(taken.house.displays.length,0);
 assert.match(planHousing(p,actor,house,'a','Hero',{...request,category:'weapon',item:p.weapon}) as string,/Unequip/);
 const gear={id:'10000000-0000-4000-8000-000000000001',base:'knightSword' as const,rarity:'legendary' as const};p.gear.push(gear);const gp=planHousing(p,actor,house,'a','Hero',{...request,category:'gear',item:gear.id});assert.notEqual(typeof gp,'string');if(typeof gp==='string')return;assert.deepEqual(gp.house.displays[0].item,{category:'gear',gear});assert.equal(gp.profile.gear.length,0);
 gp.profile.inventory=Array.from({length:32},(_,i)=>({id:i+1,item:'potion',quantity:99}));assert.match(planHousing(gp.profile,actor,gp.house,'a','Hero',{...request,kind:'take'}) as string,/bag is full/);
 assert.match(planHousing(p,{...actor,x:20,y:20},house,'a','Hero',request) as string,/Stand beside/);
});
