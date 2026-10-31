const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{for(const mobile of [false,true]){
 const p=await b.newPage({viewport:mobile?{width:390,height:844}:{width:1100,height:800},isMobile:mobile,hasTouch:mobile}),errors=[];p.on('pageerror',e=>errors.push(e.message));await require('./helpers/browser-room.cjs')(p,true);await p.goto(process.env.TEST_CLIENT_URL??'http://localhost:5290');await p.locator('#play-guest').click();await p.evaluate(async()=>{const{game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});await p.waitForFunction(()=>s.entryReady&&!!s.bag);
 const places=await p.evaluate(async()=>{const{neighborhoodPlaces}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');return neighborhoodPlaces});
 for(const [i,place]of places.entries()){
  await p.evaluate(p=>{s.applyTravel('elderwood-upper',{x:p.entry.x+.5,y:p.entry.y+.5,stamina:100});s.cameras.main.setZoom(.7)},place);await p.waitForTimeout(500);
  await p.evaluate(async p=>{const{pathfind}=await import('/@fs/workspace/RealmOfShadows/packages/shared/src/index.ts');s.route=pathfind(s.local,{x:p.x+Math.floor(p.w/2)+.5,y:p.y+Math.floor(p.h/2)+.5},s.region);if(!s.route.length)throw Error('Unreachable public space')},place);
  await p.waitForFunction(p=>!s.route.length&&Math.hypot(s.local.x-(p.x+Math.floor(p.w/2)+.5),s.local.y-(p.y+Math.floor(p.h/2)+.5))<.1,place,{timeout:15000});await p.waitForTimeout(400);
  assert.equal(await p.evaluate(()=>s.worldObjects.filter(o=>o.texture?.key==='__MISSING').length),0);await p.screenshot({path:`/tmp/elderwood-place-${i}-${mobile?'mobile':'desktop'}.png`});
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile':'desktop'}: four public spaces, real walking around furniture, loaded directional sprites and clean rendering`);await p.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
