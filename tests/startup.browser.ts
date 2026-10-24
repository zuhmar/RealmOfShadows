import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const scratch=await mkdtemp(join(tmpdir(),'realm-startup-')),children:ChildProcess[]=[];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
async function stop(child:ChildProcess){if(child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done;}}
try{
 for(const [i,scenario] of [
  {name:'invalid account URL',url:'not-a-url',available:false},
  {name:'normal project URL',url:'https://test-project.supabase.co',available:true},
  {name:'pasted API path and whitespace',url:'  https://test-project.supabase.co/rest/v1/  ',available:true},
  {name:'missing account configuration',url:'',available:false},
  {name:'quoted project configuration',url:'"https://test-project.supabase.co"',available:true,key:'"test-publishable-key"'},
  {name:'project address without scheme',url:'test-project.supabase.co',available:true}
 ].entries()){
 const outDir=join(scratch,String(i));const build=spawn(process.execPath,['node_modules/vite/bin/vite.js','build','apps/client','--outDir',outDir,'--emptyOutDir'],{env:{...process.env,VITE_SUPABASE_URL:scenario.url,VITE_SUPABASE_PUBLISHABLE_KEY:'key' in scenario?scenario.key:' test-publishable-key ',VITE_SERVER_URL:'ws://127.0.0.1:1'},stdio:['ignore','pipe','pipe']});let logs='';build.stdout.on('data',d=>logs+=d);build.stderr.on('data',d=>logs+=d);const [code]=await once(build,'exit');assert.equal(code,0,logs);
 const port=5195+i,preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','apps/client','--outDir',outDir,'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'});children.push(preview);
 for(let n=0;n<100;n++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}if(n===99)throw Error('Preview did not start');await wait(50);}
 const context=await browser.newContext(),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,k:string,...a:any[]){return ['webgl','webgl2','experimental-webgl'].includes(k)?null:(get as any).call(this,k,...a);} as typeof get;});
 await page.goto(`http://127.0.0.1:${port}`);await page.locator('#login-dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');assert.equal(await page.locator('#login-dialog').isVisible(),true);await page.locator('#play-guest').click();await page.waitForFunction(()=>document.querySelector('#connection')!.textContent!.includes('Local preview'));assert.equal(await page.locator('#game canvas').count(),1);
 // A rendered map/portrait and working modal prove scene creation completed,
 // rather than just asserting that the static HUD HTML loaded.
 const painted=await page.locator('#profile-portrait').evaluate((c:HTMLCanvasElement)=>Array.from(c.getContext('2d')!.getImageData(0,0,c.width,c.height).data).some((v,i)=>i%4===3&&v>0));assert.equal(painted,true);
 await page.locator('#character-panel').click();await page.locator('#character-dialog').waitFor({state:'visible'});assert.equal(await page.locator('#sign-in').isEnabled(),scenario.available);await page.locator('#close-character').click();await page.locator('#character-dialog').waitFor({state:'hidden'});assert.deepEqual(errors,[]);
 console.log(`PASS production startup: ${scenario.name} renders game and working profile`);await context.close();await stop(preview);
 }
}finally{await browser.close();for(const child of children)await stop(child);await rm(scratch,{recursive:true,force:true});}
