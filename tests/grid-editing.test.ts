import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridMap,validateGridEdits,applyPropEdits,propIdentity,editorObject,type GridEdits} from '@realm/game-data';
test('editor prop removal and placement update real collision while fixed landmarks stay protected',()=>{
 const base=gridMap('woods',true),objects=structuredClone(base.objects),blocked=new Set(base.propBlocked),tree=objects.find(o=>o.key==='woods-oak'&&o.footprint)!,portal=objects.find(o=>o.key==='woods-portal')!,f=tree.footprint!;
 const edit=validateGridEdits({removedProps:[propIdentity(tree),propIdentity(portal)],props:[{key:'woods-boulder',x:70,y:30,w:2,h:2,solidW:2,solidH:1}]},96,72);
 applyPropEdits(objects,blocked,edit);assert.ok(!objects.some(o=>propIdentity(o)===propIdentity(tree)));assert.ok(objects.some(o=>o.key==='woods-portal'));
 assert.equal(blocked.has(`${f.x},${f.y}`),false);assert.equal(blocked.has('70,31'),true);assert.equal(blocked.has('71,31'),true);assert.equal(blocked.has('70,30'),false,'canopy does not block the upper row');
 const placed=editorObject(edit.props![0]);assert.deepEqual(placed.footprint,{x:70,y:31,width:2,height:1});
});
test('version-two edits round-trip terrain, props and centered monster spawn data',()=>{
 const input:GridEdits={cells:structuredClone(gridMap('woods',true).cells),props:[{key:'woods-fern',x:70,y:28,w:1,h:1,solidW:0,solidH:0}],spawns:[{id:'editor-wolf-1',kind:'wolf',x:70.5,y:29.5}],removedSpawns:['wolf-1']};
 const result=validateGridEdits(JSON.parse(JSON.stringify(input)),96,72);assert.deepEqual(result,input);result.cells![10][10]=3;assert.notEqual(input.cells![10][10],3,'validation returns an independent draft');
 for(const bad of [{cells:[[0]]},{props:[{...input.props![0],key:'missing-art'}]},{props:[{...input.props![0],x:95}]},{props:[{...input.props![0],solidW:8}]},{spawns:[{...input.spawns![0],x:NaN}]},{spawns:[{...input.spawns![0],x:70}]},{spawns:[input.spawns![0],input.spawns![0]]},{removedSpawns:[7]}])assert.throws(()=>validateGridEdits(bad,96,72));
});

test('empty edit files preserve the authored terrain, props and collision in gameplay',()=>{
 for(const region of ['elderwood','elderwood-upper','woods','woods-upper','caverns','woods-depths','caverns-depths'])assert.deepEqual(gridMap(region),gridMap(region,true),region);
});

test('exported edits load through the actual runtime map and spawn pipeline without doubling props',async()=>{
 const {mkdtemp,cp,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{pathToFileURL}=await import('node:url');
 const folder=await mkdtemp(join(tmpdir(),'realm-editor-'));
 try{
  await cp(new URL('../packages/game-data/src/',import.meta.url),folder,{recursive:true});await writeFile(join(folder,'package.json'),'{"type":"module"}');
  const base=gridMap('woods',true),tree=base.objects.find(o=>o.key==='woods-oak')!,cells=structuredClone(base.cells);cells[8][66]=3;
  await writeFile(join(folder,'grid-overrides.json'),JSON.stringify({version:2,maps:{woods:{cells,removedProps:[propIdentity(tree)],props:[{key:'woods-boulder',x:70,y:30,w:2,h:2,solidW:2,solidH:1}],spawns:[{id:'editor-fixture-wolf',kind:'wolf',x:66.5,y:11.5}],removedSpawns:['wolf-1']}}}));
  const loaded=await import(pathToFileURL(join(folder,'index.ts')).href) as typeof import('@realm/game-data'),map=loaded.gridMap('woods');
  assert.equal(map.cells[8][66],3);assert.ok(map.blocked.has('66,8'));assert.ok(map.blocked.has('70,31'));assert.ok(!map.objects.some(o=>propIdentity(o)===propIdentity(tree)));
  assert.equal(map.objects.filter(o=>o.key==='woods-boulder'&&o.x===70*48&&o.y===30*48).length,1);
  const spawns=loaded.gridSpawns('woods');assert.ok(!spawns.some(s=>s.id==='wolf-1'));assert.ok(spawns.some(s=>s.id==='editor-fixture-wolf'&&s.region==='woods'));
  assert.ok(loaded.authoredGridSpawns('woods').some(s=>s.id==='wolf-1'));assert.equal(loaded.gridMap('woods',true).cells[8][66],base.cells[8][66]);
 }finally{await rm(folder,{recursive:true,force:true});}
});
