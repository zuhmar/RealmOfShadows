const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5256');await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('Local preview'));
 const result=await page.evaluate(async()=>{
  const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src),s=game.scene.scenes[0],{gridMap,portalFor}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts'),{terrainPreview,terrainKey}=await import('/src/tiled-terrain.ts');
  const regions=['elderwood','woods','woods-depths'],original=regions.map(r=>JSON.stringify(gridMap(r).cells));let matches=true,previous='elderwood';
  for(let repeat=0;repeat<2;repeat++)for(const region of regions){
   const arrival=region==='woods-depths'?{x:24.5,y:32.5}:portalFor(region).arrival;s.applyTravel(region,{...arrival,stamina:100});
   if(previous!==region&&s.textures.exists(`${previous}-connected-ground`))throw Error('Old ground texture leaked');previous=region;
   const map=gridMap(region),w=map.width*32,h=map.height*32,expected=terrainPreview(region,s.textures.get(terrainKey(region)).getSourceImage()).getContext('2d').getImageData(0,0,w,h).data,actual=s.textures.get(`${region}-connected-ground`).getContext().getImageData(0,0,w,h).data;
   matches=matches&&expected.every((value,i)=>value===actual[i]);
  }
  s.applyTravel('caverns',{...portalFor('caverns').arrival,stamina:100});if(s.textures.exists(`${previous}-connected-ground`))throw Error('Connected texture leaked into ordinary map');
  return {matches,unchanged:regions.every((r,i)=>JSON.stringify(gridMap(r).cells)===original[i])};
 });assert.deepEqual(result,{matches:true,unchanged:true});assert.deepEqual(errors,[]);console.log('PASS connected terrain: Elderwood, Woods and Root Hollow preview/runtime pixels match, collision grids unchanged and repeated island travel cleans up textures');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
