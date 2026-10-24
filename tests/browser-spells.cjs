const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-gpu']});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return ['webgl','webgl2','experimental-webgl'].includes(k)?null:get.call(this,k,...a);};});
 await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5173');await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('Local preview'));
 await page.locator('#combat-panel>summary').click();assert.equal(await page.locator('#nova').isVisible(),false);assert.equal(await page.locator('#no-spells').isVisible(),true);
 // Preview fixture supplies lesson money and merchant proximity. Unit and multiplayer tests validate authority separately.
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src),s=game.scene.scenes[0];s.economy.profiles.get('local').gold=100;s.local.x=9.6875;s.local.y=7.9;s.openInventory(true);});
 await page.locator('#shop-controls details>summary').click();await page.locator('[data-spell="spark"]').click();await page.waitForFunction(()=>document.querySelector('[data-spell="spark"]').disabled);assert.equal(await page.locator('[data-spell="moonNova"]').isVisible(),false);await page.locator('[data-spell="mend"]').click();await page.waitForFunction(()=>document.querySelector('[data-spell="mend"]').disabled);assert.ok((await page.locator('#inventory-summary').textContent()).includes('65 gold'));
 await page.locator('#close-inventory').click();await page.locator('#spell-select').selectOption('mend');
 await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src),s=game.scene.scenes[0];s.fighter.hp=20;});await page.locator('#nova').click();
 const state=await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src),s=game.scene.scenes[0];return {hp:s.fighter.hp,mana:s.fighter.mana,known:s.bag.learnedSpells};});assert.ok(state.hp>=50&&state.hp<100);assert.ok(state.mana<100);assert.deepEqual(state.known,['spark','mend']);assert.deepEqual(errors,[]);
 console.log('PASS: empty initial spellbook, merchant lessons, shared-only Citizen catalogue, prices, learned Actions selector and targetless Mend');
}finally{await browser.close();}})();
