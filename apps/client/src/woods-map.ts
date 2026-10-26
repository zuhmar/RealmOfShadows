import type Phaser from 'phaser';
import northwest from '../../../assets/generated/woods-sections/northwest.webp?url';
import northeast from '../../../assets/generated/woods-sections/northeast.webp?url';
import southwest from '../../../assets/generated/woods-sections/southwest.webp?url';
import southeast from '../../../assets/generated/woods-sections/southeast.webp?url';

// Each painted section covers 800×544 pixels of the old 1536×1024 layout.
// Adjacent sections share 64 source pixels. Assemble at 2× layout resolution;
// source artwork is independently detailed, rather than enlarging the old PNG.
export const woodsMapAssets=[
 {key:'woods-ground-nw',url:northwest},{key:'woods-ground-ne',url:northeast},
 {key:'woods-ground-sw',url:southwest},{key:'woods-ground-se',url:southeast},
];
export const woodsGroundSize={width:3072,height:2048};

// Painted landmarks can drift slightly between independently drawn sections.
// Register their UV coordinates to the original layout before blending: these
// pairs are [painted coordinate, layout coordinate], normalized within a section.
// This keeps road junctions and both halves of the portal paving aligned.
const registration=[
 {x:[[0,0],[.35,.35],[.555,.616],[.597,.645],[.65,.702],[.963,.959],[1,1]],y:[[0,0],[.20,.20],[.425,.462],[.642,.696],[.762,.825],[.935,.985],[1,1]]},
 {x:[[0,0],[.04,.04],[.30,.317],[.60,.60],[1,1]],y:[[0,0],[.30,.30],[.66,.695],[.801,.825],[1,1]]},
 {x:[[0,0],[.35,.35],[.595,.621],[.942,.959],[1,1]],y:[[0,0],[.41,.412],[.66,.65],[.88,.90],[1,1]]},
 {x:[[0,0],[.05,.04],[.315,.318],[.60,.60],[1,1]],y:[[0,0],[.24,.24],[.64,.64],[.88,.90],[1,1]]},
];
function drawSection(context:CanvasRenderingContext2D,source:HTMLImageElement,index:number){
 const {x,y}=registration[index];
 for(let row=0;row<y.length-1;row++)for(let col=0;col<x.length-1;col++){
  const [sx,dx]=x[col],[ex,rx]=x[col+1],[sy,dy]=y[row],[ey,ry]=y[row+1];
  const left=Math.round(dx*1600),top=Math.round(dy*1088),right=Math.round(rx*1600),bottom=Math.round(ry*1088);
  context.drawImage(source,sx*source.width,sy*source.height,(ex-sx)*source.width,(ey-sy)*source.height,left,top,right-left,bottom-top);
 }
}

export function installWoodsGround(scene:Phaser.Scene){
 if(scene.textures.exists('woods-base'))return;
 const {width,height}=woodsGroundSize;
 const output=scene.textures.createCanvas('woods-base',width,height)!;
 const row=document.createElement('canvas');row.width=width;row.height=1088;
 const patch=document.createElement('canvas');patch.width=1600;patch.height=1088;
 const rowContext=row.getContext('2d')!,patchContext=patch.getContext('2d')!;
 for(let y=0;y<2;y++){
  rowContext.clearRect(0,0,row.width,row.height);
  for(let x=0;x<2;x++){
   patchContext.clearRect(0,0,patch.width,patch.height);
   patchContext.globalCompositeOperation='source-over';
   patchContext.imageSmoothingEnabled=true;patchContext.imageSmoothingQuality='high';
   const source=scene.textures.get(woodsMapAssets[y*2+x].key).getSourceImage();
   drawSection(patchContext,source as HTMLImageElement,y*2+x);
   if(x){const fade=patchContext.createLinearGradient(56,0,72,0);fade.addColorStop(0,'transparent');fade.addColorStop(1,'white');patchContext.globalCompositeOperation='destination-in';patchContext.fillStyle=fade;patchContext.fillRect(0,0,patch.width,patch.height);}
   rowContext.drawImage(patch,x*1472,0);
  }
  // Blend entire rows after horizontal assembly, so the four-way intersection
  // has the same weights as every other seam and never reveals a dark gap.
  if(y){const fade=rowContext.createLinearGradient(0,56,0,72);fade.addColorStop(0,'transparent');fade.addColorStop(1,'white');rowContext.globalCompositeOperation='destination-in';rowContext.fillStyle=fade;rowContext.fillRect(0,0,row.width,row.height);rowContext.globalCompositeOperation='source-over';}
  output.getContext().drawImage(row,0,y*960);
 }
 output.refresh();
 // Release temporary backing stores and GPU copies; only the finished terrain
 // texture is needed during play. Original source files remain in the repo.
 row.width=row.height=patch.width=patch.height=1;
 for(const asset of woodsMapAssets)scene.textures.remove(asset.key);
}
