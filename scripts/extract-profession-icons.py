from pathlib import Path
from PIL import Image
import numpy as np
import json
import shutil
root=Path(__file__).resolve().parents[1]
out=root/'assets/items/professions';out.mkdir(parents=True,exist_ok=True)
def extract(source,names,columns,rows,output=out,size=(96,96)):
 output.mkdir(parents=True,exist_ok=True)
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
   crop=crop.crop(box);padding=8 if size==(96,96) else 16;crop.thumbnail((size[0]-padding,size[1]-padding),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',size);canvas.alpha_composite(crop,((size[0]-crop.width)//2,(size[1]-crop.height)//2 if size==(96,96) else size[1]-8-crop.height));canvas.save(output/(name+'.png'))
extract(root/'assets/professions/masters/materials.png',['copperOre','copperBar','rawFish','cookedFish','herb','log','timber','fishingSpot'],4,2)
metal=root/'assets/professions/masters/metals.png'
if metal.exists():extract(metal,[tier+kind for kind in ['Ore','Bar'] for tier in ['copper','iron','gold','mythril','dragon','shadow']],6,2)

layout_path=root/'assets/professions/masters/varieties-layout.json'
if layout_path.exists():
 layout=json.loads(layout_path.read_text())
 for key,names in layout.items():
  source=root/'assets/professions/masters'/(key+'.png')
  if source.exists():extract(source,['tree-'+n for n in names] if key=='trees' else names,4,2,root/'assets/professions/runtime' if key=='trees' else out,(192,224) if key=='trees' else (96,96))
 for name in layout['trees']:shutil.copyfile(out/'log.png',out/(name+'.png'))
