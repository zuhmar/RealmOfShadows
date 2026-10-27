import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Economy,newFighter} from '@realm/shared';
import {resourceNodes,craftRecipes,professionLevel,newProfessions,craftingBench,professionDefinitions,items,gridMap,portalFor,type RegionId} from '@realm/game-data';
import {legal,pathfind} from '@realm/shared';
import {writeProgress,readProgress} from '../packages/shared/src/saves';
const setup=()=>{const e=new Economy();e.join('a');e.join('b');return {e,p:newFighter(),profile:e.profiles.get('a')!};};
test('eight independent professions and six mining tiers have reachable active nodes and complete gear recipes',()=>{
 assert.equal(Object.keys(professionDefinitions).length,8);assert.deepEqual([...new Set(resourceNodes.filter(n=>n.skill==='mining').map(n=>n.item))],['copperOre','ironOre','goldOre','mythrilOre','dragonOre','shadowOre']);
 for(const n of resourceNodes.filter(n=>['elderwood','woods','caverns','swamp'].includes(n.region))){const region=n.region as RegionId;assert.ok(legal(n,region),n.id);assert.ok(pathfind(portalFor(region).arrival,n,region).length,n.id);if(n.skill==='fishing'){const m=gridMap(region);assert.ok([[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>m.cells[Math.floor(n.y)+dy]?.[Math.floor(n.x)+dx]===3),n.id+' beside water');}}
 assert.equal(new Set(resourceNodes.map(n=>n.id)).size,resourceNodes.length);assert.equal(craftRecipes.filter(r=>r.output.gear).length,66);assert.equal(new Set(craftRecipes.map(r=>r.id)).size,craftRecipes.length);
});
test('gathering checks range, region, skill, combat, shared node depletion and cooldown; grants only its own profession EXP',()=>{
 const {e,p,profile}=setup(),node=resourceNodes.find(n=>n.item==='copperOre')!;assert.match(e.act('a',p,{kind:'gather',item:node.id},0),/closer/);Object.assign(p,{region:node.region,x:node.x,y:node.y});e.act('a',p,{kind:'gather',item:node.id},0);assert.equal(profile.inventory[0].item,'copperOre');assert.equal(profile.professions.mining,25);assert.equal(profile.xp,0);assert.equal(profile.professions.blacksmithing,0);assert.match(e.act('b',p,{kind:'gather',item:node.id},0),/replenishing/);assert.equal(e.profiles.get('b')!.inventory.length,0);e.act('a',p,{kind:'gather',item:node.id},300);assert.equal(profile.inventory[0].quantity,2);
 const iron=resourceNodes.find(n=>n.item==='ironOre')!;Object.assign(p,{region:iron.region,x:iron.x,y:iron.y});assert.match(e.act('a',p,{kind:'gather',item:iron.id},305),/level 11/);profile.professions.mining=1000;p.auto=true;assert.match(e.act('a',p,{kind:'gather',item:iron.id},305),/Stop attacking/);
});
test('full bags reject gathering without losing the resource or gaining EXP; snapshots cannot mutate skills or depletion',()=>{
 const {e,p,profile}=setup(),node=resourceNodes.find(n=>n.item==='copperOre')!;Object.assign(p,{region:node.region,x:node.x,y:node.y});profile.inventory=Array.from({length:32},(_,i)=>({id:i,item:'pelt',quantity:20}));e.act('a',p,{kind:'gather',item:node.id},0);assert.equal(profile.professions.mining,0);assert.equal(e.professions.depleted.size,0);profile.inventory=[];e.act('a',p,{kind:'gather',item:node.id},0);const bag=e.snapshot('a',0);bag.professions.mining=9000;bag.nodeReadyAt[node.id]=0;assert.equal(profile.professions.mining,25);assert.equal(e.professions.depleted.get(node.id),300);
});
test('crafting atomically consumes split stacks and grants identified gear or supplies only at the bench',()=>{
 const {e,p,profile}=setup();profile.inventory=[{id:1,item:'copperOre',quantity:1},{id:2,item:'copperOre',quantity:2}];assert.match(e.act('a',p,{kind:'craft',item:'smelt-copper'},0),/workbench/);Object.assign(p,craftingBench);e.act('a',p,{kind:'craft',item:'smelt-copper',quantity:999,output:'shadowArmor'},0);assert.equal(profile.inventory.length,1);assert.equal(profile.inventory[0].item,'copperBar');assert.equal(profile.inventory[0].quantity,1);assert.equal(profile.professions.blacksmithing,75);assert.match(e.act('a',p,{kind:'craft',item:'smelt-iron'},0),/level 11/);
 profile.inventory=[{id:10,item:'copperBar',quantity:4}];e.act('a',p,{kind:'craft',item:'craft-copperArmor'},0);assert.equal(profile.inventory.length,0);assert.equal(profile.gear.length,1);assert.equal(profile.gear[0].base,'copperArmor');assert.equal(profile.gear[0].rarity,'uncommon');assert.match(e.act('a',p,{kind:'craft',item:'craft-copperArmor'},0),/Missing/);
 for(const [recipe,input,count,output,skill]of [['cook-fish','rawFish',2,'cookedFish','cooking'],['brew-potion','herb',3,'potion','alchemy'],['cut-timber','log',2,'timber','woodworking']] as const){profile.inventory=[{id:20,item:input,quantity:count}];e.act('a',p,{kind:'craft',item:recipe},0);assert.equal(profile.inventory[0].item,output);assert.ok(profile.professions[skill]>0);}
});
test('failed crafting leaves ingredients and EXP untouched; cooked fish shares the potion cooldown',()=>{
 const {e,p,profile}=setup();Object.assign(p,craftingBench);profile.inventory=[{id:1,item:'copperOre',quantity:50},...Array.from({length:24},(_,i)=>({id:i+2,item:'pelt' as const,quantity:20}))];const before=structuredClone(profile);assert.match(e.act('a',p,{kind:'craft',item:'smelt-copper'},0),/full/);assert.deepEqual(profile,before);
 profile.inventory=[{id:99,item:'cookedFish',quantity:2}];p.hp=50;e.act('a',p,{kind:'food'},0);assert.equal(p.hp,80);e.act('a',p,{kind:'food'},1);assert.equal(p.hp,80);assert.equal(profile.inventory[0].quantity,1);e.act('a',p,{kind:'food'},3);assert.equal(p.hp,100);assert.equal(profile.inventory.length,0);
});
test('profession saves migrate old profiles and reject unknown, missing, negative or excessive skill EXP',()=>{
 const {profile}=setup();profile.professions.mining=1000;const save=writeProgress(profile,0);assert.equal(professionLevel(readProgress(save).profile.professions.mining),11);const legacy=structuredClone(save) as any;delete legacy.profile.professions;assert.deepEqual(readProgress(legacy).profile.professions,newProfessions());for(const edit of [(p:any)=>p.professions.mining=-1,(p:any)=>p.professions.mining=98011,(p:any)=>p.professions.hacking=1,(p:any)=>delete p.professions.cooking]){const bad=structuredClone(save);edit(bad.profile);assert.throws(()=>readProgress(bad));}
});
