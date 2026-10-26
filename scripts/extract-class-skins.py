"""Measured atlas extraction and pixel-art encoding; generated masters are preserved."""
from pathlib import Path
from PIL import Image
import json
import numpy as np
from scipy import ndimage
root=Path(__file__).resolve().parents[1];masters=root/'assets/skins/masters';dest=root/'assets/skins/runtime';dest.mkdir(exist_ok=True)
metadata={}
def trim(im):
 box=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
 if not box:raise ValueError('Empty generated frame')
 return box
# New masters are original low-resolution designs; older illustration masters remain archived.
for skin in ['citizen','knight','archer','mage','rogue','mara']:
 image=Image.open(masters/'pixel'/(skin+'.png')).convert('RGBA')
 # The generated row spacing can drift; cut at the emptiest nearby horizontal gap.
 alpha=np.array(image.getchannel('A'));density=(alpha>32).sum(axis=1)
 bands=[0]
 for row in range(1,4):
  target=round(image.height*row/4);lo=target-32;hi=target+32
  best=min(range(lo,hi),key=lambda y:(int(density[max(0,y-1):y+2].sum()),abs(y-target)))
  bands.append(best)
 bands.append(image.height);frames=[]
 for row,direction in enumerate(['down','left','right','up']):
  for col in range(6):
   left=round(col*image.width/6);right=round((col+1)*image.width/6)
   cell=image.crop((left,bands[row],right,bands[row+1]));box=trim(cell);frames.append((direction,col,cell,box,left,bands[row]))
 factor=min(30/max(box[3]-box[1] for _,_,_,box,_,_ in frames),26/max(box[2]-box[0] for _,_,_,box,_,_ in frames))
 atlas=Image.new('RGBA',(192,128));metadata[skin]=[]
 for index,(direction,col,cell,box,left,top) in enumerate(frames):
  sprite=cell.crop(box);w=round(sprite.width*factor);h=round(sprite.height*factor)
  x=round(16+(box[0]-cell.width/2)*factor);y=31-h
  assert x>=0 and x+w<=32 and y>=0,(skin,direction,col,x,w,y)
  frame=Image.new('RGBA',(32,32));frame.alpha_composite(sprite.resize((w,h),Image.Resampling.NEAREST),(x,y))
  # Hard alpha and shared small palette retain crisp pixel clusters at any display size.
  pixels=np.array(frame);pixels[:,:,3]=np.where(pixels[:,:,3]>=128,255,0);pixels[pixels[:,:,3]==0]=0
  atlas.alpha_composite(Image.fromarray(pixels),(col*32,(index//6)*32))
  metadata[skin].append({'direction':direction,'frame':col,'source':[left+box[0],top+box[1],box[2]-box[0],box[3]-box[1]],'placement':[x,y,w,h]})
 atlas=atlas.quantize(colors=32,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).convert('RGBA')
 for index,(direction,col,_,_,_,_) in enumerate(frames):
  atlas.crop((col*32,(index//6)*32,(col+1)*32,(index//6+1)*32)).save(dest/f'skin-{skin}-{direction}-{col}.webp',lossless=True)
image=Image.open(masters/'wings.png').convert('RGBA')
# Measured roots, not recentered alpha bounds: profiles attach at their inner edge.
# One shared factor preserves the foreshortening of side views.
wing_columns=[0,510,750,998,1448];wing_rows=[0,361,690,1086]
roots={
 'dawn':[(256,225),(710,225),(784,225),(1228,225)],
 'ember':[(256,557),(712,557),(788,557),(1228,540)],
 'fae':[(256,904),(720,904),(786,904),(1228,894)],
}
for row,wing in enumerate(['dawn','ember','fae']):
 for col,direction in enumerate(['down','left','right','up']):
  cell=image.crop((wing_columns[col],wing_rows[row],wing_columns[col+1],wing_rows[row+1]));# Remove tiny disconnected neighboring-row tips, retaining the actual wing pair.
  alpha=np.array(cell.getchannel('A'));labels,count=ndimage.label(alpha>16);sizes=np.bincount(labels.ravel());keep=sizes>=max(sizes[1:],default=0)*.02;keep[0]=False
  alpha[~keep[labels]]=0;cell.putalpha(Image.fromarray(alpha));box=trim(cell);part=cell.crop(box);factor=.34
  size=(round(part.width*factor),round(part.height*factor));anchor=roots[wing][col]
  x=round(96+(wing_columns[col]+box[0]-anchor[0])*factor);y=round(90+(wing_rows[row]+box[1]-anchor[1])*factor)
  assert x>=0 and y>=0 and x+size[0]<=192 and y+size[1]<=160,(wing,direction,x,y,size)
  out=Image.new('RGBA',(192,160));out.alpha_composite(part.resize(size,Image.Resampling.LANCZOS),(x,y));out.save(dest/f'wings-{wing}-{direction}.webp',lossless=True)
image=Image.open(masters/'auras.png').convert('RGBA')
for col,aura in enumerate(['radiance','arcane','embers']):
 cell=image.crop((round(col*image.width/3),0,round((col+1)*image.width/3),image.height));part=cell.crop(trim(cell)).resize((180,58),Image.Resampling.LANCZOS);out=Image.new('RGBA',(192,64));out.alpha_composite(part,(6,3));out.save(dest/f'aura-{aura}.webp',lossless=True)
(root/'assets/skins/frames.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('144 native 32x32 character poses, 12 directional wing sprites, 3 auras')
