const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{for(const mobile of [false,true]){
 const p=await b.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile}),errors=[];p.on('pageerror',e=>errors.push(e.message));await require('./helpers/browser-room.cjs')(p,true);await p.goto(process.env.TEST_CLIENT_URL??'http://localhost:5366');await p.locator('#play-guest').click();await p.evaluate(async()=>{const{game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});await p.waitForFunction(()=>s.entryReady);
 const result=await p.evaluate(()=>{
  s.applyTravel('woods',{x:34.5,y:26.5,stamina:100});s.game.loop.sleep();
  try{
   const w=s.sim.wolves.get('wolf-1'),start={x:w.x,y:w.y},actions=new Set();let moved=false,paused=false;
   for(let i=0;i<300;i++){
    s.sim.tick(.1,[]);s.renderCombat(100);
    const view=s.wolfViews.get(w.id),sprite=view.getData('sprite');
    actions.add(sprite.anims.currentAnim.key);
    if(Math.hypot(w.x-start.x,w.y-start.y)>.1)moved=true;
    if(moved&&w.mode==='idle')paused=true;
   }
   return{moved,paused,actions:[...actions],target:w.target};
  }finally{s.game.loop.wake()}
 });assert.ok(result.moved);assert.ok(result.paused);assert.equal(result.target,'');assert.ok(result.actions.some(k=>k.includes('-walk-')));assert.ok(result.actions.some(k=>k.includes('-idle-')));assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile':'desktop'} wandering position, walk animation and idle pauses`);await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
