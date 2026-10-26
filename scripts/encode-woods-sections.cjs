// Encode generated PNG masters for delivery. This changes the file format only;
// landmark alignment and overlap blending happen in the game terrain renderer.
const fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage(),root=path.resolve(__dirname,'../assets/generated/woods-sections');
 for(const name of ['northwest','northeast','southwest','southeast']){
  const source=await fs.readFile(path.join(root,`${name}.png`));
  const encoded=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);const result=canvas.toDataURL('image/webp',.96);if(!result.startsWith('data:image/webp;'))throw Error('WebP encoding unavailable');return result.split(',')[1];},`data:image/png;base64,${source.toString('base64')}`);
  const output=Buffer.from(encoded,'base64');await fs.writeFile(path.join(root,`${name}.webp`),output);console.log(`${name}: ${source.length} → ${output.length} bytes`);
 }
 }finally{await browser.close()}})();
