from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'assets/world/town/master.png').convert('RGBA')
frames={
 'door-closed':(12,5,365,350),'door-open':(390,5,750,350),'window':(790,40,1076,335),'stairs-up':(1140,0,1448,370),
 'stairs-down':(10,365,365,719),'bookshelf':(390,370,715,710),'bed':(720,380,1075,715),'table':(1090,375,1448,710),
 'armor':(35,712,340,1075),'tools':(370,740,745,1060),'chair':(770,715,1040,1080),'well':(1120,700,1430,1080)}
for name,box in frames.items():
 part=im.crop(box);bounds=part.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
 if not bounds:raise ValueError(name)
 part=part.crop(bounds);size=64 if name=='window' else 96;part.thumbnail((size-8,size-8),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(size,size));out.alpha_composite(part,((size-part.width)//2,size-4-part.height));out.save(root/'assets/world/objects'/f'town-{name}.png')
print('Extracted 12 alpha-padded town sprites from measured source bounds')

import shutil
shutil.copyfile(root/'assets/world/terrain/elderwood/stone.png',root/'assets/world/objects/town-floor-stone.png')
