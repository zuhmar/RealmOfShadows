"""Pack four purpose-drawn cardinal views per profession; preserve atlas unchanged."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'assets/world/crafting-hall/tools-directions-master.png').convert('RGBA')
w,h=im.size
# Measured transparent row gutters; the tall retorts extend above an equal quarter.
rows=[(0,320),(320,620),(620,885),(885,h)]
for row,name in enumerate(['blacksmithing','woodworking','cooking','alchemy']):
 parts=[]
 for col,facing in enumerate(['down','left','right','up']):
  top,bottom=rows[row]
  part=im.crop((col*w//4,top,(col+1)*w//4,bottom))
  bounds=part.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
  assert bounds,(name,facing)
  parts.append((facing,part.crop(bounds)))
 scale=min(60/max(p.width for _,p in parts),60/max(p.height for _,p in parts))
 for facing,part in parts:
  part=part.resize((round(part.width*scale),round(part.height*scale)),Image.Resampling.LANCZOS)
  out=Image.new('RGBA',(64,64));out.alpha_composite(part,((64-part.width)//2,62-part.height))
  out.save(root/f'assets/world/objects/counter-tools-{name}-{facing}.png')
  # Keep the prior public front key available for existing map placements.
  if facing=='down':out.save(root/f'assets/world/objects/counter-tools-{name}.png')
  print(name,facing,part.size,out.getchannel('A').getextrema())
