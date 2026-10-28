"""Pack generated tool clusters; keep the original atlas unchanged."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'assets/world/crafting-hall/tools-master.png').convert('RGBA')
w,h=im.size
for index,name in enumerate(['blacksmithing','woodworking','cooking','alchemy']):
 x,y=(index%2)*w//2,(index//2)*h//2
 part=im.crop((x,y,x+w//2,y+h//2))
 bounds=part.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
 assert bounds,name
 part=part.crop(bounds);part.thumbnail((60,60),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(64,64));out.alpha_composite(part,((64-part.width)//2,(64-part.height)//2))
 out.save(root/f'assets/world/objects/counter-tools-{name}.png')
 print(name,im.size,bounds,out.getchannel('A').getextrema())
