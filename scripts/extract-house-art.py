"""Extract painted sprites at alpha gutters, retaining complete directional rigs."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1];dest=root/'assets/world/objects';layout={}
def cuts(values,count):
 n=len(values);result=[0]
 for i in range(1,count):
  target=n*i/count;lo=max(result[-1]+5,round(target-n*.13));hi=min(n-5,round(target+n*.13));runs=[];start=None
  for j in range(lo,hi+1):
   empty=values[j]<=3
   if empty and start is None:start=j
   if (not empty or j==hi) and start is not None:
    if j-start>=3:runs.append((start,j))
    start=None
  if not runs:raise ValueError(f'No transparent gutter at {target}')
  a,b=min(runs,key=lambda r:abs((r[0]+r[1])/2-target));result.append((a+b)//2)
 return result+[n]
def matrix(path,rows,cols):
 im=Image.open(path).convert('RGBA')
 if path.stem=='d':
  # Side-on tool boards extend lower than front boards; measure each column separately.
  xs=[0,440,730,1030,1448];ys_by_col=[[0,270,515,764,1086],[0,270,510,780,1086],[0,270,510,780,1086],[0,270,515,766,1086]];out=[[] for _ in range(4)]
  for col in range(4):
   for row in range(4):
    ys=ys_by_col[col];piece=im.crop((xs[col],ys[row],xs[col+1],ys[row+1]));bounds=piece.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();out[row].append(piece.crop(bounds));layout[f'd:{row}:{col}']=[xs[col]+bounds[0],ys[row]+bounds[1],xs[col]+bounds[2],ys[row]+bounds[3]]
  return out
 a=im.getchannel('A');ys=cuts([sum(v>32 for v in a.crop((0,y,im.width,y+1)).getdata())for y in range(im.height)],rows);out=[]
 for row in range(rows):
  strip=im.crop((0,ys[row],im.width,ys[row+1]));alpha=strip.getchannel('A');xs=cuts([sum(v>32 for v in alpha.crop((x,0,x+1,strip.height)).getdata())for x in range(strip.width)],cols);frames=[]
  for col in range(cols):
   piece=strip.crop((xs[col],0,xs[col+1],strip.height));bounds=piece.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
   if not bounds:raise ValueError('Empty sprite')
   frames.append(piece.crop(bounds));layout[f'{path.stem}:{row}:{col}']=[xs[col]+bounds[0],ys[row]+bounds[1],xs[col]+bounds[2],ys[row]+bounds[3]]
  out.append(frames)
 return out
def save(piece,key,size,scale=None):
 piece=piece.copy()
 if scale is None:piece.thumbnail((size[0]-8,size[1]-8),Image.Resampling.LANCZOS)
 else:piece=piece.resize((max(1,round(piece.width*scale)),max(1,round(piece.height*scale))),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',size);canvas.alpha_composite(piece,((size[0]-piece.width)//2,size[1]-4-piece.height));canvas.save(dest/f'{key}.png')
rows={'a':['forge','workbench','counter','meeting'],'b':['bookshelf','bed','table','armor'],'c':['chest','chair','barrel','well'],'d':['bench','planter','tools','stairsup']}
for sheet,names in rows.items():
 frames=matrix(root/f'assets/world/furniture/masters/{sheet}.png',4,4)
 for name,views in zip(names,frames):
  factor=min(88/max(p.width for p in views),88/max(p.height for p in views))
  for direction,piece in zip(['down','left','right','up'],views):save(piece,f'furn-{name}-{direction}',(96,96),factor)
views=matrix(root/'assets/world/furniture/masters/stairsdown.png',1,4)[0]
factor=min(88/max(p.width for p in views),88/max(p.height for p in views))
for direction,piece in zip(['down','left','right','up'],views):save(piece,f'furn-stairsdown-{direction}',(96,96),factor)
roofs=matrix(root/'assets/world/architecture/masters/roofs.png',2,3)
for name,piece in zip(['depot','smithy','workshop','bank','hall'],[p for row in roofs for p in row]):
 # Roof planes cover the exact authored footprint; preserve their transparent eaves.
 canvas=Image.new('RGBA',(320,256));canvas.alpha_composite(piece.resize((316,252),Image.Resampling.LANCZOS),(2,2));canvas.save(dest/f'house-roof-{name}.png')
frames=matrix(root/'assets/world/architecture/masters/walls.png',2,4)
for row,names in enumerate([['n','e','s','w'],['nw','ne','sw','se']]):
 for name,piece in zip(names,frames[row]):
  canvas=Image.new('RGBA',(32,64));width=8 if name in ['e','w'] else 32;x=24 if name=='e' else 0
  canvas.alpha_composite(piece.resize((width,64),Image.Resampling.LANCZOS),(x,0));canvas.save(dest/f'house-wall-{name}.png')
(root/'assets/world/architecture/layout.json').write_text(json.dumps(layout,indent=2)+'\n')
print('Extracted 68 directional furniture/prop sprites, five roofs and eight full-height wall pieces')
