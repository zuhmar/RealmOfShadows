import {test} from 'node:test';
import assert from 'node:assert/strict';
import {woodsLedge,gridMap,gridSpawns,portalFor,regionSize,stairsFor,availableStair,canTravel,visibleFloor,islandForRegion,monsterRegion} from '@realm/game-data';
import {legal,pathfind,move,CombatSimulation,newFighter,sight} from '@realm/shared';
test('outdoor upper floor shares coordinates but blocks cliff access and falling at its edges',()=>{
 const l=woodsLedge;assert.deepEqual(regionSize('woods-upper'),regionSize('woods'));
 for(let y=l.y;y<l.y+l.height;y++)for(let x=l.x;x<l.x+l.width;x++){const p={x:x+.5,y:y+.5};assert.equal(legal(p,'woods'),false);assert.equal(legal(p,'woods-upper'),true);}
 const edge={x:40.5,y:6.5,stamina:100};assert.equal(move(edge,{x:0,y:1,sprint:false,seq:1},.25,'woods-upper').y,edge.y);
 assert.equal(visibleFloor('woods','woods-upper'),true);assert.equal(visibleFloor('woods-upper','woods'),true);assert.equal(visibleFloor('woods','woods-depths'),false);
 assert.equal(islandForRegion('woods-upper'),'woods');assert.equal(canTravel(portalFor('woods'),'woods','woods-upper'),false);assert.equal(canTravel(portalFor('woods-upper'),'woods-upper','elderwood'),false);
});
test('paired ledge stairs and all upper wolves have legal reachable landings',()=>{
 const up=stairsFor('woods').find(s=>s.id==='woods-ledge-up')!,down=stairsFor('woods-upper')[0];
 assert.ok(pathfind(portalFor('woods').arrival,up,'woods').length);assert.ok(legal(up.arrival,up.to));assert.ok(legal(down.arrival,down.to));
 assert.ok(availableStair(up.arrival,'woods-upper',down.id));assert.equal(availableStair(up.arrival,'woods',down.id),undefined);
 const wolves=gridSpawns('woods-upper');assert.equal(wolves.length,3);
 for(const wolf of wolves){assert.equal(monsterRegion(wolf),'woods-upper');assert.ok(legal(wolf,'woods-upper'));assert.ok(pathfind(up.arrival,wolf,'woods-upper').length);}
 assert.equal(gridMap('woods-upper').blocked.has('40,7'),true);
});
test('weapons and learned spells cannot cross floors; combat works after climbing',()=>{
 const sim=new CombatSimulation(),p=newFighter(),wolf=sim.wolves.get('ledge-wolf-2')!,before=wolf.hp;for(const [id,w]of sim.wolves)if(monsterRegion(w)!=='woods-upper')sim.wolves.delete(id);Object.assign(p,{region:'woods',x:43.5,y:6.5});
 assert.equal(sight(p,wolf),false);assert.equal(sim.action('p',p,'bolt',wolf.id),false);assert.equal(sim.castSpell('p',p,'spark',wolf.id,{classId:'citizen',level:1,learnedSpells:['spark']}),false);assert.equal(p.mana,100);assert.equal(wolf.hp,before);
 p.region='woods-upper';p.x=40.5;p.y=4.5;assert.equal(sim.safe(p),false);assert.ok(sim.action('p',p,'bolt',wolf.id));for(let i=0;i<20;i++)sim.tick(.05,[['p',p]]);assert.ok(wolf.hp<before);
 sim.clear(p);p.region='woods';p.x=43.5;p.y=6.5;const hp=p.hp;for(let i=0;i<40;i++)sim.tick(.05,[['p',p]]);assert.equal(p.hp,hp,'upper attacks cannot follow a player down');
 for(const w of sim.wolves.values())if(monsterRegion(w)==='woods-upper')assert.ok(legal(w,'woods-upper'),'upper wolves stay on their floor');
});
