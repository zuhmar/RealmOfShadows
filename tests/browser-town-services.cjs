const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{for(const mobile of [false,true])for(const offline of [true,false]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await require('./helpers/browser-room.cjs')(page,offline);await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5269');await page.locator('#play-guest').click();await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});await page.waitForFunction(offline=>s.entryReady&&!!s.bag&&(offline||s.doors.size===5),offline);
 assert.equal(await page.evaluate(()=>s.worldObjects.filter(o=>o.getData('townService')).length),4);
 assert.equal(await page.evaluate(()=>s.worldObjects.filter(o=>o.getData('townService')).every(o=>!o.visible)),true,'NPCs hide under exterior roof');
 const walk=async goal=>{await page.evaluate(async goal=>{const {pathfind}=await import('/@fs/workspace/RealmOfShadows/packages/shared/src/index.ts');s.route=pathfind(s.local,goal,s.region,s.occupied());if(!s.route.length&&Math.hypot(s.local.x-goal.x,s.local.y-goal.y)>.1)throw Error('No service route '+JSON.stringify(goal))},goal);await page.waitForFunction(goal=>!s.route.length&&Math.hypot(s.local.x-goal.x,s.local.y-goal.y)<.06,goal,{timeout:30000});};
 await walk({x:6.5,y:17.5});
 const stations=await page.evaluate(async()=>{const {craftingStations}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');return craftingStations.filter(s=>'npc'in s)});
 const cases=[['mining','smelt-copper','copperOre',3,'copperBar'],['woodcutting','cut-timber','log',2,'timber'],['fishing','cook-fish','rawFish',2,'cookedFish'],['herbalism','brew-potion','herb',3,'potion']];
 for(const [i,station]of stations.entries()){
  const bench=i%2===1;await page.waitForTimeout(350);
  const point=await page.evaluate(({id,bench})=>{const o=s.worldObjects.find(o=>o.getData(bench?'townBench':'townService')===id),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;if(!o)throw Error('Missing station '+id);const x=o.x+(bench?o.displayWidth/2:0),y=o.y+(bench?o.displayHeight*.8:-38);return {x:r.x+(x-c.worldView.x)*c.zoom*r.width/s.game.canvas.width,y:r.y+(y-c.worldView.y)*c.zoom*r.height/s.game.canvas.height}},{id:station.id,bench});
  if(mobile){const within=point.x>=0&&point.x<390&&point.y>=0&&point.y<844;if(!within)await walk({x:station.x,y:16.5});}
  const click=await page.evaluate(({id,bench})=>{const o=s.worldObjects.find(o=>o.getData(bench?'townBench':'townService')===id),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return {x:r.x+(o.x+(bench?o.displayWidth/2:0)-c.worldView.x)*c.zoom*r.width/s.game.canvas.width,y:r.y+(o.y+(bench?o.displayHeight*.8:-38)-c.worldView.y)*c.zoom*r.height/s.game.canvas.height}},{id:station.id,bench});
  if(mobile)await page.touchscreen.tap(click.x,click.y);else await page.mouse.click(click.x,click.y);
  await page.locator('#inventory-dialog').waitFor({state:'visible'});await page.waitForFunction(name=>document.querySelector('#inventory-title').textContent===name,station.name);
  assert.equal(await page.locator('#town-service-panel button').count(),station.id==='smithy'?2:1,'one profession per NPC');
  const [pair,recipe,material,quantity,output]=cases[i];assert.equal(await page.locator(`[data-profession="${pair}"]`).getAttribute('open'),'');
  if(offline){await page.evaluate(({material,quantity,i})=>{const profile=s.economy.profiles.get('local');profile.inventory=[{id:101+i,item:material,quantity}];if(i===0)profile.gear=[{id:crypto.randomUUID(),base:'copperArmor'}];s.bag=s.economy.snapshot('local',s.sim.time);s.inventoryRenderKey='';s.renderInventory()},{material,quantity,i});await page.locator(`[data-recipe="${recipe}"] button`).click();await page.waitForFunction(output=>s.bag.inventory.some(item=>item.item===output),output);
   if(i===0){const gold=await page.evaluate(()=>s.bag.gold);await page.getByRole('button',{name:'Identify equipment · Free',exact:true}).click();await page.locator('[data-gear-action="identify"]').click();await page.waitForFunction(()=>!!s.bag.gear[0].rarity);assert.equal(await page.evaluate(()=>s.bag.gold),gold);}
  }
  await page.locator('#close-inventory').click();console.log(`PASS ${mobile?'mobile':'desktop'} ${offline?'guest':'multiplayer'}: ${station.name} via ${bench?'custom bench':'NPC'}, dedicated recipe panel${offline?' and craft':''}`);
 }
 await page.screenshot({path:`/tmp/crafting-hall-${mobile?'mobile':'desktop'}-${offline?'guest':'online'}.png`});await walk({x:7.5,y:18.5});
 assert.equal(await page.evaluate(()=>s.worldObjects.filter(o=>o.getData('townService')).every(o=>!o.visible)),true);
 assert.equal(await page.evaluate(()=>s.worldObjects.filter(o=>o.getData('townBench')).every(o=>!o.input.enabled)),true);
 assert.equal(await page.evaluate(()=>s.worldObjects.filter(o=>o.getData('roofFor')==='workshop').every(o=>o.visible)),true);
 assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
