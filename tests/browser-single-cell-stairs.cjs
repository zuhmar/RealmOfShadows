const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.TEST_CLIENT_URL??'http://localhost:5290')+'/map-editor.html');await p.waitForFunction(()=>document.querySelector('#status').textContent.includes('104 × 96'));
 const result=await p.evaluate(async()=>{
  const {paintCliffTile}=await import('/src/cliff-tiles.ts'),{paintCliffStairs}=await import('/src/village-cliffs.ts'),{paintRidge,paintLedge}=await import('/src/stacked-floors.ts');
  const {elderwoodRimStairs,elderwoodStairTile,woodsRidges}=await import('/@fs/workspace/RealmOfShadows/packages/game-data/src/index.ts');
  const sheet=document.createElement('canvas');sheet.width=128;sheet.height=32;const tiles=[];
  for(const [i,side]of ['north','south','east','west'].entries()){
   const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');paintCliffTile(ctx,0,0,'stairs-'+side,true);
   const d=ctx.getImageData(0,0,32,32).data;let transparent=0,light=0,dark=0;for(let n=0;n<d.length;n+=4){if(!d[n+3])transparent++;else if(d[n]>180)light++;else if(d[n]<120)dark++;}
   sheet.getContext('2d').drawImage(c,i*32,0);tiles.push({side,transparent,light,dark});
  }
  const flights=[];
  for(const s of elderwoodRimStairs)for(const upper of [false,true]){
   const c=document.createElement('canvas');c.width=3328;c.height=3072;const ctx=c.getContext('2d'),calls=[];const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(...a)=>{calls.push({x:a[1],y:a[2],width:a[0].width,height:a[0].height,args:a.length});draw(...a)};paintCliffStairs(ctx,s,upper);const point=elderwoodStairTile(s);flights.push({id:s.id,upper,calls,expected:{x:Math.floor(point.x)*32,y:Math.floor(point.y)*32}});
  }
  const c=document.createElement('canvas');c.width=3072;c.height=2304;const ctx=c.getContext('2d'),atlas=document.createElement('canvas');atlas.width=1024;atlas.height=32;
  const woods=[];let last;const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(...a)=>{last={x:a[1],y:a[2],width:a[0].width,height:a[0].height,args:a.length};draw(...a)};
  for(const r of woodsRidges)for(const upper of [false,true]){paintRidge(ctx,atlas,r,undefined,upper);woods.push({last,expected:{x:Math.floor(r.stair.x)*32,y:Math.floor(r.stair.y+(upper?0:3))*32}});}
  for(const upper of [false,true]){paintLedge(ctx,atlas,false,undefined,upper);woods.push({last,expected:{x:96,y:upper?64:192}});}
  return {tiles,flights,woods,sheet:sheet.toDataURL().split(',')[1]};
 });
 for(const t of result.tiles){assert.ok(t.transparent>100,t.side+' has a staircase silhouette');assert.ok(t.light>100,t.side+' has broad bright treads');assert.ok(t.dark>80,t.side+' has dark risers and a solid side face');}
 for(const f of result.flights){assert.equal(f.calls.length,1,'one complete flight per transition');assert.deepEqual(f.calls[0],{...f.expected,width:32,height:32,args:3});}
 for(const w of result.woods)assert.deepEqual(w.last,{...w.expected,width:32,height:32,args:3});
 assert.deepEqual(errors,[]);fs.writeFileSync('/tmp/single-cell-stairs.png',Buffer.from(result.sheet,'base64'));console.log('PASS four transparent one-cell stair sprites, one flight per Elderwood and Woods transition, matching both floor locations');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
