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
    for(const id of new Set(visuals.filter(v=>v.roofFor).map(v=>v.roofFor))){
     const b=villageBuildings.find(b=>b.id===id),parts=visuals.filter(v=>v.roofFor===id);
     const wall=visuals.find(v=>v.wallFor===id&&v.wallSide==='sw'&&!!v.upperFor===(region==='elderwood'&&(id==='depot'||id==='hall')));
     const tiles=parts.filter(v=>v.roofPart==='tile'),left=b.x*48-townView.roofOverhang*48,top=Math.min(...tiles.map(v=>v.y));
     const c=document.createElement('canvas');c.width=b.width*64+24;c.height=b.height*64+24;const ctx=c.getContext('2d',{willReadFrequently:true});
     for(const part of parts)ctx.drawImage(s.textures.get(part.key).getSourceImage(),(part.x-left)*4/3,(part.y-top)*4/3,part.w*4/3,part.h*4/3);
     const im={w:c.width,h:c.height,p:ctx.getImageData(0,0,c.width,c.height).data};
     // Measure every pixel in the tiled core, so a seam inside the roof cannot pass.
     for(let y=12;y<im.h-12;y++)for(let x=12;x<im.w-12;x++)if(im.p[(y*im.w+x)*4+3]!==255)throw Error(region+'/'+id+' roof hole at '+x+','+y);
     let minOverlap=Infinity,maxOverlap=-Infinity;
     for(let x=12;x<im.w-12;x++){
      let last=-1;for(let y=0;y<im.h;y++)if(im.p[(y*im.w+x)*4+3]>=128)last=y;
      const overlap=top+(last+1)*3/4-wall.y;minOverlap=Math.min(minOverlap,overlap);maxOverlap=Math.max(maxOverlap,overlap);
     }
     roofs.push({id:region+'/'+id,minOverlap,maxOverlap,wallHeight:townView.wallHeight*48});
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
  await page.evaluate(async()=>{const{villageBuildings}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');window.testSmithy=villageBuildings.find(b=>b.id==='smithy');s.applyTravel('elderwood',{x:testSmithy.x+testSmithy.door+testSmithy.doorWidth/2,y:testSmithy.y+testSmithy.height+.5,stamina:100})});await page.waitForTimeout(400);
  for(const closed of [true,false]){
   const point=await page.evaluate(()=>{const o=s.worldObjects.find(o=>o.getData('townDoor')==='elderwood/smithy'),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return {x:r.x+(o.x+o.displayWidth/2-c.worldView.x)*c.zoom*r.width/s.game.canvas.width,y:r.y+(o.y+o.displayHeight*.65-c.worldView.y)*c.zoom*r.height/s.game.canvas.height}});
   if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   await page.waitForFunction(closed=>s.doors.get('elderwood/smithy')===!closed,closed);
   await page.waitForFunction(closed=>s.worldObjects.find(o=>o.getData('townDoor')==='elderwood/smithy').texture.key===`house-door-2-${closed?'closed':'open'}`,closed);
  }
  for(const inside of [true,false]){
   await page.evaluate(inside=>s.applyTravel('elderwood',{x:testSmithy.x+testSmithy.door+testSmithy.doorWidth/2,y:testSmithy.y+testSmithy.height+(inside?-1.5:.5),stamina:100}),inside);await page.waitForTimeout(150);
   assert.equal(await page.evaluate(inside=>{const parts=s.worldObjects.filter(o=>o.getData('roofFor')==='smithy');return parts.length>30&&parts.every(o=>o.visible===!inside)},inside),true,'the entire tile/ridge/chimney assembly cuts away together');
  }
  await page.screenshot({path:`/tmp/house-joins-${mobile?'mobile':'desktop'}.png`});
  console.log(`PASS ${mobile?'mobile':'desktop'}: seven tiled roofs have no internal seams and their eaves overlap walls, window panels are integrated, both door widths fit flush and clicking toggles the fitted door`);await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
