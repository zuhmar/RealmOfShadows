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
def components_matrix(path,rows,cols):
 import numpy as np
 from scipy import ndimage
 im=Image.open(path).convert('RGBA');mask=np.asarray(im.getchannel('A'))>32
 labels,count=ndimage.label(mask,structure=np.ones((3,3)));areas=np.bincount(labels.ravel());parts=[];dominant={}
 for label,bounds in enumerate(ndimage.find_objects(labels),1):
  if bounds is None or areas[label]<8:continue
  sy,sx=bounds;box=(sx.start,sy.start,sx.stop,sy.stop);cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2
  cell=(min(rows-1,int(cy/im.height*rows)),min(cols-1,int(cx/im.width*cols)));part=(int(areas[label]),box,label);parts.append(part)
  if cell not in dominant or part[0]>dominant[cell][0]:dominant[cell]=part
 if len(dominant)!=rows*cols:raise ValueError(f'Expected {rows*cols} complete objects in {path}, found {len(dominant)}')
 boxes={cell:list(part[1]) for cell,part in dominant.items()};main_labels={p[2] for p in dominant.values()};owners={part[2]:cell for cell,part in dominant.items()}
 def distance(a,b):return max(a[0]-b[2],b[0]-a[2],0)**2+max(a[1]-b[3],b[1]-a[3],0)**2
 for area,box,label in parts:
  if label in main_labels:continue
  cell=min(dominant,key=lambda c:(distance(box,dominant[c][1]),abs((box[0]+box[2])-(dominant[c][1][0]+dominant[c][1][2]))+abs((box[1]+box[3])-(dominant[c][1][1]+dominant[c][1][3]))))
  owners[label]=cell
  b=boxes[cell];b[0]=min(b[0],box[0]);b[1]=min(b[1],box[1]);b[2]=max(b[2],box[2]);b[3]=max(b[3],box[3])
 # Keep only pixels belonging to this sprite. Rectangular crops alone can catch
 # a neighboring sprite's protruding cap, even when the two shapes never touch.
 lookup=np.zeros(count+1,dtype=np.int16)
 for label,(row,col) in owners.items():lookup[label]=row*cols+col+1
 ownership=lookup[labels];distance_to_core,nearest=ndimage.distance_transform_edt(labels==0,return_indices=True)
 fringe=(labels==0)&(distance_to_core<=2);ownership[fringe]=lookup[labels[tuple(nearest[:,fringe])]]
 rgba=np.asarray(im)
 out=[]
 for row in range(rows):
  frames=[]
  for col in range(cols):
   box=boxes[row,col];layout[f'elevated-{path.stem}:{row}:{col}']=box;x0,y0,x1,y1=box;pixels=rgba[y0:y1,x0:x1].copy();pixels[:,:,3][ownership[y0:y1,x0:x1]!=(row*cols+col+1)]=0;frames.append(Image.fromarray(pixels))
  out.append(frames)
 return out
def matrix(path,rows,cols):
 if 'elevated-masters' in path.parts:return components_matrix(path,rows,cols)
 im=Image.open(path).convert('RGBA')
 if path.stem=='d' and 'elevated-masters' not in path.parts:
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
 frames=matrix(root/f'assets/world/furniture/elevated-masters/{sheet}.png',4,4)
 for name,views in zip(names,frames):
  factor=min(88/max(p.width for p in views),88/max(p.height for p in views))
  for direction,piece in zip(['down','left','right','up'],views):save(piece,f'furn-{name}-{direction}',(96,96),factor)
views=matrix(root/'assets/world/furniture/masters/stairsdown.png',1,4)[0]
factor=min(88/max(p.width for p in views),88/max(p.height for p in views))
for direction,piece in zip(['down','left','right','up'],views):save(piece,f'furn-stairsdown-{direction}',(96,96),factor)
roofs=matrix(root/'assets/world/architecture/elevated-masters/roofs.png',2,3)
for name,piece in zip(['depot','smithy','workshop','bank','hall'],[p for row in roofs for p in row]):
 # Roof planes cover the exact authored footprint; preserve their transparent eaves.
 canvas=Image.new('RGBA',(320,256));canvas.alpha_composite(piece.resize((316,252),Image.Resampling.LANCZOS),(2,2));canvas.save(dest/f'house-roof-{name}.png')
# Wall geometry is code-native: use one shared cap thickness and exact joins.
import subprocess
subprocess.run(['node',str(root/'scripts/build-town-walls.cjs')],check=True)
(root/'assets/world/architecture/layout.json').write_text(json.dumps(layout,indent=2)+'\n')
print('Extracted 68 directional furniture/prop sprites, five roofs and ten elevated wall pieces')
