// Run against Vite and a running Colyseus server using the committed character assets.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 try{for(const {offline,idleOnly} of [{offline:true,idleOnly:false},{offline:false,idleOnly:false}]){
 const page=await browser.newPage();page.setDefaultTimeout(15000);await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(['webgl','webgl2','experimental-webgl'].includes(kind))return null;return get.call(this,kind,...args);};});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(offline)await page.route('**/matchmake/**',r=>r.abort());
 await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5173');
 await page.waitForFunction(()=>/Connected|Local preview/.test(document.querySelector('#connection').textContent));
 const scene=()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);const s=game.scene.scenes[0];return {waterTiles:s.children.list.filter(o=>o.texture?.key==='elderwood-terrain'&&String(o.frame?.name).startsWith('water-')).length,region:s.region,x:s.local.x,y:s.local.y,avatarX:s.avatar.x,cameraX:s.cameras.main.scrollX,authX:s.room?.state.players.get(s.room.sessionId)?.x,online:s.online,preview:s.preview,animation:s.bodySprite?.anims.currentAnim?.key,texture:s.bodySprite?.texture.key,idleFrames:s.anims.get('idle-down')?.frames.length,walkFrames:s.anims.get('walk-right')?.frames.length};});
 const waitRegion=async region=>{for(let i=0;i<150;i++){if((await scene()).region===region)return;await page.waitForTimeout(100);}throw Error('region change timed out');};
 for(const [id,name] of [['woods','Whispering Woods'],['caverns','Crystal Caverns'],['swamp','Murkmire Swamp'],['elderwood','Elderwood']]){
 await page.locator('#interact').click();await page.locator('#portal-dialog').waitFor({state:'visible'});await page.locator('#destinations button').filter({has:page.locator('strong',{hasText:new RegExp(`^${name}$`)})}).click();await waitRegion(id);assert.equal((await scene()).waterTiles,id==='elderwood'?21:0);assert.equal(await page.locator('h1').textContent(),name);assert.equal(await page.locator('#portal-dialog').isVisible(),false);
 }
 const before=await scene();assert.equal(before.idleFrames,2);assert.equal(before.texture,'citizen-idle');assert.equal(before.walkFrames,2);const walkingAnimation='walk-right';assert.equal(before.preview,offline);const until=async predicate=>{for(let i=0;i<150;i++){const state=await scene();if(predicate(state))return state;await page.waitForTimeout(100);}throw Error('movement condition timed out');};await page.keyboard.down('d');const during=await until(s=>s.x>18&&(offline||s.authX>18)&&s.animation===walkingAnimation);await page.keyboard.up('d');await until(s=>s.animation==='idle-right');const after=await scene();assert.ok(after.x-before.x>1,JSON.stringify({before,after}));assert.ok(after.avatarX-before.avatarX>64);assert.ok(after.cameraX-before.cameraX>30);assert.equal(during.animation,walkingAnimation);assert.equal(during.texture,'citizen-walk');assert.equal(after.texture,'citizen-idle');assert.equal(after.animation,'idle-right');
 // Attempt to walk beyond a world edge: legal movement must stop.
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);const s=game.scene.scenes[0];if(s.preview){s.local.x=30.7;s.local.y=13.5;}});
 if(offline){await page.keyboard.down('d');await page.waitForTimeout(300);await until(s=>s.animation==='idle-right');await page.keyboard.up('d');const edge=await scene();assert.ok(edge.x<30.81);assert.equal(edge.animation,'idle-right');}
 await page.screenshot({path:process.env.TEST_SCREENSHOT_PATH??`/tmp/realm-default-${offline?'preview':'online'}.png`});assert.deepEqual(errors,[]);console.log(`PASS ${idleOnly?'idle-only preview':offline?'layered preview':'connected server'}: portal destinations/return, bundled sprites, movement, camera follows, walk/idle animation, ${offline?'collision, ':''}no runtime errors`);await page.close();
 }}finally{await browser.close();}
})();
