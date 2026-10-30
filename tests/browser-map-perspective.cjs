const{chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.TEST_CLIENT_URL??'http://localhost:5286')+'/map-editor.html');await p.waitForFunction(()=>document.querySelector('#status').textContent.includes('48 × 40'));
 const result=await p.evaluate(async()=>{
  const{paintCliffTile}=await import('/src/cliff-tiles.ts'),{mapObjectTileAssets}=await import('/src/map-object-tiles.ts');
  const average=(ctx,x,y,w,h)=>{const d=ctx.getImageData(x,y,w,h).data;let n=0,sum=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>200){sum+=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;n++;}return sum/n;};
  const face=side=>{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');paintCliffTile(ctx,0,0,'face-bottom',false,0,side);return{mean:average(ctx,0,0,32,32),top:average(ctx,0,2,32,8),bottom:average(ctx,0,24,32,8)}};
  const asset=async key=>{const im=new Image();im.src=mapObjectTileAssets.find(a=>a.key===key).url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return{ctx,w:c.width,h:c.height}};
  const back=await asset('roof-tile-depot-back-field'),front=await asset('roof-tile-depot-front-field'),eave=await asset('roof-tile-depot-front-s');
  const west=await asset('house-wall-w'),east=await asset('house-wall-e');
  return{west:face('west'),east:face('east'),north:face('north'),south:face('south'),roofBack:average(back.ctx,12,12,64,64),roofFront:average(front.ctx,12,12,64,64),eaveTop:average(eave.ctx,12,80,64,2),eaveFront:average(eave.ctx,12,85,64,2),wallWest:average(west.ctx,2,0,8,64),wallEast:average(east.ctx,54,0,8,64),roofSize:[front.w,front.h],wallSize:[west.w,west.h]};
 });
 assert.ok(result.west.mean>result.east.mean+10,'west rock plane brighter than east');assert.ok(result.north.mean>result.south.mean,'rear rock plane lighter than front');assert.ok(result.south.top>result.south.bottom,'front face darkens toward ground contact');assert.ok(result.roofBack>result.roofFront,'rear roof slope lighter than front slope');assert.ok(result.eaveTop>result.eaveFront+15,'eave has lit top and darker vertical fascia');assert.ok(result.wallWest>result.wallEast,'wall side lighting follows the same upper-left source');assert.deepEqual(result.roofSize,[88,88]);assert.deepEqual(result.wallSize,[64,64]);assert.deepEqual(errors,[]);console.log('PASS map perspective: matching cliff/wall/roof lighting, readable front thickness and unchanged native part sizes');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
