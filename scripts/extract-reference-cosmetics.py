"""Extract measured reference-derived atlases; source art and uploaded sheets stay intact."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json

root=Path(__file__).resolve().parents[1]
masters=root/'assets/skins/reference-masters'
out=root/'assets/skins/reference-runtime';out.mkdir(exist_ok=True)
(out/'previews').mkdir(exist_ok=True)
themes=json.loads((root/'packages/game-data/src/outfit-themes.json').read_text())
layout_path=masters/'layout.json'
layout=json.loads(layout_path.read_text()) if layout_path.exists() else {}
metadata={'outfits':{},'wings':{},'auras':{}}
DIRECTIONS=['down','left','right','up']

def bounds(im):
 box=im.getchannel('A').point(lambda v:255 if v>16 else 0).getbbox()
 if not box:raise ValueError('Empty sprite')
 return box

def row_bands(im):
 # Erosion is used only to measure figures, never to alter the source artwork.
 alpha=np.array(im.getchannel('A'))
 mask=ndimage.binary_erosion(alpha>128,structure=np.ones((5,5)))
 labels,n=ndimage.label(mask);sizes=np.bincount(labels.ravel());boxes=[]
 for i,sl in enumerate(ndimage.find_objects(labels),1):
  if sl and sizes[i]>max(sizes[1:])*.22:
   sy,sx=sl
   if sy.stop-sy.start>60:boxes.append((sx.start,sy.start,sx.stop,sy.stop))
 groups=[]
 for b in sorted(boxes,key=lambda b:(b[1]+b[3])/2):
  center=(b[1]+b[3])/2
  if not groups or center-np.mean([(q[1]+q[3])/2 for q in groups[-1]])>75:groups.append([])
  groups[-1].append(b)
 groups=[g for g in groups if len(g)>=4]
 if not groups:raise ValueError('No figure rows')
 centers=[np.mean([(b[1]+b[3])/2 for b in g]) for g in groups]
 density=(alpha>64).sum(axis=1);bands=[0]
 for i in range(len(groups)-1):
  bottom=max(b[3] for b in groups[i])+2;top=min(b[1] for b in groups[i+1])-2
  target=(bottom+top)/2;radius=max(5,round((centers[i+1]-centers[i])*.10))
  lo=max(bands[-1]+1,round(target-radius));hi=min(im.height-1,round(target+radius))
  bands.append(min(range(lo,hi+1),key=lambda y:(int(density[max(0,y-1):y+2].sum()),abs(y-target))))
 bands.append(im.height)
 return bands

def crop_frame(im,bands,row,col,columns=6,clip_bottom=None):
 box=(round(col*im.width/columns),bands[row],round((col+1)*im.width/columns),bands[row+1])
 cell=im.crop(box)
 # Drop only disconnected neighboring-cell flecks, not interior dark artwork.
 a=np.array(cell.getchannel('A'))
 if clip_bottom is not None:a[clip_bottom:]=0
 primary,n=ndimage.label(ndimage.binary_erosion(a>128,structure=np.ones((3,3))))
 sizes=np.bincount(primary.ravel());sizes[0]=0
 if sizes.max()>0:
  dominant=ndimage.find_objects(primary)[int(sizes.argmax())-1]
  # Crowded posters can leave the next figure's head below the actual boots.
  # Measure the main figure, retain its complete feet, and discard only that spill.
  if dominant:a[min(a.shape[0],dominant[0].stop+5):]=0
 labels,n=ndimage.label(a>16);sizes=np.bincount(labels.ravel())
 keep=sizes>=max(sizes[1:],default=0)*.008;keep[0]=False;a[~keep[labels]]=0;cell.putalpha(Image.fromarray(a))
 return cell,box,bounds(cell)

for theme in themes:
 main=Image.open(masters/f'{theme}.png').convert('RGBA');rear=Image.open(masters/f'{theme}-rear.png').convert('RGBA')
 bands=layout.get(theme,{}).get('bands') or row_bands(main);back_bands=row_bands(rear)
 assert len(back_bands)==3,(theme,'rear rows',back_bands)
 female_start=layout.get(theme,{}).get('femaleStart',4 if len(bands)-1>=8 else 3)
 for gender in ['male','female']:
  skin=theme if gender=='male' else theme+'-female';frames={};measure=[]
  for direction in DIRECTIONS:
   alternate=layout.get(theme,{}).get(direction+'Source')
   source=Image.open(masters/alternate).convert('RGBA') if alternate else rear if direction=='up' else main
   source_bands=row_bands(source) if alternate else back_bands if direction=='up' else bands
   row=(0 if gender=='male' else 1) if direction=='up' or alternate else (0 if gender=='male' else female_start)+DIRECTIONS.index(direction)
   clip=layout.get(theme,{}).get('clipBottom',{}).get(gender,{}).get(direction)
   frames[direction]=[crop_frame(source,source_bands,row,col,clip_bottom=clip) for col in range(6)]
  # Independently measured source resolutions are normalized without stretching figures.
  factors={d:146/max(box[3]-box[1] for _,_,box in frames[d]) for d in DIRECTIONS}
  widest=max((box[2]-box[0])*factors[d] for d in DIRECTIONS for _,_,box in frames[d])
  common=min(1,132/widest);atlas=Image.new('RGBA',(960,640))
  for row,direction in enumerate(DIRECTIONS):
   factor=factors[direction]*common
   for col,(cell,source_box,box) in enumerate(frames[direction]):
    part=cell.crop(box);w=round(part.width*factor);h=round(part.height*factor);x=(160-w)//2;y=154-h
    assert x>=0 and y>=0 and x+w<=160,(skin,direction,col,w,h)
    frame=Image.new('RGBA',(160,160));frame.alpha_composite(part.resize((w,h),Image.Resampling.LANCZOS),(x,y));atlas.alpha_composite(frame,(col*160,row*160))
    measure.append({'direction':direction,'frame':col,'master':layout.get(theme,{}).get(direction+'Source') or (f'{theme}-rear.png' if direction=='up' else f'{theme}.png'),'sourceCell':source_box,'sourceBounds':box,'placement':[x,y,w,h]})
  atlas.save(out/f'skin-{skin}.webp',lossless=True)
  atlas.crop((0,0,160,160)).save(out/'previews'/f'{skin}.webp',lossless=True)
  metadata['outfits'][skin]=measure
 print('Outfit:',theme,'rows',bands,'femaleStart',female_start)

def projection_runs(mask,min_size):
 labels,n=ndimage.label(ndimage.binary_closing(mask,structure=np.ones(7)))
 return [(s[0].start,s[0].stop) for s in ndimage.find_objects(labels) if s and s[0].stop-s[0].start>min_size]

wing_sets=[['shadow','divine','inferno','frost','forest'],['celestial','void','phoenix','crystal','dragon']]
root_heights={'shadow':.58,'divine':.5,'inferno':.55,'frost':.5,'forest':.5,'celestial':.53,'void':.53,'phoenix':.5,'crystal':.5,'dragon':.56}
for batch,ids in enumerate(wing_sets,1):
 image=Image.open(masters/f'wings-{batch}.png').convert('RGBA')
 alpha=np.array(image.getchannel('A'));labels,n=ndimage.label(ndimage.binary_erosion(alpha>128,structure=np.ones((5,5))));sizes=np.bincount(labels.ravel());cores={}
 column_bands=[round(v*image.width/1254) for v in [0,400,630,870,1254]]
 for i,sl in enumerate(ndimage.find_objects(labels),1):
  if not sl or sizes[i]<max(sizes[1:])*.02:continue
  sy,sx=sl
  if sy.stop-sy.start<10 or sx.stop-sx.start<5:continue
  cx=(sx.start+sx.stop)/2;cy=(sy.start+sy.stop)/2
  col=next((c for c in range(4) if column_bands[c]<=cx<column_bands[c+1]),3);row=min(4,int(cy/(image.height/5)))
  cores.setdefault((row,col),[]).append((sx.start,sy.start,sx.stop,sy.stop))
 for row,wing in enumerate(ids):
  pieces=[]
  for source_col in range(4):
   boxes=cores.get((row,source_col));assert boxes,(wing,source_col,'missing wing core')
   left=max(column_bands[source_col],min(b[0] for b in boxes)-12);right=min(column_bands[source_col+1],max(b[2] for b in boxes)+12)
   top=max(0,min(b[1] for b in boxes)-12);bottom=min(image.height,max(b[3] for b in boxes)+12)
   cell=image.crop((left,top,right,bottom))
   # Keep the wing and its connected glow; exclude tiny fragments from neighboring rows.
   alpha=np.array(cell.getchannel('A'));labels,n=ndimage.label(alpha>16);sizes=np.bincount(labels.ravel());keep=sizes>=max(sizes[1:],default=0)*.03;keep[0]=False;alpha[~keep[labels]]=0;cell.putalpha(Image.fromarray(alpha))
   box=bounds(cell);part=cell.crop(box)
   # Shadow's generated profile order is reversed; the other nine follow the reference.
   facing=(['down','right','left','up'] if wing=='shadow' else DIRECTIONS)[source_col]
   rx=.92 if facing=='right' else .08 if facing=='left' else .5
   ry=root_heights[wing]
   pieces.append((facing,part,(rx*part.width,ry*part.height)))
  factor=min(180/max(p.width for _,p,_ in pieces),132/max(p.height for _,p,_ in pieces),94/max(a[0] for _,_,a in pieces),94/max(p.width-a[0] for _,p,a in pieces),88/max(a[1] for _,_,a in pieces),68/max(p.height-a[1] for _,p,a in pieces));atlas=Image.new('RGBA',(768,160));measures=[]
  for facing,part,anchor in pieces:
   w=round(part.width*factor);h=round(part.height*factor);x=round(96-anchor[0]*factor);y=round(90-anchor[1]*factor)
   assert x>=0 and y>=0 and x+w<=192 and y+h<=160,(wing,facing,x,y,w,h)
   frame=Image.new('RGBA',(192,160));frame.alpha_composite(part.resize((w,h),Image.Resampling.LANCZOS),(x,y));atlas.alpha_composite(frame,(DIRECTIONS.index(facing)*192,0));measures.append({'direction':facing,'placement':[x,y,w,h],'root':[96,90]})
  atlas.save(out/f'wings-{wing}.webp',lossless=True);metadata['wings'][wing]=measures

aura_sets=[['shadow','divine','inferno','frost','forest'],['celestial','void','blood','crystal','dragon']]
for batch,ids in enumerate(aura_sets,1):
 image=Image.open(masters/f'auras-{batch}.png').convert('RGBA')
 for row,aura in enumerate(ids):
  cells=[]
  for col in range(3):
   cell=image.crop((round(col*image.width/3),round(row*image.height/5),round((col+1)*image.width/3),round((row+1)*image.height/5)));box=bounds(cell);cells.append((cell,box))
  factor=min(180/max(b[2]-b[0] for _,b in cells),160/max(b[3]-b[1] for _,b in cells));atlas=Image.new('RGBA',(1152,192));measures=[]
  for phase,(cell,box) in enumerate(cells):
   part=cell.crop(box);w=round(part.width*factor);h=round(part.height*factor);x=round(96+(box[0]-cell.width/2)*factor);y=round(162+(box[1]-cell.height*.84)*factor)
   assert x>=0 and y>=0 and x+w<=192 and y+h<=192,(aura,phase,x,y,w,h)
   frame=Image.new('RGBA',(192,192));frame.alpha_composite(part.resize((w,h),Image.Resampling.LANCZOS),(x,y))
   back=frame.copy();front=frame.copy();back.paste((0,0,0,0),(0,162,192,192));front.paste((0,0,0,0),(0,0,192,162))
   atlas.alpha_composite(back,(phase*192,0));atlas.alpha_composite(front,((phase+3)*192,0));measures.append({'phase':phase,'placement':[x,y,w,h],'foot':[96,162]})
  atlas.save(out/f'aura-{aura}.webp',lossless=True);metadata['auras'][aura]=measures
(root/'assets/skins/reference-frames.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('30 outfit atlases (720 poses),40 directional wings,30 layered aura phases; source art preserved.')
