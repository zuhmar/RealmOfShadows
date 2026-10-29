const {chromium}=require('playwright'),assert=require('node:assert/strict'),{Client}=require('colyseus.js');
(async()=>{const {walkTo}=await import('./helpers/walk.ts'),b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{for(const mobile of [false,true])for(const offline of [true,false]){
 const p=await b.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile}),errors=[];p.on('pageerror',e=>errors.push(e.message));let peer;
 try{
 await require('./helpers/browser-room.cjs')(p,offline);await p.goto(process.env.TEST_CLIENT_URL??'http://localhost:5281');await p.locator('#play-guest').click();await p.evaluate(async()=>{const{game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});await p.waitForFunction(offline=>s.entryReady&&!!s.bag&&(offline||!!s.room?.state.players.get(s.room.sessionId)),offline);
 await p.evaluate(async offline=>{if(offline){const{portalFor}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');s.applyTravel('woods',{...portalFor('woods').arrival,stamina:100})}else s.room.send('travel','woods')},offline);await p.waitForFunction(()=>s.region==='woods');
 const walk=async goal=>{await p.evaluate(async goal=>{const{pathfind}=await import('/@fs/workspace/RealmOfShadows/packages/shared/src/index.ts');s.route=pathfind(s.local,goal,s.region,s.occupied());if(!s.route.length)throw Error('No ledge route')},goal);await p.waitForFunction(g=>!s.route.length&&Math.hypot(s.local.x-g.x,s.local.y-g.y)<.06,goal,{timeout:30000});};
 await walk({x:40.5,y:10.5});await p.evaluate(mobile=>s.cameras.main.setZoom(mobile?.5:.7),mobile);await p.waitForTimeout(500);await p.waitForFunction(()=>[...s.wolfViews.keys()].filter(id=>id.startsWith('ledge-wolf-')).length===3);
 const click=async point=>{const pos=await p.evaluate(({x,y})=>{const r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return{x:r.x+(x-c.worldView.x)*c.zoom*r.width/s.game.canvas.width,y:r.y+(y-c.worldView.y)*c.zoom*r.height/s.game.canvas.height}},point);if(mobile)await p.touchscreen.tap(pos.x,pos.y);else await p.mouse.click(pos.x,pos.y);};
 const monsterPoint=()=>p.evaluate(()=>{const v=s.wolfViews.get('ledge-wolf-2');return{x:v.x,y:v.y-25}});
 await click(await monsterPoint());await p.waitForFunction(()=>document.querySelector('#notice').textContent.includes('another floor'));assert.equal(await p.evaluate(()=>s.selected),'');
 if(!offline){
  peer=await new Client(process.env.TEST_SERVER_URL??'ws://localhost:2691').joinById(await p.evaluate(()=>s.room.roomId));for(const e of ['economy-state','economy-result','combat-event','combat-error','travel-complete','travel-error'])peer.onMessage(e,()=>{});
  const until=async f=>{for(let i=0;i<400;i++){if(f())return;await new Promise(r=>setTimeout(r,50));}throw Error('Peer floor timeout')};await until(()=>!!peer.state.players?.get(peer.sessionId));peer.send('travel','woods');await until(()=>peer.state.players.get(peer.sessionId).region==='woods');await walkTo(peer,{x:40.5,y:9.5},1);peer.send('stairs','woods-ledge-up');await until(()=>peer.state.players.get(peer.sessionId).region==='woods-upper');await p.waitForFunction(id=>s.peers.get(id)?.getData('target')?.region==='woods-upper',peer.sessionId);
 }
 await p.screenshot({path:`/tmp/ledge-below-${mobile?'mobile':'desktop'}-${offline?'guest':'online'}.png`});
 const stairPoint=id=>p.evaluate(id=>{const v=s.worldObjects.find(o=>o.getData('stair')===id);return{x:v.x,y:v.y}},id);
 await click(await stairPoint('woods-ledge-up'));await p.waitForFunction(()=>s.region==='woods-upper');await p.waitForTimeout(500);
 await click(await monsterPoint());await p.waitForFunction(()=>{const wolves=s.preview?s.sim.wolves:s.room.state.wolves;return wolves.get('ledge-wolf-2').hp<65});await p.evaluate(()=>{s.selected='';s.cast('stop')});
 await p.screenshot({path:`/tmp/ledge-upper-${mobile?'mobile':'desktop'}-${offline?'guest':'online'}.png`});await click(await stairPoint('woods-ledge-down'));await p.waitForFunction(()=>s.region==='woods');assert.deepEqual(errors,[]);
 console.log(`PASS ${mobile?'mobile':'desktop'} ${offline?'guest':'multiplayer'}: visible upper wolves${peer?' and player':''}, floor attack rejection, real approach, climb, combat and descent`);
 }finally{if(peer)await peer.leave(true);await p.close()}
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
