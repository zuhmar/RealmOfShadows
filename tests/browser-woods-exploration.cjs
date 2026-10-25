const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return ['webgl','webgl2','experimental-webgl'].includes(k)?null:get.call(this,k,...a)}});
 await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5173');await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('Local preview'));
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);game.scene.scenes[0].interact();});await page.locator('#destinations button').filter({has:page.locator('strong',{hasText:'Whispering Woods'})}).click();
 const result=await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src),s=game.scene.scenes[0],data=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts'),{pathfind}=await import('/@fs/workspace/RealmOfShadows/packages/shared/src/index.ts');
 const bounds={width:s.cameras.main.getBounds().width,height:s.cameras.main.getBounds().height},routes=[];game.loop.sleep();s.sim.wolves.clear();
 try{for(const c of [...data.woodsClearings,...data.monsterSpawns.map(s=>({name:s.id,x:s.x*48,y:(s.y-data.woodsMap.offsetY)*48}))]){const target={x:c.x/48,y:c.y/48+data.woodsMap.offsetY};s.route=pathfind(s.local,target,'woods');const initial=s.route.length;
 for(let i=0;i<1000&&s.route.length;i++)s.update(i*100,100);
 routes.push({name:c.name,initial,remaining:s.route.length,distance:Math.hypot(s.local.x-target.x,s.local.y-target.y),x:s.local.x,y:s.local.y});}}finally{game.loop.wake();}return {bounds,routes};});
 assert.deepEqual(result.bounds,{width:4352,height:3072});for(const r of result.routes){assert.ok(r.initial>0,r.name);assert.equal(r.remaining,0,r.name);assert.ok(r.distance<.5,JSON.stringify(r));}
 assert.ok(result.routes.some(r=>r.x>32));assert.ok(result.routes.some(r=>r.y>24));assert.deepEqual(errors,[]);
 console.log('PASS expanded woods: region camera bounds, fixed-tick walking to all eight clearings and nineteen spawn pockets, routes beyond former east/south limits, no runtime errors');
 }finally{await browser.close()}})();
