const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const density of [1,2,3]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:density,isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...args){return /webgl/i.test(k)?null:get.call(this,k,...args)}});
  await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5211');
  await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('Local preview'));
  await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.scene=game.scene.scenes[0];});
  const check=async(width,height)=>{await page.waitForFunction(({width,height})=>scene.game.canvas.width===width*Math.min(devicePixelRatio,2)&&scene.game.canvas.height===height*Math.min(devicePixelRatio,2),{width,height});
   const state=await page.evaluate(()=>{const c=scene.game.canvas,r=c.getBoundingClientRect();return {width:r.width,height:r.height,zoom:scene.cameras.main.zoom,viewZoom:scene.viewZoom,worldWidth:scene.cameras.main.width/scene.cameras.main.zoom};});
   assert.ok(Math.abs(state.width-width)<1);assert.ok(Math.abs(state.height-height)<1);assert.ok(Math.abs(state.zoom/state.viewZoom-Math.min(density,2))<.001);assert.ok(Math.abs(state.worldWidth-width/state.viewZoom)<.01);
  };
  await check(390,844);await page.waitForTimeout(350);
  const screenPoint=async(x,y)=>page.evaluate(({x,y})=>{const c=scene.cameras.main,canvas=scene.game.canvas,r=canvas.getBoundingClientRect();return {x:r.x+(x*64-c.worldView.x)*c.zoom*r.width/canvas.width,y:r.y+(y*64-c.worldView.y)*c.zoom*r.height/canvas.height};},{x,y});
  await page.touchscreen.tap(...Object.values(await screenPoint(16.5,17)));await page.waitForFunction(()=>Math.hypot(scene.local.x-16.5,scene.local.y-17)<.6);
  await page.locator('#character-panel').click();await page.locator('#settings-tab').click();await page.locator('#zoom-in').click();await check(390,844);await page.locator('#zoom-out').click();await page.locator('#close-character').click();
  await page.setViewportSize({width:844,height:390});await check(844,390);
  await page.setViewportSize({width:390,height:844});await check(390,844);
  await page.evaluate(()=>{scene.local.x=16.5;scene.local.y=15.5;scene.avatar.setPosition(16.5*64,15.5*64);scene.openPortal();});await page.locator('#destinations button').filter({has:page.locator('strong',{hasText:'Whispering Woods'})}).click();await page.waitForFunction(()=>scene.region==='woods');await page.waitForTimeout(350);
  const portal=await page.evaluate(()=>{const z=scene.worldObjects.find(o=>o.type==='Zone'),c=scene.cameras.main,canvas=scene.game.canvas,r=canvas.getBoundingClientRect();return {x:r.x+(z.x-c.worldView.x)*c.zoom*r.width/canvas.width,y:r.y+(z.y-c.worldView.y)*c.zoom*r.height/canvas.height};});
  await page.touchscreen.tap(portal.x,portal.y);await page.locator('#portal-dialog').waitFor({state:'visible'});await page.locator('#close-portal').click();
  await page.screenshot({path:`/tmp/map-sharpness-dpr-${density}.png`});
  await page.evaluate(()=>{const w=scene.sim.wolves.get('wolf-9');scene.local.x=w.x;scene.local.y=w.y+3;scene.avatar.setPosition(scene.local.x*64,scene.local.y*64);scene.cameras.main.centerOn(scene.avatar.x,scene.avatar.y);});await page.waitForTimeout(350);
  const enemy=await page.evaluate(()=>{const v=scene.wolfViews.get('wolf-9'),c=scene.cameras.main,canvas=scene.game.canvas,r=canvas.getBoundingClientRect();return {x:r.x+(v.x-c.worldView.x)*c.zoom*r.width/canvas.width,y:r.y+(v.y-40-c.worldView.y)*c.zoom*r.height/canvas.height};});
  await page.touchscreen.tap(enemy.x,enemy.y);await page.waitForFunction(()=>scene.selected==='wolf-9'&&scene.sim.wolves.get('wolf-9').hp<65);
  assert.deepEqual(errors,[]);console.log(`PASS DPR ${density}: backing resolution, unchanged field of view, touch movement/portal/monster attack, zoom and rotation`);await page.close();
 }
 }finally{await browser.close()}})();
