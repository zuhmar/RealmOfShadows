/** Code-native modular wall geometry. One unit, one cap thickness, no per-piece fitting. */
const sync=require('node:fs'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const texture=name=>sync.readFileSync(path.join(root,'assets/world/architecture/modular-walls',name+'.png')).toString('base64');
const patterns=['wood','plaster','stone'].map(name=>`<pattern id="${name}Texture" width="80" height="${name==='stone'?12:28}" patternUnits="userSpaceOnUse"><rect width="80" height="28" fill="${name==='wood'?'#aa763d':name==='plaster'?'#d8ccb0':'#77766b'}"/><image href="data:image/png;base64,${texture(name)}" width="80" height="${name==='stone'?12:28}"/></pattern>`).join('');
const defs=`<defs><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#bd8647"/><stop offset="1" stop-color="#855329"/></linearGradient><linearGradient id="plaster" x2="0" y2="1"><stop stop-color="#e1d5b8"/><stop offset="1" stop-color="#bcad8b"/></linearGradient><linearGradient id="stone" x2="0" y2="1"><stop stop-color="#898579"/><stop offset="1" stop-color="#585b54"/></linearGradient>${patterns}</defs>`;
function svg(side,windows=false){
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
  if(windows)for(let cell=0;cell<width/64;cell++){
   const x=cell*64+24;
   art+=`<rect x="${x-3}" y="24" width="34" height="34" rx="2" fill="#694828" stroke="#483522" stroke-width="2"/>
    <rect x="${x}" y="27" width="28" height="27" fill="#527989" stroke="#bd8b4c" stroke-width="2"/>
    <path d="M${x+2} 29L${x+20} 29L${x+2} 47Z" fill="#b5d5d5" opacity=".5"/>
    <path d="M${x+14} 27V54M${x} 40H${x+28}" stroke="#694828" stroke-width="3"/>
    <path d="M${x-5} 56H${x+33}V60H${x-5}Z" fill="url(#woodTexture)" stroke="#634629" stroke-width="2"/>`;
  }
  art+=`<path d="M0 0H${width}V12H0Z" fill="url(#woodTexture)"/><path d="M0 1H${width}M0 11H${width}" stroke="#614224" stroke-width="2"/><path d="M0 4H${width}" stroke="#e0b478" stroke-width="2"/>`;
 }
 // One fixed elevated view: bright cap, occluded join, darker east-facing timber.
 if(vertical){const x=side==='e'?52:0;art+=`<rect x="${x}" y="0" width="12" height="64" fill="${side==='e'?'#172d3440':'#f4ddb919'}"/><path d="M${x+1} 0V64" stroke="#efd1a0" stroke-width="1" opacity=".55"/>`;}
 else art+=`<path d="M0 12H${width}V16H0Z" fill="#332b2440"/><path d="M0 1H${width}" stroke="#f3d5a0" stroke-width="2"/><path d="M0 77H${width}V80H0Z" fill="#272e2b55"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${vertical?64:80}" viewBox="0 0 ${width} ${vertical?64:80}">${defs}${art}</svg>`;
}

function doorSvg(cells,open){
 const width=cells*64,left=14,right=width-14;
 let art=`<path d="M0 0H${width}V19H0Z" fill="url(#woodTexture)"/><path d="M0 1H${width}M0 11H${width}M0 19H${width}" stroke="#614224" stroke-width="2"/><path d="M0 4H${width}" stroke="#e0b478" stroke-width="2"/>
 <path d="M0 12H14V80H0ZM${right} 12H${width}V80H${right}Z" fill="url(#woodTexture)"/>
 <path d="M1 13V79M13 20V79M${right+1} 20V79M${width-1} 13V79" stroke="#614224" stroke-width="2"/>
 <path d="M3 20V66M${right+3} 20V66" stroke="#dfb16b"/>
 <path d="M0 68H14V80H0ZM${right} 68H${width}V80H${right}Z" fill="url(#stoneTexture)" stroke="#48443b" stroke-width="2"/>`;
 if(open){
  art+=`<path d="M${left} 20L${left+22} 30V75L${left} 79Z M${right} 20L${right-22} 30V75L${right} 79Z" fill="url(#woodTexture)" stroke="#4b3524" stroke-width="2"/>`;
  for(const y of [37,64])art+=`<path d="M15 ${y}L34 ${y+4}M${right-1} ${y}L${right-20} ${y+4}" stroke="#4b4a40" stroke-width="4"/>`;
 }else{
  art+=`<path d="M${left} 20H${right}V79H${left}Z" fill="url(#woodTexture)" stroke="#4b3524" stroke-width="2"/>`;
  for(let x=left+16;x<right;x+=16)art+=`<path d="M${x} 21V78" stroke="#6b4829" stroke-width="2"/>`;
  for(const y of [34,65])art+=`<path d="M16 ${y}H${width/2-5}M${width/2+5} ${y}H${right-2}" stroke="#494a41" stroke-width="5"/>`;
  art+=`<path d="M${width/2} 20V79" stroke="#493324" stroke-width="3"/>`;
  for(const x of [width/2-9,width/2+9])art+=`<circle cx="${x}" cy="50" r="4" fill="none" stroke="#d4ae54" stroke-width="2"/>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="80" viewBox="0 0 ${width} 80">${defs}${art}</svg>`;
}
(async()=>{
 const folder=path.join(root,'assets/world/architecture/modular-walls');await fs.mkdir(folder,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  const save=async(key,source)=>{
   await fs.writeFile(path.join(folder,key.replace(/^wall-/,'')+'.svg'),source);
   const data=await page.evaluate(async source=>{
    const im=new Image();im.src='data:image/svg+xml;base64,'+btoa(source);await im.decode();
    const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);return c.toDataURL().split(',')[1];
   },source);
   await fs.writeFile(path.join(root,'assets/world/objects/house-'+key+'.png'),Buffer.from(data,'base64'));
  };
  for(const side of ['n','s','e','w','nw','ne','sw','se','n-half','s-half'])await save('wall-'+side,svg(side));
  for(const side of ['n','s','n-half','s-half'])await save('wall-'+side+'-window',svg(side,true));
  for(const cells of [2,3])for(const open of [true,false])await save(`door-${cells}-${open?'open':'closed'}`,doorSvg(cells,open));
 }finally{await browser.close()}
 console.log('Built fitted walls, four integrated window panels and four full-width door frames');
})();
