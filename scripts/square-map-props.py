"""Pack props into square transparent runtime canvases without resampling originals."""
from pathlib import Path
from PIL import Image
import re
root=Path(__file__).resolve().parents[1]
out=root/'assets/world/square-props';out.mkdir(exist_ok=True)
count=0
for source in sorted((root/'assets/world/objects').glob('*.png')):
 key=source.stem
 if re.match(r'^(house-|roof-|depot-(wall|floor|sign)|village-(wall|sign)|town-(floor|window)|crafting-hall-sign)',key):continue
 im=Image.open(source).convert('RGBA');w,h=im.size
 if w==h and not (out/source.name).exists():continue
 size=max(w,h);canvas=Image.new('RGBA',(size,size))
 canvas.paste(im,((size-w)//2,size-h));canvas.save(out/source.name);count+=1
print(f'Packed {count} nonsquare props into square RGBA frames; originals preserved.')

resources=root/'assets/professions/square-runtime';resources.mkdir(exist_ok=True)
for source in sorted((root/'assets/professions/runtime').glob('*.png')):
 im=Image.open(source).convert('RGBA');w,h=im.size;size=max(w,h)
 canvas=Image.new('RGBA',(size,size));canvas.paste(im,((size-w)//2,size-h));canvas.save(resources/source.name)
print('Packed gathering tree frames into square RGBA canvases.')
