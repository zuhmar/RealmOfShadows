"""Slice the generated five-by-four icon atlas into padded native inventory assets."""
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
source=Image.open(ROOT/'assets/generated/story/story-icons-atlas.png').convert('RGBA')
ids=['familyLocket','trainingManual','trailCharter','rangersMark','crystalCompass','expeditionLedger','survivorRibbon','citySeal','veteransJournal','frostMedallion','sunLens','seraphSigil','emberIngot','dragonWard','brokenChain','memorialStar','knightInsignia','archerInsignia','mageInsignia','rogueInsignia']
folder=ROOT/'assets/items/story';folder.mkdir(exist_ok=True,parents=True)
preview=Image.new('RGBA',(640,512))
# Locate complete alpha-connected objects globally; several objects cross nominal grid lines.
mask=np.asarray(source)[:,:,3]>32
height,width=mask.shape
components=[[] for _ in ids]
for yy,xx in zip(*np.where(mask)):
 if not mask[yy,xx]:continue
 stack=[(int(xx),int(yy))];mask[yy,xx]=False;left=right=int(xx);top=bottom=int(yy);count=0
 while stack:
  x,y=stack.pop();count+=1;left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
  for dx,dy in ((-1,0),(1,0),(0,-1),(0,1)):
   nx,ny=x+dx,y+dy
   if 0<=nx<width and 0<=ny<height and mask[ny,nx]:mask[ny,nx]=False;stack.append((nx,ny))
 if count>30:
  col=min(4,int(((left+right)/2)/width*5));row=min(3,int(((top+bottom)/2)/height*4));components[row*5+col].append((left,top,right+1,bottom+1))
for i,key in enumerate(ids):
 col,row=i%5,i//5
 if not components[i]:raise ValueError('Empty icon: '+key)
 boxes=components[i];box=(max(0,min(b[0] for b in boxes)-2),max(0,min(b[1] for b in boxes)-2),min(width,max(b[2] for b in boxes)+2),min(height,max(b[3] for b in boxes)+2))
 cell=source.crop(box);cell.thumbnail((104,104),Image.Resampling.LANCZOS)
 icon=Image.new('RGBA',(128,128));icon.alpha_composite(cell,((128-cell.width)//2,(128-cell.height)//2));icon.save(folder/(key+'.png'))
 assert icon.getchannel('A').getpixel((0,0))==0
 preview.alpha_composite(icon,(col*128,row*128))
preview.save(ROOT/'assets/generated/previews/story-keepsakes.png')
print('Extracted 20 transparent 128x128 story icons with original generated colors and proportions.')
