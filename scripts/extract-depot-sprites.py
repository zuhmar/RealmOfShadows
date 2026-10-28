from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'assets/world/depot/master.png').convert('RGBA')
# Measured source bounds; the original master is retained unchanged.
frames={'depot-wall-h':((20,85,550,395),(32,24)), 'depot-wall-v':((718,0,825,490),(9,32)), 'depot-wall-corner':((1050,55,1520,495),(32,32)), 'depot-floor':((0,512,512,1024),(32,32)), 'depot-box':((580,590,960,930),(32,29)), 'depot-sign':((1035,610,1535,915),(96,40))}
for name,(bounds,size) in frames.items():
 part=im.crop(bounds).resize(size,Image.Resampling.LANCZOS)
 if name=='depot-sign':out=part
 else:
  out=Image.new('RGBA',(32,32));out.alpha_composite(part,((32-size[0])//2,32-size[1]))
 out.save(root/'assets/world/objects'/f'{name}.png')
print('Extracted six Depot sprites; floor/walls/box are native 32x32, sign is96x40')
# The directional wall kit has four explicit L corners and four edge strips.
# Trim only transparent atlas padding, then place strips against exact cell edges.
wall_master=Image.open(root/'assets/world/depot/walls-master.png').convert('RGBA')
for row,names in enumerate([['nw','ne','sw','se'],['n','e','s','w']]):
 for col,name in enumerate(names):
  part=wall_master.crop((round(col*wall_master.width/4),round(row*wall_master.height/2),round((col+1)*wall_master.width/4),round((row+1)*wall_master.height/2)))
  bounds=part.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
  if not bounds:raise ValueError('Empty wall frame: '+name)
  part=part.crop(bounds)
  size=(32,32) if row==0 else (32,9) if name in ['n','s'] else (8,32)
  out=Image.new('RGBA',(32,32));x=24 if name=='e' else 0;y=23 if name=='s' else 0
  out.alpha_composite(part.resize(size,Image.Resampling.LANCZOS),(x,y))
  out.save(root/'assets/world/objects'/f'depot-wall-{name}.png')
print('Extracted four directional L corners and four edge-aligned wall strips')

# Village rooms share the proven four-corner kit; keep Depot texture IDs stable.
import shutil
for direction in ['n','e','s','w','nw','ne','sw','se']:
 shutil.copyfile(root/'assets/world/objects'/f'depot-wall-{direction}.png',root/'assets/world/objects'/f'village-wall-{direction}.png')
