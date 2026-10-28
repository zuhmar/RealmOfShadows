"""Extract measured transparent gutters; preserve the original painted master."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
image=Image.open(root/'assets/world/buildings/master.png').convert('RGBA')
columns=[(0,449),(449,889),(889,1332),(1332,1774)]
names=[['sign-smithy','sign-workshop','sign-bank','sign-hall'],['forge','workbench','counter','table']]
for row,(top,bottom) in enumerate([(0,378),(378,887)]):
 for col,(left,right) in enumerate(columns):
  part=image.crop((left,top,right,bottom));bounds=part.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox()
  if not bounds:raise ValueError(names[row][col])
  part=part.crop(bounds);size=(128,64) if row==0 else (96,96)
  part.thumbnail((size[0]-8,size[1]-8),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',size);canvas.alpha_composite(part,((size[0]-part.width)//2,size[1]-4-part.height))
  canvas.save(root/'assets/world/objects'/f'village-{names[row][col]}.png')
print('Extracted four signs and four furniture sprites with true-alpha padding')
