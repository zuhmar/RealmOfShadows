from pathlib import Path
from PIL import Image
import numpy as np
root=Path(__file__).resolve().parents[1]
out=root/'assets/items/professions';out.mkdir(parents=True,exist_ok=True)
def extract(source,names,columns,rows):
 image=Image.open(source).convert('RGBA');w,h=image.size;alpha=np.array(image)[:,:,3]>128
 # Generated rows/columns drift slightly. Split at transparent gutters rather
 # than assuming equally spaced cell edges and clipping ore tips.
 density=alpha.sum(axis=1);near=range(int(h*.35),int(h*.65));low=min(density[y] for y in near);candidates=[y for y in near if density[y]==low];split=round(sum(candidates)/len(candidates));ys=[0,split,h]
 for row in range(rows):
  d=alpha[ys[row]:ys[row+1]].sum(axis=0);xs=[0]
  for col in range(1,columns):
   near=range(round(w/columns*(col-.14)),round(w/columns*(col+.14)));low=min(d[x] for x in near);candidates=[x for x in near if d[x]==low];xs.append(round(sum(candidates)/len(candidates)))
  xs.append(w)
  for col in range(columns):
   name=names[row*columns+col];crop=image.crop((xs[col],ys[row],xs[col+1],ys[row+1]));box=crop.getbbox()
   if not box:raise ValueError(name)
   crop=crop.crop(box);crop.thumbnail((88,88),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(96,96));canvas.alpha_composite(crop,((96-crop.width)//2,(96-crop.height)//2));canvas.save(out/(name+'.png'))
extract(root/'assets/professions/masters/materials.png',['copperOre','copperBar','rawFish','cookedFish','herb','log','timber','fishingSpot'],4,2)
metal=root/'assets/professions/masters/metals.png'
if metal.exists():extract(metal,[tier+kind for kind in ['Ore','Bar'] for tier in ['copper','iron','gold','mythril','dragon','shadow']],6,2)
