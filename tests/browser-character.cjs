const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return ['webgl','webgl2','experimental-webgl'].includes(k)?null:get.call(this,k,...a)}});await page.route('**/matchmake/**',r=>r.abort());
await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5173');await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('Local preview'));
await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.characterScene=game.scene.scenes[0];});
for(const [direction,key] of [['down','s'],['left','a'],['right','d'],['up','w']]){
 await page.evaluate(()=>{const s=window.characterScene;s.local.x=16.5;s.local.y=14.5;s.route=[];});
 const config=await page.evaluate(direction=>{const s=window.characterScene;return {idle:s.anims.get(`idle-${direction}`).frames.map(f=>f.textureFrame),walk:s.anims.get(`walk-${direction}`).frames.map(f=>f.textureFrame),size:s.textures.get(`citizen-${direction}`).get('frame-0').realHeight};},direction);
 assert.deepEqual(config.idle,['frame-0']);assert.deepEqual(config.walk,['frame-1','frame-2','frame-3','frame-4','frame-5']);assert.equal(config.size,256);
 const seen=new Set();await page.keyboard.down(key);
 for(let i=0;i<14;i++){await page.waitForTimeout(80);const state=await page.evaluate(()=>{const s=window.characterScene;return {animation:s.bodySprite.anims.currentAnim.key,texture:s.bodySprite.texture.key,frame:s.bodySprite.frame.name}});assert.equal(state.animation,`walk-${direction}`);assert.equal(state.texture,`citizen-${direction}`);seen.add(state.frame);}
 await page.keyboard.up(key);assert.equal(seen.size,5);await page.waitForFunction(direction=>window.characterScene.bodySprite.anims.currentAnim.key===`idle-${direction}`,direction);
 assert.equal(await page.evaluate(()=>window.characterScene.bodySprite.frame.name),'frame-0');
}
await page.screenshot({path:'/tmp/realm-directional-character.png'});assert.deepEqual(errors,[]);console.log('PASS directional character: all four sheets, first-frame idle, five walking frames, directional movement and idle return');
}finally{await browser.close()}})();
