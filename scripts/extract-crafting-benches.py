"""Pack four separately painted counters at a shared scale and floor anchor."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'assets/world/crafting-hall/benches-master.png').convert('RGBA')
frames=[];layout={}
for name,(col,row) in zip(['blacksmithing','woodworking','cooking','alchemy'],[(0,0),(1,0),(0,1),(1,1)]):
 x0=col*im.width//2;y0=row*im.height//2
 piece=im.crop((x0,y0,(col+1)*im.width//2,(row+1)*im.height//2))
 bounds=piece.getchannel('A').point(lambda v:255 if v>16 else 0).getbbox()
 if not bounds:raise ValueError(name)
 layout[name]=[x0+bounds[0],y0+bounds[1],x0+bounds[2],y0+bounds[3]]
 frames.append((name,piece.crop(bounds)))
scale=min(120/max(p.width for _,p in frames),120/max(p.height for _,p in frames))
for name,piece in frames:
 piece=piece.resize((round(piece.width*scale),round(piece.height*scale)),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(128,128));out.alpha_composite(piece,((128-piece.width)//2,124-piece.height))
 out.save(root/f'assets/world/objects/craft-bench-{name}.png')
(root/'assets/world/crafting-hall/layout.json').write_text(json.dumps(layout,indent=2)+'\n')
print('Packed four distinct 128px counters with a shared scale and baseline')
