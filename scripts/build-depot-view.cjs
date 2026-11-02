/** Depot benchmark: sprite geometry changes; native grid/collision coordinates stay square. */
const fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{const root=path.resolve(__dirname,'..'),folder=path.join(root,'assets/world/architecture/depot-view');await fs.mkdir(folder,{recursive:true});const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage();
 const save=async(key,svg)=>{await fs.writeFile(path.join(folder,key+'.svg'),svg);const data=await p.evaluate(async svg=>{const im=new Image();im.src='data:image/svg+xml;base64,'+btoa(svg);await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c.toDataURL().split(',')[1]},svg);await fs.writeFile(path.join(root,'assets/world/objects',key+'.png'),Buffer.from(data,'base64'))};
 const files=await fs.readdir(path.join(root,'assets/world/architecture/modular-walls'));
 for(const file of files.filter(f=>f.endsWith('.svg'))){const name=file.startsWith('door-')?file:'wall-'+file;const source=await fs.readFile(path.join(root,'assets/world/architecture/modular-walls',file),'utf8'),w=+source.match(/width="(\d+)"/)[1],h=+source.match(/height="(\d+)"/)[1],body=source.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');let svg;
  if(/^wall-e/.test(name)){
   const window=file.includes('window')?'<path d="M66 37L73 72V94L66 59Z" fill="#2d4651" stroke="#6d4d2f" stroke-width="2"/><path d="M69 51L69 73" stroke="#a7c6c8"/>':'';
   svg=`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="144"><path d="M64 0V64L80 144V80Z" fill="#b6a585" stroke="#594b36"/><path d="M64 0V64L66 74V10Z" fill="#ead5a4"/><path d="M64 48L80 128V137L64 57Z" fill="#716e60"/><path d="M64 0L80 80V89L64 9ZM64 46L80 126V134L64 54Z" fill="#79502e"/>${window}<g transform="translate(0 0)">${body}</g></svg>`;
  }else if(/^wall-w/.test(name)){svg=source;}
  else svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w+16}" height="${h}"><g transform="matrix(1 0 .2 1 0 0)">${body}</g></svg>`;
  await save('house-depot-'+name.replace('.svg',''),svg);
  if(name==='wall-e.svg')await save('house-depot-wall-e-short',svg.replace('height="144"','height="132"').replace('V64L80 144V80','V52L80 132V80').replace('V64L66 74V10','V52L66 62V10').replace('M64 48L80 128V137L64 57','M64 36L80 116V125L64 45').replace('M64 46L80 126V134L64 54','M64 34L80 114V122L64 42').replace(`<g transform="translate(0 0)">${body}</g>`,`<svg width="64" height="52">${body}</svg>`));
  if(name==='wall-w.svg')await save('house-depot-wall-w-short',source.replace('height="64"','height="52"'));

 }
 const wood=(await fs.readFile(path.join(root,'assets/world/architecture/modular-walls/wood.png'))).toString('base64');
 for(const family of ['counter','table','bench','shelf'])for(const end of ['single','start','middle','end','corner-nw','corner-ne','corner-sw','corner-se']){
  const right=end==='single'||end==='end',open=family==='table'||family==='bench';
  const legs=open?'<path d="M10 44H17V76H10ZM63 44H70V76H63Z" fill="#76502f" stroke="#453326" stroke-width="2"/>':'<path d="M8 40H72V76H8Z" fill="url(#wood)"/><path d="M8 48H72M8 74H72" stroke="#5b3c29" stroke-width="3"/>';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><defs><pattern id="wood" width="64" height="64" patternUnits="userSpaceOnUse"><image href="data:image/png;base64,${wood}" width="64" height="64"/></pattern></defs>${legs}<path d="M0 8H64L72 40H8Z" fill="url(#wood)" stroke="#6c482c"/><path d="M2 16H66M4 24H68M6 32H70" stroke="#573d29" opacity=".45"/><path d="M0 8H64" stroke="#eac28b" stroke-width="2"/><path d="M8 40H72V46H8Z" fill="#805330"/><path d="M8 40H72" stroke="#e2b279"/>${right?'<path d="M64 8L72 40V76L64 44Z" fill="#65472f" stroke="#44372b"/><path d="M64 8L72 40V45L64 13Z" fill="#b48654"/>':''}${family==='shelf'?'<path d="M8 12H58L63 32H13Z" fill="#473b2e"/><path d="M17 16L20 29M27 16L30 29M38 16L41 29M49 16L52 29" stroke="#84968a" stroke-width="6"/>':''}</svg>`;
  await save(`house-depot-furniture-${family}-${end}`,svg);
 }
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
