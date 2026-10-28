const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  await page.route('**/matchmake/**',r=>r.abort());await page.goto(process.env.TEST_CLIENT_URL??'http://localhost:5265');await page.locator('#play-guest').click();
  await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);window.s=game.scene.scenes[0]});await page.waitForFunction(()=>s.entryReady&&!!s.bag);
  const checks=await page.evaluate(async()=>{
   const {buildingVisuals,gridMap,villageBuildings,townView,townDoorTexture}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');
   const raster=key=>{const im=s.textures.get(key).getSourceImage(),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);return {w:c.width,h:c.height,p:ctx.getImageData(0,0,c.width,c.height).data}};
   const roofs=[];
   for(const region of ['elderwood','elderwood-upper']){
    const visuals=buildingVisuals(region,gridMap(region).objects);
    if(visuals.some(v=>v.key==='town-window'))throw Error('Loose window overlay in '+region);
    for(const roof of visuals.filter(v=>v.roofFor)){
     const b=villageBuildings.find(b=>b.id===roof.roofFor),wall=visuals.find(v=>v.wallFor===b.id&&v.wallSide==='sw'&&!!v.upperFor===(region==='elderwood'&&(b.id==='depot'||b.id==='hall'))),im=raster(roof.key);
     let minOverlap=Infinity,maxOverlap=-Infinity;
     for(let column=0;column<b.width*64;column++){
      const worldX=b.x*48+(column+.5)*48/64,nativeX=Math.max(0,Math.min(im.w-1,Math.floor((worldX-roof.x)/roof.w*im.w)));
      let last=-1;for(let y=0;y<im.h;y++)if(im.p[(y*im.w+nativeX)*4+3]>=128)last=y;
      const overlap=roof.y+(last+1)/im.h*roof.h-wall.y;minOverlap=Math.min(minOverlap,overlap);maxOverlap=Math.max(maxOverlap,overlap);
     }
     roofs.push({id:region+'/'+b.id,minOverlap,maxOverlap,wallHeight:townView.wallHeight*48});
    }
   }
   const doors=[];
   for(const width of [2,3])for(const open of [true,false]){
    const im=raster(townDoorTexture(width,open));let edgeAlpha=255;
    for(let y=0;y<im.h;y++)for(const x of [0,im.w-1])edgeAlpha=Math.min(edgeAlpha,im.p[(y*im.w+x)*4+3]);
    doors.push({width,open,nativeWidth:im.w,nativeHeight:im.h,edgeAlpha,centerAlpha:im.p[(50*im.w+im.w/2)*4+3]});
   }
   return {roofs,doors};
  });
  for(const roof of checks.roofs){assert.ok(roof.minOverlap>=0,roof.id+' has an eave gap');assert.ok(roof.maxOverlap<roof.wallHeight,roof.id+' roof must not swallow the facade');}
  for(const door of checks.doors){assert.equal(door.nativeWidth,door.width*64);assert.equal(door.nativeHeight,80);assert.equal(door.edgeAlpha,255,'door jambs meet the adjacent wall along their whole height');assert.equal(door.centerAlpha,door.open?0:255,'open door remains a clear passage');}
  await page.evaluate(()=>s.applyTravel('elderwood',{x:24.5,y:8.5,stamina:100}));await page.waitForTimeout(400);
  for(const closed of [true,false]){
   const point=await page.evaluate(()=>{const o=s.worldObjects.find(o=>o.getData('townDoor')==='elderwood/smithy'),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return {x:r.x+(o.x+o.displayWidth/2-c.worldView.x)*c.zoom*r.width/s.game.canvas.width,y:r.y+(o.y+o.displayHeight*.65-c.worldView.y)*c.zoom*r.height/s.game.canvas.height}});
   if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   await page.waitForFunction(closed=>s.doors.get('elderwood/smithy')===!closed,closed);
   await page.waitForFunction(closed=>s.worldObjects.find(o=>o.getData('townDoor')==='elderwood/smithy').texture.key===`house-door-2-${closed?'closed':'open'}`,closed);
  }
  await page.screenshot({path:`/tmp/house-joins-${mobile?'mobile':'desktop'}.png`});
  console.log(`PASS ${mobile?'mobile':'desktop'}: seven roof eaves overlap walls, window panels are integrated, both door widths fit flush and clicking toggles the fitted door`);await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
