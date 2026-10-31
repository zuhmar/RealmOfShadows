const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.TEST_CLIENT_URL??'http://localhost:5290')+'/map-editor.html');await p.waitForFunction(()=>document.querySelector('#status').textContent.includes('104 × 96'));
 const result=await p.evaluate(async()=>{
  const{terrainTileAssets,terrainPreview}=await import('/src/tiled-terrain.ts'),{villageCliffSurface,paintVillageOuterRim}=await import('/src/village-cliffs.ts'),{gridMap,elderwoodTown,onElderwoodRim,elderwoodRimStairs,elderwoodStairTile}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');
  const atlas=new Image();atlas.src=terrainTileAssets.find(a=>a.key==='terrain-elderwood-32').url;await atlas.decode();const lower=terrainPreview('elderwood',atlas),upper=terrainPreview('elderwood-upper',atlas),a=lower.getContext('2d'),b=upper.getContext('2d'),map=gridMap('elderwood-upper'),patches=[];
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(map.cells[y][x]===2&&!onElderwoodRim(x,y)&&villageCliffSurface(x,y)){
   const first=a.getImageData(x*32,y*32,32,32).data,second=b.getImageData(x*32,y*32,32,32).data;let different=0;for(let i=0;i<first.length;i++)if(first[i]!==second[i])different++;
   patches.push({x,y,different});
  }
  const edge=document.createElement('canvas');edge.width=edge.height=32;const c=edge.getContext('2d');let overlay=0,stoneCells=0;
  for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(map.cells[y][x]===2&&villageCliffSurface(x,y)){
   c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,32,32);c.translate(-x*32,-y*32);paintVillageOuterRim(c,x,y);const d=c.getImageData(0,0,32,32).data;for(let i=3;i<d.length;i+=4)if(d[i])overlay++;stoneCells++;
  }
  return{patches,overlay,stoneCells,stairs:elderwoodRimStairs.map(s=>{const p=elderwoodStairTile(s);return patches.some(v=>v.x===Math.floor(p.x)&&v.y===Math.floor(p.y))})};
 });assert.ok(result.patches.length>=8);assert.ok(result.patches.every(p=>p.different===0),'paved recess is pixel-identical from both floors: '+JSON.stringify(result.patches));assert.ok(result.stairs.every(Boolean),'all four stair openings covered');assert.ok(result.stoneCells>200);assert.equal(result.overlay,0,'earth edges never overlay stone walkway tiles');assert.deepEqual(errors,[]);console.log('PASS all four stair recesses match on both floors and every paved cliff-walk tile is free of grass-edge overlays');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
