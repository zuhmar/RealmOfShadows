// Run against Vite and a running Colyseus server. The sheet fixture contains no user artwork.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 try{for(const offline of [true,false]){
 const page=await browser.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(offline)await page.route('**/matchmake/**',r=>r.abort());
 await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5173');
 await page.waitForFunction(()=>/Connected|Local preview/.test(document.querySelector('#connection').textContent));
 const scene=()=>page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);const s=game.scene.scenes[0];return {x:s.local.x,y:s.local.y,avatarX:s.avatar.x,cameraX:s.cameras.main.scrollX,online:s.online,preview:s.preview,animation:s.bodySprite?.anims.currentAnim?.key};});
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1536;c.height=1024;const g=c.getContext('2d');g.fillStyle='#4488bb';g.fillRect(90,104,1440,884);return c.toDataURL().split(',')[1];});
 await page.locator('#character-sheet').setInputFiles({name:'layout.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Character sheet imported'));
 const before=await scene();assert.equal(before.preview,offline);const until=async predicate=>{for(let i=0;i<150;i++){const state=await scene();if(predicate(state))return state;await page.waitForTimeout(100);}throw Error('movement condition timed out');};await page.keyboard.down('d');const during=await until(s=>s.x>17.5&&s.animation==='walk-right');await page.keyboard.up('d');await until(s=>s.animation==='idle-right');const after=await scene();assert.ok(after.x-before.x>1,JSON.stringify({before,after}));assert.ok(after.avatarX-before.avatarX>64);assert.ok(after.cameraX-before.cameraX>30);assert.equal(during.animation,'walk-right');assert.equal(after.animation,'idle-right');
 // Attempt to walk beyond a world edge: legal movement must stop.
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);const s=game.scene.scenes[0];if(s.preview){s.local.x=30.7;s.local.y=13.5;}});
 if(offline){await page.keyboard.down('d');await page.waitForTimeout(300);await until(s=>s.animation==='idle-right');await page.keyboard.up('d');const edge=await scene();assert.ok(edge.x<30.81);assert.equal(edge.animation,'idle-right');}
 assert.deepEqual(errors,[]);console.log(`PASS ${offline?'offline preview':'connected server'}: imported sprite translates, camera follows, walk/idle animation, ${offline?'collision, ':''}no runtime errors`);await page.close();
 }}finally{await browser.close();}
})();
