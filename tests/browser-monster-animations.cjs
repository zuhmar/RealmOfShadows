const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return ['webgl','webgl2','experimental-webgl'].includes(k)?null:get.call(this,k,...a)}});
 await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5173');await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('Local preview'));
 await page.locator('#interact').click();await page.locator('#destinations button').filter({has:page.locator('strong',{hasText:'Whispering Woods'})}).click();
 const result=await page.evaluate(async()=>{
  const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src),s=game.scene.scenes[0];game.loop.sleep();const checks=[];
  try{for(const [id,kind]of [['wolf-1','wolf'],['spider-1','spider']]){
   const monster=s.sim.wolves.get(id),view=s.wolfViews.get(id),sprite=view.getData('sprite');
   for(const facing of ['down','left','right','up'])for(const [mode,action]of [['idle','idle'],['chase','walk'],['attack','attack']]){
    Object.assign(monster,{mode,facing});view.setData('attackUntil',0).setData('animationMode','idle');s.renderCombat(16);
    const visited=new Set([sprite.texture.key]);for(let i=0;i<10;i++){sprite.anims.update(i*120,120);visited.add(sprite.texture.key);}
    checks.push({kind,facing,action,key:sprite.anims.currentAnim.key,frames:[...visited],flip:sprite.flipX});
   }
   monster.hp=0;s.renderCombat(16);s.renderCombat(16);
   const corpses=[...s.fxObjects].filter(o=>o.anims?.currentAnim?.key===`painted-${kind}-death-up`);
   checks.push({kind,death:corpses.length,removed:!s.wolfViews.has(id),interactive:corpses.some(o=>!!o.input)});
  }}finally{game.loop.wake();}return checks;
 });
 for(const c of result){if('death'in c){assert.equal(c.death,1);assert.equal(c.removed,true);assert.equal(c.interactive,false);continue;}
 assert.equal(c.key,`painted-${c.kind}-${c.action}-${c.facing}`);assert.equal(c.flip,false);assert.ok(c.frames.length>=2,JSON.stringify(c));}
 await page.waitForTimeout(1200);const corpses=await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);return [...game.scene.scenes[0].fxObjects].filter(o=>o.anims?.currentAnim?.key?.includes('-death-')).length;});assert.equal(corpses,0);
 assert.ok(!requests.some(url=>/wolf_(?:idle|walk)|wolf-(?:idle|walk)/i.test(url)));assert.deepEqual(errors,[]);
 console.log('PASS generated wolf/spider: four directions, changing idle/walk/attack frames, single noninteractive death with cleanup, mobile loading, no legacy wolf requests or runtime errors');
 }finally{await browser.close()}})();
