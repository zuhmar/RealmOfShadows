"""Extract measured, disconnected head poses without modifying source artwork."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label,find_objects
root=Path(__file__).resolve().parents[1]
image=Image.open(root/'assets/equipment/masters/heads.png').convert('RGBA');w,h=image.size
labels,n=label(np.asarray(image)[:,:,3]>64);frames={}
tiers=['beginner','copper','iron','gold','mythril','dragon','shadow'];directions=['front','side','back']
for i,sl in enumerate(find_objects(labels),1):
 if not sl or np.count_nonzero(labels[sl]==i)<500:continue
 yy,xx=sl;row=min(6,int((yy.start+yy.stop)/2/h*7));col=min(2,int((xx.start+xx.stop)/2/w*3))
 x=max(0,xx.start-2);y=max(0,yy.start-2);sw=min(w,xx.stop+2)-x;sh=min(h,yy.stop+2)-y
 scale=min(62/sw,62/sh);dw=sw*scale;dh=sh*scale
 frames['gear-head-'+tiers[row]+'-'+directions[col]]={'source':[x,y,sw,sh],'size':[64,64],'placement':[(64-dw)/2,64-dh,dw,dh]}
assert len(frames)==21,len(frames)
image.save(root/'assets/equipment/heads.webp',quality=95,method=6)
(root/'apps/client/src/equipment-head-frames.ts').write_text("import type {GeneratedFrame} from './generated-frames';\nexport const equipmentHeadFrames:Record<string,GeneratedFrame>="+json.dumps(frames,separators=(',',':'))+';\n')
print('Extracted 21 front/profile/back equipped heads with stable chin baseline')
