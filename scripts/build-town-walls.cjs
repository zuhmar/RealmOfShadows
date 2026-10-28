/** Code-native modular wall geometry. One unit, one cap thickness, no per-piece fitting. */
const sync=require('node:fs'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const texture=name=>sync.readFileSync(path.join(root,'assets/world/architecture/modular-walls',name+'.png')).toString('base64');
const patterns=['wood','plaster','stone'].map(name=>`<pattern id="${name}Texture" width="80" height="${name==='stone'?12:28}" patternUnits="userSpaceOnUse"><rect width="80" height="28" fill="${name==='wood'?'#aa763d':name==='plaster'?'#d8ccb0':'#77766b'}"/><image href="data:image/png;base64,${texture(name)}" width="80" height="${name==='stone'?12:28}"/></pattern>`).join('');
const defs=`<defs><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#bd8647"/><stop offset="1" stop-color="#855329"/></linearGradient><linearGradient id="plaster" x2="0" y2="1"><stop stop-color="#e1d5b8"/><stop offset="1" stop-color="#bcad8b"/></linearGradient><linearGradient id="stone" x2="0" y2="1"><stop stop-color="#898579"/><stop offset="1" stop-color="#585b54"/></linearGradient>${patterns}</defs>`;
function svg(side){
 const vertical=side==='e'||side==='w',width=side==='n'||side==='s'?128:64;
 let art='';
 if(vertical){const x=side==='e'?52:0;art=`<path d="M${x} 0H${x+12}V64H${x}Z" fill="url(#woodTexture)"/><path d="M${x+1} 0V64M${x+11} 0V64" stroke="#533b25" stroke-width="2"/><path d="M${x+4} 0V64" stroke="#deb16c" opacity=".65"/>`;}
 else{
  // Face and cap are identical across full panels, halves and all four corners.
  art=`<path d="M0 11H${width}V79H0Z" fill="url(#plasterTexture)"/><path d="M0 67H${width}V79H0Z" fill="url(#stoneTexture)"/><path d="M0 68H${width}M0 79H${width}" stroke="#48443b" stroke-width="2"/>`;
  for(let x=16;x<width;x+=32)art+=`<path d="M${x} 69V78" stroke="#535249" stroke-width="2"/>`;
  art+=`<path d="M0 11H${width}V19H0ZM0 59H${width}V67H0Z" fill="url(#woodTexture)"/><path d="M0 19H${width}M0 59H${width}" stroke="#614629" stroke-width="2"/>`;
  const posts=side.endsWith('w')?[0]:side.endsWith('e')?[52]:Array.from({length:width/64},(_,i)=>i*64);
  for(const post of posts)art+=`<path d="M${post} 12H${post+12}V68H${post}Z" fill="url(#woodTexture)" stroke="#654728" stroke-width="2"/><path d="M${post+3} 14V65" stroke="#d7a766"/>`;
  art+=`<path d="M0 0H${width}V12H0Z" fill="url(#woodTexture)"/><path d="M0 1H${width}M0 11H${width}" stroke="#614224" stroke-width="2"/><path d="M0 4H${width}" stroke="#e0b478" stroke-width="2"/>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${vertical?64:80}" viewBox="0 0 ${width} ${vertical?64:80}">${defs}${art}</svg>`;
}
(async()=>{const folder=path.join(root,'assets/world/architecture/modular-walls');await fs.mkdir(folder,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await browser.newPage();for(const side of ['n','s','e','w','nw','ne','sw','se','n-half','s-half']){let source=svg(side);if(side.endsWith('-half'))source=source.replaceAll('128','64');await fs.writeFile(path.join(folder,side+'.svg'),source);const data=await page.evaluate(async source=>{const im=new Image();im.src='data:image/svg+xml;base64,'+btoa(source);await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);return c.toDataURL().split(',')[1]},source);await fs.writeFile(path.join(root,'assets/world/objects/house-wall-'+side+'.png'),Buffer.from(data,'base64'));}}finally{await browser.close()}console.log('Built shared 12px-cap modular walls and flush corners');})();
