/** Prepare cardinal raster artwork at native size without rotating or mirroring views. */
const fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),folder=path.join(root,'assets/world/elderwood-props');
 const sheets=[{sourceFile:'masters/directional-props.png',families:['chest','bed','bench','tools']},{sourceFile:'masters/table-armor.png',families:['table','armor']}];
 for(const sheet of sheets)sheet.data=(await fs.readFile(path.join(folder,sheet.sourceFile))).toString('base64');
 const rear=(await fs.readFile(path.join(folder,'masters/bed-up.png'))).toString('base64');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  const frames=await page.evaluate(async({sheets,rear})=>{
   const load=async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();return image};
   const crop=(image,x,y,width,height)=>{
    const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,-x,-y);
    const d=g.getImageData(0,0,width,height).data;let left=width,top=height,right=0,bottom=0;
    for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++)if(d[(yy*width+xx)*4+3]>16){left=Math.min(left,xx);top=Math.min(top,yy);right=Math.max(right,xx+1);bottom=Math.max(bottom,yy+1)}
    if(right<=left||bottom<=top)throw Error('Empty atlas cell');
    return{c,left,top,w:right-left,h:bottom-top,source:{x:x+left,y:y+top,w:right-left,h:bottom-top}};
   };
   const rearImage=await load(rear),out=[];
   for(const sheet of sheets){const image=await load(sheet.data);for(const[row,family]of sheet.families.entries()){
    const crops=Array.from({length:4},(_,col)=>{const x=Math.floor(col*image.width/4),y=Math.floor(row*image.height/sheet.families.length),right=Math.floor((col+1)*image.width/4),bottom=Math.floor((row+1)*image.height/sheet.families.length);return crop(image,x,y,right-x,bottom-y)});
    const familyScale=88/Math.max(...crops.flatMap(c=>[c.w,c.h]));
    for(const[col,original]of crops.entries()){
     const rearBed=family==='bed'&&col===3,part=rearBed?crop(rearImage,0,0,rearImage.width,rearImage.height):original,scale=rearBed?88/Math.max(part.w,part.h):familyScale;
     const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
     g.drawImage(part.c,part.left,part.top,part.w,part.h,(96-part.w*scale)/2,92-part.h*scale,part.w*scale,part.h*scale);
     const facing=['down','left','right','up'][col];out.push({key:`elderwood-prop-${family}-${facing}`,family,facing,sourceFile:rearBed?'masters/bed-up.png':sheet.sourceFile,source:part.source,scale,frame:[96,96],baseline:92,png:c.toDataURL().split(',')[1]});
    }
   }}return out;
  },{sheets,rear});
  for(const frame of frames)await fs.writeFile(path.join(root,'assets/world/objects',frame.key+'.png'),Buffer.from(frame.png,'base64'));
  await fs.writeFile(path.join(folder,'frames.json'),JSON.stringify(frames.map(({png,...frame})=>frame),null,2)+'\n');
  console.log(`Prepared ${frames.length} cardinal prop frames at 96px with a 92px ground baseline.`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
