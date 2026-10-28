"""Extract the generated 6-by-8 terrain master into native 32px tiles.
No reference maps are consumed. Padding is duplicated for GPU filtering only.
"""
from pathlib import Path
from PIL import Image
import shutil
root=Path(__file__).resolve().parents[1]
folder=root/'assets/world/terrain';folder.mkdir(parents=True,exist_ok=True)
master=folder/'master.png'
if not master.exists():shutil.copy('/workspace/generated_images/exec-3fb74296-c03b-482c-a1c1-d9c0b4221585.png',master)
im=Image.open(master).convert('RGB')
biomes=['elderwood','woods','caverns','swamp','tundra','celestial','peaks','fortress']
materials=['ground','path','stone','water','bridge','wall']
for row,biome in enumerate(biomes):
 dest=folder/biome;dest.mkdir(exist_ok=True);atlas=Image.new('RGB',(216,36))
 for col,material in enumerate(materials):
  custom=dest/'master.png'
  if biome=='elderwood' and custom.exists():
   source=Image.open(custom).convert('RGB');cx=col%3;cy=col//3
   tile=source.crop((round(cx*source.width/3),round(cy*source.height/2),round((cx+1)*source.width/3),round((cy+1)*source.height/2))).resize((32,32),Image.Resampling.LANCZOS)
  else:
   tile=im.crop((round(col*im.width/6),round(row*im.height/8),round((col+1)*im.width/6),round((row+1)*im.height/8))).resize((32,32),Image.Resampling.LANCZOS)
  tile.save(dest/f'{material}.png');x=col*36+2;atlas.paste(tile,(x,2))
  for ox in range(-2,34):
   for oy in range(-2,34):
    if 0<=ox<32 and 0<=oy<32:continue
    atlas.putpixel((x+ox,2+oy),tile.getpixel((max(0,min(31,ox)),max(0,min(31,oy)))))
 atlas.save(dest/'atlas.png')
print('8 distinct island atlases, 48 native 32x32 material sprites')
