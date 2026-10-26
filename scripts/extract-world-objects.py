import json
from pathlib import Path
from PIL import Image
r=Path(__file__).resolve().parents[1];(r/'assets/world/objects').mkdir(parents=True,exist_ok=True);p=r/'assets/tilesets/shared-32';meta=json.loads((p/'object-prefabs.json').read_text());pages=[Image.open(p/f'objects-{i}.png').convert('RGBA') for i in range(4)]
for o in meta['prefabs']:
 out=Image.new('RGBA',(o['width'],o['height']))
 for i,n in enumerate(o['tiles']):
  if n<0:continue
  page,cell=divmod(n,1024);x=(cell%32)*32;y=(cell//32)*32
  out.paste(pages[page].crop((x,y,x+32,y+32)),((i%o['columns'])*32,(i//o['columns'])*32))
 out.save(r/'assets/world/objects'/f"{o['key']}.png",optimize=True)
print('Exported',len(meta['prefabs']),'individual transparent object sprites')
