const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.TEST_CLIENT_URL??'http://localhost:5290')+'/map-editor.html');await p.waitForFunction(()=>document.querySelector('#status').textContent.includes('104 × 96'));
 const result=await p.evaluate(async()=>{const{paintCliffContour,paintCliffTile}=await import('/src/cliff-tiles.ts');const{paintVillageOuterRim}=await import('/src/village-cliffs.ts');const gallery=document.createElement('canvas');gallery.width=128;gallery.height=96;const out=[];
 for(const[i,[dx,dy]]of [[-1,-1],[1,-1],[-1,1],[1,1]].entries())for(const inner of [false,true]){
  const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');const has=inner?(x,y)=>!(x===dx&&y===dy):(x,y)=>(dx<0?x>=0:x<=0)&&(dy<0?y>=0:y<=0);
  paintCliffContour(ctx,0,0,has,true);const data=ctx.getImageData(0,0,32,32).data;let pixels=0,overflow=0;const colors=new Set();for(let y=0;y<32;y++)for(let x=0;x<32;x++){const n=(y*32+x)*4;if(data[n+3]){pixels++;colors.add([data[n],data[n+1],data[n+2]].join(','));if(inner&&((dx<0?x>=8:x<24)||(dy<0?y>=8:y<24)))overflow++;}}
  out.push({i,inner,pixels,overflow,colors:colors.size});gallery.getContext('2d').drawImage(c,i*32,inner?32:0);
 }
 for(let v=0;v<4;v++)paintCliffTile(gallery.getContext('2d'),v*32,64,['nw','ne','sw','se'][v],true,v%3,'south','top');
 const inner=document.createElement('canvas');inner.width=inner.height=32;const corner=inner.getContext('2d');corner.translate(-30*32,-30*32);paintVillageOuterRim(corner,30,30);const raw=corner.getImageData(0,0,32,32).data;let villageCorner=0;for(let i=3;i<raw.length;i+=4)if(raw[i])villageCorner++;
 return{out,villageCorner,image:gallery.toDataURL().split(',')[1]};});
 for(const r of result.out){assert.ok(r.pixels>20,'visible shaped edge/corner');assert.ok(r.colors>5,'rock, turf, highlight and shadow detail');assert.equal(r.overflow,0,'inward corner stays within its native corner footprint');}assert.ok(result.villageCorner>20,'Elderwood inner cliff corner is actually outlined');assert.deepEqual(errors,[]);fs.writeFileSync('/tmp/cliff-contour-pieces.png',Buffer.from(result.image,'base64'));console.log('PASS four convex and four concave native cliff corners, joined cardinal edges and finished rock face ends');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
