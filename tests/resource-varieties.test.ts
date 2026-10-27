import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter,legal,pathfind} from '@realm/shared';
import {resourceNodes,gridMap,portalFor,professionRules,islandResourceSets,fishForIsland,fishingTarget,resolveFishingWater,fishingShores,fishingCastClear,craftRecipes,type RegionId} from '@realm/game-data';
import {writeProgress,readProgress} from '../packages/shared/src/saves';
const setup=(random=()=>0)=>{const e=new Economy(random);e.join('p');const p=newFighter(),profile=e.profiles.get('p')!;return {e,p,profile};};
function water(region:RegionId){const map=gridMap(region);for(let y=1;y<map.height-1;y++)for(let x=1;x<map.width-1;x++){const n=fishingTarget(`fish:${region}:${x}:${y}`);if(n)return n;}throw Error('No fishable water '+region);}
test('every current map has all six ores, eight trees and eight plants on reachable, spaced land',()=>{
 assert.equal(professionRules.nodeRespawn,300);
 for(const region of new Set(resourceNodes.map(n=>n.region))){const group=resourceNodes.filter(n=>n.region===region);assert.equal(group.length,22);assert.equal(group.filter(n=>n.skill==='mining').length,6);assert.equal(group.filter(n=>n.skill==='woodcutting').length,8);assert.equal(group.filter(n=>n.skill==='herbalism').length,8);assert.ok(group.some(n=>n.item==='shadowOre'));assert.ok(group.some(n=>n.item==='nightshade'));
 for(const n of group){assert.ok(legal(n,region as RegionId),n.id);assert.ok(pathfind(portalFor(region as RegionId).arrival,n,region as RegionId).length,n.id);}
 for(let i=0;i<group.length;i++)for(const b of group.slice(i+1))assert.ok(Math.hypot(group[i].x-b.x,group[i].y-b.y)>=3,region+' spacing');
 }
});
test('each island including Elderwood has three unique level-gated fish; lower floors share island species',()=>{
 const all=new Set<string>();for(const [region,set]of Object.entries(islandResourceSets)){const pool=fishForIsland(region);assert.equal(pool.length,3);assert.equal(pool[0].level,set.level);assert.ok(pool[1].level>pool[0].level&&pool[2].level>pool[1].level);for(const f of pool){assert.ok(!all.has(f.item));all.add(f.item);assert.ok(craftRecipes.some(r=>r.id===`cook-${f.item}`));}}assert.equal(all.size,24);assert.deepEqual(fishForIsland('woods-depths'),fishForIsland('woods'));
});
test('water-click resolution stays in water and provides legal shoreline casts without allowing water walking',()=>{
 for(const region of ['elderwood','woods','caverns','swamp','woods-depths','caverns-depths'] as const){const n=water(region),resolved=resolveFishingWater(region,Math.floor(n.x),Math.floor(n.y));assert.equal(resolved?.id,n.id);assert.equal(legal(n,region),false);assert.ok(fishingShores(n).every(p=>legal(p,region)&&fishingCastClear(p,n,region)));assert.equal(fishingTarget(`fish:${region}:16:14`),undefined);}
 for(const id of ['fish:unknown:1:1','fish:elderwood:-1:0','fish:elderwood:999999:999999','fish:elderwood:NaN:1'])assert.equal(fishingTarget(id),undefined);
});
test('fishing catches only eligible local species and each water tile refreshes at exactly five minutes',()=>{
 const {e,p,profile}=setup(),n=water('elderwood'),shore=fishingShores(n)[0];Object.assign(p,shore);e.act('p',p,{kind:'gather',item:n.id,quantity:999},0);assert.equal(profile.inventory[0].item,'pondMinnow');assert.equal(profile.inventory[0].quantity,1);assert.equal(e.professions.depleted.get(n.id),300);const xp=profile.professions.fishing;e.act('p',p,{kind:'gather',item:n.id},299.99);assert.equal(profile.professions.fishing,xp);e.act('p',p,{kind:'gather',item:n.id},300);assert.equal(profile.inventory[0].quantity,2);
 for(const [roll,expected]of [[0,'pondMinnow'],[.4,'brookPerch'],[.99,'goldenCarp']] as const){const s=setup(()=>roll);s.profile.professions.fishing=10*6**2;Object.assign(s.p,shore);s.e.act('p',s.p,{kind:'gather',item:n.id},0);assert.equal(s.profile.inventory[0].item,expected);}
 const c=water('caverns');Object.assign(p,{region:'caverns',...fishingShores(c)[0]});assert.match(e.act('p',p,{kind:'gather',item:c.id},305),/level 11/);
});
test('high-tier resources on beginner maps require only profession level and replenish after 300 seconds',()=>{
 const {e,p,profile}=setup(),n=resourceNodes.find(n=>n.region==='elderwood'&&n.item==='shadowOre')!;Object.assign(p,{x:n.x,y:n.y});assert.match(e.act('p',p,{kind:'gather',item:n.id},0),/level 51/);profile.professions.mining=10*50**2;e.act('p',p,{kind:'gather',item:n.id},0);assert.equal(profile.level,1);assert.equal(profile.inventory[0].item,'shadowOre');e.act('p',p,{kind:'gather',item:n.id},299);assert.equal(profile.inventory[0].quantity,1);e.act('p',p,{kind:'gather',item:n.id},300);assert.equal(profile.inventory[0].quantity,2);
});
test('new fish, logs and plants persist alongside legacy materials and profession EXP',()=>{
 const {profile}=setup();profile.inventory=[{id:1,item:'pondMinnow',quantity:3},{id:2,item:'nightwoodLog',quantity:2},{id:3,item:'nightshade',quantity:1},{id:4,item:'rawFish',quantity:1},{id:5,item:'herb',quantity:1}];profile.professions.woodcutting=36000;const loaded=readProgress(writeProgress(profile,0));assert.deepEqual(loaded.profile.inventory,profile.inventory);assert.deepEqual(loaded.profile.professions,profile.professions);
});

test('a full bag cannot deplete fishing water or grant fishing EXP',()=>{
 const {e,p,profile}=setup(),n=water('elderwood');Object.assign(p,fishingShores(n)[0]);profile.inventory=Array.from({length:32},(_,id)=>({id,item:'pelt',quantity:20}));const before=structuredClone(profile);assert.match(e.act('p',p,{kind:'gather',item:n.id},0),/full/);assert.deepEqual(profile,before);assert.equal(e.professions.depleted.has(n.id),false);
});
