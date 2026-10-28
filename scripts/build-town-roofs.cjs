/** Modular, code-native roof tiles. 64px core; 12px matching overhang; no whole-roof scaling. */
const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'assets/world/architecture/modular-roofs');
const palettes={depot:['#7894a7','#415d73','#243949'],smithy:['#dc8151','#ae442b','#662e23'],workshop:['#a98254','#705038','#443527'],bank:['#78a090','#3c7061','#25483e'],hall:['#6596bf','#35638c','#203d5d']};
const wood=sync.readFileSync(path.join(root,'assets/world/architecture/modular-walls/wood.png')).toString('base64');
const stone=sync.readFileSync(path.join(root,'assets/world/architecture/modular-walls/stone.png')).toString('base64');
const material=`<pattern id="wood" width="80" height="28" patternUnits="userSpaceOnUse"><rect width="80" height="28" fill="#aa763d"/><image href="data:image/png;base64,${wood}" width="80" height="28"/></pattern><pattern id="stone" width="40" height="16" patternUnits="userSpaceOnUse"><rect width="40" height="16" fill="#77766b"/><image href="data:image/png;base64,${stone}" width="40" height="16"/></pattern>`;
function shingles(name,palette,back){
 const [light,mid,dark]=palette;
 let cells='';
 for(const [y,offset]of [[0,0],[16,-16]])for(let x=offset;x<64;x+=32)cells+=`<rect x="${x+.5}" y="${y+.5}" width="31" height="15" rx="2" fill="url(#${name}-shade)" stroke="${dark}"/><path d="M${x+4} ${y+3}H${x+26}" stroke="${light}" opacity=".65"/><path d="M${x+7} ${y+9}L${x+19} ${y+10}" stroke="${light}" opacity=".15"/>`;
 return `<linearGradient id="${name}-shade" x2="0" y2="1"><stop stop-color="${back?light:mid}"/><stop offset="1" stop-color="${back?mid:dark}"/></linearGradient><pattern id="${name}" width="64" height="32" x="12" y="12" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill="${dark}"/>${cells}</pattern>`;
}
function tile(palette,slope,edge){
 const sides=edge==='field'?'':edge;
 const left=sides.includes('w')?0:12,right=sides.includes('e')?88:76,top=sides.includes('n')?0:12,bottom=sides.includes('s')?88:76;
 const plane=slope==='join'?`<rect x="${left}" y="${top}" width="${right-left}" height="${44-top}" fill="url(#back)"/><rect x="${left}" y="44" width="${right-left}" height="${bottom-44}" fill="url(#front)"/>`:`<rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" fill="url(#${slope})"/>`;
 let beams='';
 if(sides.includes('n'))beams+=`<path d="M${left} 0H${right}V8H${left}Z"/>`;
 if(sides.includes('s'))beams+=`<path d="M${left} 80H${right}V88H${left}Z"/>`;
 if(sides.includes('w'))beams+=`<path d="M0 ${top}H8V${bottom}H0Z"/>`;
 if(sides.includes('e'))beams+=`<path d="M80 ${top}H88V${bottom}H80Z"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><defs>${material}${shingles('back',palette,true)}${shingles('front',palette,false)}</defs>${plane}<g fill="url(#wood)" stroke="#654528" stroke-width="1">${beams}</g></svg>`;
}
function ridge(palette,end){
 const left=end==='w'?0:12,right=end==='e'?88:76;
 let bands='';for(let x=12;x<76;x+=16)bands+=`<path d="M${x} 4V18" stroke="${palette[2]}" stroke-width="2"/><path d="M${x+3} 5V16" stroke="${palette[0]}" opacity=".5"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="24"><defs><linearGradient id="cap" x2="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset=".4" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient></defs><path d="M${left} 3H${right}V20H${left}Z" fill="url(#cap)" stroke="${palette[2]}" stroke-width="2"/><path d="M${left} 5H${right}" stroke="${palette[0]}" stroke-width="2"/>${bands}</svg>`;
}
function chimney(){return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="96"><defs>${material}</defs><path d="M10 36H50V87L10 93Z" fill="url(#stone)" stroke="#4b453c" stroke-width="2"/><path d="M50 36L59 30V80L50 87Z" fill="#55574e" stroke="#423d34" stroke-width="2"/><path d="M9 36L18 28H59L50 37Z" fill="#b5aa8f" stroke="#685b48" stroke-width="2"/><path d="M11 52H49M11 68H49M11 84H49M27 38V51M36 53V67M25 69V83" stroke="#4d4b42" stroke-width="2"/><path d="M23 12H46V33Q35 40 23 33Z" fill="#b87840" stroke="#5e3b24" stroke-width="2"/><ellipse cx="34.5" cy="12" rx="13" ry="7" fill="#d49b61" stroke="#6b4328" stroke-width="2"/><ellipse cx="34.5" cy="12" rx="8" ry="4" fill="#39291e"/><path d="M26 20V30" stroke="#e4b97c" stroke-width="2"/></svg>`;}
(async()=>{
 await fs.mkdir(folder,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{const page=await browser.newPage();
  const save=async(key,source)=>{await fs.writeFile(path.join(folder,key+'.svg'),source);const data=await page.evaluate(async source=>{const im=new Image();im.src='data:image/svg+xml;base64,'+btoa(source);await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c.toDataURL().split(',')[1]},source);await fs.writeFile(path.join(root,'assets/world/objects/'+key+'.png'),Buffer.from(data,'base64'))};
  for(const [name,palette]of Object.entries(palettes)){
   for(const slope of ['back','front','join'])for(const edge of slope==='back'?['field','n','w','e','nw','ne']:slope==='front'?['field','s','w','e','sw','se']:['field','w','e'])await save(`roof-tile-${name}-${slope}-${edge}`,tile(palette,slope,edge));
   for(const end of ['field','w','e'])await save(`roof-ridge-${name}-${end}`,ridge(palette,end));
  }
  await save('roof-chimney',chimney());
 }finally{await browser.close()}
 console.log('Built 75 modular slope/edge/corner tiles, 15 ridge pieces and a separate chimney');
})();
