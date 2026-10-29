const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{for(const mobile of [false,true]){
 const p=await b.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile}),errors=[];p.on('pageerror',e=>errors.push(e.message));await require('./helpers/browser-room.cjs')(p,true);
 await p.goto(process.env.TEST_CLIENT_URL??'http://localhost:5281');await p.locator('#play-guest').click();await p.evaluate(async()=>{const{game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});await p.waitForFunction(()=>s.entryReady&&!!s.bag);
 for(const [name,x,y]of [['north',30.5,8.5],['west',7.5,27.5],['south',43.5,43.5]]){
 await p.evaluate(({x,y})=>{s.applyTravel('woods',{x,y,stamina:100});s.cameras.main.setZoom(.65)},{x,y});await p.waitForTimeout(600);
 assert.equal(await p.evaluate(()=>s.children.list.filter(o=>o.getData?.('scenicCliff')).length),16);
 await p.screenshot({path:`/tmp/woods-cliffs-${name}-${mobile?'mobile':'desktop'}.png`});
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile':'desktop'}: sixteen depth-sorted outcrops, terrain boundaries and clean rendering`);await p.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
