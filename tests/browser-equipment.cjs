const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});try{
for(const mobile of [false,true])for(const offline of [true,false]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return ['webgl','webgl2','experimental-webgl'].includes(k)?null:get.call(this,k,...a)}});
 if(offline)await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5173');await page.locator('#play-guest').click();await page.waitForFunction(()=>/Connected|Local preview/.test(document.querySelector('#connection').textContent));
 const click=async selector=>{if(mobile)await page.locator(selector).tap();else await page.locator(selector).click();};
 await click('#inventory-button');assert.equal(await page.locator('#equipment-slots .equipment-item').count(),8);assert.match(await page.locator('#equipment-stats').textContent(),/^0 armor/);
 await click('#bag-equipment>summary');assert.equal(await page.locator('#equipment-items button').count(),9);
 await page.waitForFunction(()=>[...document.querySelectorAll('#equipment-items img')].every(img=>img.complete&&img.naturalWidth>0));
 for(const id of ['clothTunic','clothHood','woodenShield'])await click(`#equipment-items [data-item="${id}"]`);
 await page.waitForFunction(()=>document.querySelector('#equipment-stats').textContent.startsWith('3 armor'));assert.match(await page.locator('[data-slot="chest"]').textContent(),/Beginner Tunic/);
 await click('[data-slot="chest"]');await page.waitForFunction(()=>document.querySelector('#equipment-stats').textContent.startsWith('2 armor'));assert.match(await page.locator('[data-slot="chest"]').textContent(),/Empty/);
 await click('#equipment-items [data-item="sword"]');await page.waitForFunction(()=>document.querySelector('#equipment-slots').textContent.includes('Beginner Sword'));
 await click('#close-inventory');await click('#inventory-button');assert.match(await page.locator('#equipment-stats').textContent(),/2 armor.*Beginner Sword/);
 await page.screenshot({path:`/tmp/realm-equipment-${mobile?'mobile':'desktop'}-${offline?'preview':'online'}.png`});assert.deepEqual(errors,[]);console.log(`PASS equipment ${mobile?'mobile':'desktop'} ${offline?'preview':'online'}: eight slots, sprites, equip/unequip, armor, weapon and reopening bag`);await page.close();
}
}finally{await browser.close()}})();
