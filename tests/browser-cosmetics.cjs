const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{for(const mobile of [false,true])for(const offline of [true,false]){
  if(process.env.TEST_COSMETIC_MODE&&process.env.TEST_COSMETIC_MODE!==`${mobile?'mobile':'desktop'}-${offline?'guest':'online'}`)continue;
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(!mobile)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return /webgl/i.test(k)?null:get.call(this,k,...a)}});
  if(offline)await page.route('**/matchmake/**',r=>r.abort());
  await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5252');await page.locator('#play-guest').click();await page.waitForFunction(()=>/Connected|Local preview/.test(document.querySelector('#connection').textContent));
  assert.equal((await page.locator('#connection').textContent()).includes('Connected'),!offline);
  await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});
  assert.equal(await page.evaluate(()=>!!s.avatar.getData('skinAvatar')&&!s.avatar.getData('paperDoll')),true);assert.equal(await page.locator('#appearance-style').count(),0);
  await page.locator('#character-panel').click();await page.locator('#wardrobe-tab').click();
  assert.equal(await page.locator('#cosmetic-skin option').count(),31);assert.equal(await page.locator('#cosmetic-wings option').count(),11);assert.equal(await page.locator('#cosmetic-aura option').count(),11);
  await page.locator('#outfit-browser summary').click();assert.equal(await page.locator('[data-outfit]').count(),30);
  await page.selectOption('#outfit-variant-filter','female');assert.equal(await page.locator('[data-outfit]:visible').count(),15);await page.locator('[data-outfit="royal-guardian-female"]').click();
  await page.waitForFunction(()=>s.bag.cosmetics.skin==='royal-guardian-female'&&s.avatar.getData('skinAvatar').look.skin==='royal-guardian-female');assert.equal(await page.evaluate(()=>s.bag.classId),'citizen');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.outfit-card img')).every(i=>i.complete&&i.naturalWidth===160));await page.screenshot({path:`/tmp/reference-wardrobe-${mobile?'mobile':'desktop'}.png`});
  await page.selectOption('#outfit-variant-filter','male');assert.equal(await page.locator('[data-outfit]:visible').count(),15);await page.selectOption('#outfit-variant-filter','all');assert.equal(await page.locator('[data-outfit]:visible').count(),30);
  await page.locator('#outfit-browser summary').click();
  for(const id of ['shadow-reaper-female','inferno-knight','frostborn-female','forest-spirit','celestial-knight-female','blood-moon','crystal-warden-female','sand-nomad-female','void-lord-female']){await page.selectOption('#cosmetic-skin',id);await page.waitForFunction(id=>s.bag.cosmetics.skin===id&&s.avatar.getData('skinAvatar').look.skin===id,id);}
  await page.selectOption('#cosmetic-wings','crystal');await page.waitForFunction(()=>s.bag.cosmetics.wings==='crystal');await page.selectOption('#cosmetic-aura','void');await page.waitForFunction(()=>s.bag.cosmetics.aura==='void');
  await page.waitForFunction(()=>s.avatar.getData('skinAvatar').wings.visible&&s.avatar.getData('skinAvatar').aura.visible&&s.avatar.getData('skinAvatar').auraFront.visible);
  assert.equal(await page.locator('#wardrobe-portrait').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)),true);
  await page.screenshot({path:`/tmp/reference-preview-${mobile?'mobile':'desktop'}.png`});await page.locator('#close-character').click();
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>s.avatar.getData('skinAvatar').sprite.anims.currentAnim.key.startsWith('skin-void-lord-female-walk-'));await page.keyboard.up('ArrowRight');await page.waitForTimeout(350);
  const count=await page.evaluate(async()=>{
   const {SkinAvatar}=await import('/src/skin-avatar.ts');window.testSkin=new SkinAvatar(s);s.add.existing(testSkin);testSkin.setPosition(s.avatar.x+110,s.avatar.y);
   const skins=Object.keys(s.textures.list).filter(k=>k.startsWith('skin-')).map(k=>k.slice(5)),wings=Object.keys(s.textures.list).filter(k=>k.startsWith('wings-')).map(k=>k.slice(6)),auras=Object.keys(s.textures.list).filter(k=>k.startsWith('aura-')).map(k=>k.slice(5));
   if(skins.length!==30||wings.length!==10||auras.length!==10)throw Error('Missing reference atlases');
   for(const id of skins)for(const dir of ['down','left','right','up']){
    const t=s.textures.get(`skin-${id}`);for(let i=0;i<6;i++)if(!t.has(`${dir}-${i}`))throw Error('Missing full-body pose');
    for(const wing of wings){testSkin.pose({skin:id,wings:wing,aura:'crystal'},dir,true,0);if(testSkin.sprite.anims.currentAnim.key!==`skin-${id}-walk-${dir}`||testSkin.sprite.texture.key!==`skin-${id}`)throw Error('Wrong outfit animation');if(!testSkin.wings.visible||testSkin.wings.frame.name!==dir||testSkin.wings.originY!==90/160||testSkin.wings.scaleX!==.6)throw Error('Wrong wing view or root');if((testSkin.list.indexOf(testSkin.wings)>testSkin.list.indexOf(testSkin.sprite))!==(dir==='up'))throw Error('Wrong wing depth');}
   }
   for(const aura of auras)for(let phase=0;phase<3;phase++){testSkin.pose({skin:'mage-female',wings:'divine',aura},'down',false,phase*220);if(testSkin.aura.frame.name!==`back-${phase}`||testSkin.auraFront.frame.name!==`front-${phase}`||testSkin.list.indexOf(testSkin.auraFront)<testSkin.list.indexOf(testSkin.sprite))throw Error('Aura phases or foreground layer missing');}
   testSkin.pose({skin:'mage-female',wings:'divine',aura:'divine'},'down',true,0);return skins.length;
  });assert.equal(count,30);
  const before=await page.evaluate(()=>testSkin.sprite.anims.currentFrame.index);await page.waitForFunction(before=>testSkin.sprite.anims.currentFrame.index!==before,before,{timeout:5000});
  await page.screenshot({path:`/tmp/reference-world-${mobile?'mobile':'desktop'}.png`});await page.evaluate(()=>testSkin.destroy());assert.deepEqual(errors,[]);
  console.log(`PASS ${mobile?'mobile WebGL':'desktop Canvas'} ${offline?'guest':'online'}: 30 reference outfits, gender filtering, 720 body poses, 1200 wing placements, all layered aura phases, movement and portraits`);await page.close();
 }}finally{await browser.close()}
})();
