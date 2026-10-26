const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 for(const webgl of [false,true]){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  if(!webgl)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...args){return /webgl/i.test(k)?null:get.call(this,k,...args)}});
  await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5211');await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('Local preview'));
  const state=await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.scene=game.scene.scenes[0];const texture=scene.textures.get('woods-base'),source=texture.getSourceImage(),ctx=texture.getContext();let alpha=255;
   for(const [x,y,w,h]of [[1535,0,2,2048],[0,1023,3072,2]]){const pixels=ctx.getImageData(x,y,w,h).data;for(let i=3;i<pixels.length;i+=4)alpha=Math.min(alpha,pixels[i]);}
   const png=source.toDataURL().split(',')[1];scene.applyTravel('woods',{x:34,y:23+1/3,stamina:100});
   const ground=scene.children.list.find(o=>o.texture?.key==='woods-base');return {width:source.width,height:source.height,alpha,renderer:game.renderer.type,displayWidth:ground.displayWidth,displayHeight:ground.displayHeight,monsters:scene.sim.wolves.size,temporaryTextures:scene.textures.getTextureKeys().filter(k=>k.startsWith('woods-ground-')),png};
  });
  assert.equal(state.width,3072);assert.equal(state.height,2048);assert.equal(state.alpha,255,'overlap seams must stay opaque');assert.equal(state.displayWidth,4352);assert.ok(Math.abs(state.displayHeight-2901.333333)<.01);assert.equal(state.monsters,28);assert.deepEqual(state.temporaryTextures,[]);assert.equal(state.renderer,webgl?2:1);
  for(const name of ['northwest','northeast','southwest','southeast'])assert.ok(requests.some(url=>url.includes(`/woods-sections/${name}.webp`)),name);
  assert.ok(!requests.some(url=>/\/woods-ground\.png/.test(url)),'do not load the old whole-map ground');
  if(!webgl)fs.writeFileSync('/tmp/woods-section-composite.png',Buffer.from(state.png,'base64'));
  await page.waitForTimeout(400);await page.screenshot({path:`/tmp/woods-sections-${webgl?'webgl':'canvas'}.png`});assert.deepEqual(errors,[]);console.log(`PASS ${webgl?'WebGL':'Canvas'}: four terrain sections, 3072×2048 texture, opaque seams, released temporary textures, unchanged world footprint and 28 monsters`);await page.close();
 }
 }finally{await browser.close()}})();
