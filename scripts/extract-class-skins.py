"""Measured atlas extraction only; masters are preserved. No procedural body parts."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1];masters=root/'assets/skins/masters';dest=root/'assets/skins/runtime';dest.mkdir(exist_ok=True)
rows={'knight':[0,280,528,775,1024],'archer':[0,275,518,762,1024],'mage':[0,280,518,759,1024],'rogue':[0,290,533,771,1024]}
metadata={}
def trim(im):
 box=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
 if not box:raise ValueError('Empty generated frame')
 return box
for skin,bands in rows.items():
 image=Image.open(masters/(skin+'.png')).convert('RGBA');frames=[]
 for row,direction in enumerate(['down','left','right','up']):
  for col in range(6):
   cell=image.crop((col*256,bands[row],(col+1)*256,bands[row+1]));box=trim(cell);frames.append((direction,col,cell,box))
 factor=min(146/max(box[3]-box[1] for _,_,_,box in frames),112/max(box[2]-box[0] for _,_,_,box in frames));metadata[skin]=[]
 for direction,col,cell,box in frames:
  sprite=cell.crop(box);w=round(sprite.width*factor);h=round(sprite.height*factor);x=round(80+(box[0]-128)*factor);y=154-h
  assert x>=0 and x+w<=160 and y>=0,(skin,direction,col,x,w,y)
  out=Image.new('RGBA',(160,160));out.alpha_composite(sprite.resize((w,h),Image.Resampling.LANCZOS),(x,y));out.save(dest/f'skin-{skin}-{direction}-{col}.webp',lossless=True)
  metadata[skin].append({'direction':direction,'frame':col,'source':[col*256+box[0],bands[['down','left','right','up'].index(direction)]+box[1],box[2]-box[0],box[3]-box[1]],'placement':[x,y,w,h]})
image=Image.open(masters/'wings.png').convert('RGBA')
# The generator spaces full wing pairs wider than folded profile views.
wing_columns=[0,480,724,978,1448];wing_rows=[0,357,703,1086]
for row,wing in enumerate(['dawn','ember','fae']):
 for col,direction in enumerate(['down','left','right','up']):
  cell=image.crop((wing_columns[col],wing_rows[row],wing_columns[col+1],wing_rows[row+1]));part=cell.crop(trim(cell));factor=min(180/part.width,145/part.height);size=(round(part.width*factor),round(part.height*factor));part=part.resize(size,Image.Resampling.LANCZOS);out=Image.new('RGBA',(192,160));out.alpha_composite(part,((192-size[0])//2,(160-size[1])//2));out.save(dest/f'wings-{wing}-{direction}.webp',lossless=True)
image=Image.open(masters/'auras.png').convert('RGBA')
for col,aura in enumerate(['radiance','arcane','embers']):
 cell=image.crop((round(col*image.width/3),0,round((col+1)*image.width/3),image.height));part=cell.crop(trim(cell)).resize((180,58),Image.Resampling.LANCZOS);out=Image.new('RGBA',(192,64));out.alpha_composite(part,(6,3));out.save(dest/f'aura-{aura}.webp',lossless=True)
(root/'assets/skins/frames.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('96 aligned full-character poses, 12 directional wing sprites, 3 auras')
