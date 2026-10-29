const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{for(const mobile of [false,true]){
 const p=await b.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile}),errors=[];p.on('pageerror',e=>errors.push(e.message));await require('./helpers/browser-room.cjs')(p,true);await p.goto(process.env.TEST_CLIENT_URL??'http://localhost:5281');await p.locator('#play-guest').click();await p.evaluate(async()=>{const{game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});await p.waitForFunction(()=>s.entryReady&&!!s.bag);
 const ridges=await p.evaluate(async()=>{const{woodsRidges}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');return woodsRidges});
 const click=async id=>{const point=await p.evaluate(id=>{const o=s.worldObjects.find(o=>o.getData('stair')===id),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return{x:r.x+(o.x-c.worldView.x)*c.zoom*r.width/s.game.canvas.width,y:r.y+(o.y-c.worldView.y)*c.zoom*r.height/s.game.canvas.height}},id);if(mobile)await p.touchscreen.tap(point.x,point.y);else await p.mouse.click(point.x,point.y)};
 for(const ridge of ridges){
 await p.evaluate(r=>{s.applyTravel('woods',{x:r.stair.x,y:r.stair.y+4,stamina:100});s.cameras.main.setZoom(.5)},ridge);await p.waitForTimeout(500);
 assert.equal(await p.evaluate(()=>s.children.list.filter(o=>o.getData?.('raisedRidge')).length),3);
 await p.screenshot({path:`/tmp/highlands-${ridge.id}-${mobile?'mobile':'desktop'}-below.png`});
 await click(`woods-ridge-${ridge.id}-up`);await p.waitForFunction(()=>s.region==='woods-upper');
 const goal={x:ridge.parts[1].x+2.5,y:ridge.parts[1].y+3.5};
 await p.evaluate(async goal=>{const{pathfind}=await import('/@fs/workspace/RealmOfShadows/packages/shared/src/index.ts');s.route=pathfind(s.local,goal,s.region,s.occupied());if(!s.route.length)throw Error('No connected ridge route')},goal);await p.waitForFunction(g=>s.route.length===0&&Math.hypot(s.local.x-g.x,s.local.y-g.y)<.1,goal,{timeout:25000});
 await p.screenshot({path:`/tmp/highlands-${ridge.id}-${mobile?'mobile':'desktop'}-above.png`});
 await p.evaluate(id=>s.approachStairs(id),`woods-ridge-${ridge.id}-down`);await p.waitForFunction(()=>s.region==='woods',null,{timeout:25000});
 console.log(`PASS ${mobile?'mobile':'desktop'} ${ridge.name}: visible cliff, click climb, connected upper traversal and descent`);
 }
 assert.deepEqual(errors,[]);await p.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
