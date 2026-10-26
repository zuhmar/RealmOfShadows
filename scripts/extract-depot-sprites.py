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
