import {gridMap,regions,stairsFor,portalFor,isLowerFloor,isRaisedFloor,isHousingFloor,storyNpcs,merchant,type RegionId} from '@realm/game-data';

interface Point{x:number;y:number}
export interface MinimapActor extends Point{region?:string;hp?:number}
export function minimapLayout(region:RegionId,width=360,height=270,center?:Point){
 const map=gridMap(region),scale=Math.min((width-16)/(center?Math.min(map.width,48):map.width),(height-16)/(center?Math.min(map.height,36):map.height));
 const offset=(length:number,size:number,value:number)=>length*scale<=size-16?(size-length*scale)/2:8-Math.max(0,Math.min(length-(size-16)/scale,value-(size-16)/scale/2))*scale;
 return{scale,left:offset(map.width,width,center?.x??map.width/2),top:offset(map.height,height,center?.y??map.height/2),width:map.width*scale,height:map.height*scale};
}
export function minimapMarkers(region:RegionId){
 const portal=!isLowerFloor(region)&&!isRaisedFloor(region)&&!isHousingFloor(region)?[{...portalFor(region),kind:'portal' as const}]:[];
 return [...portal,...stairsFor(region).map(s=>({...s,kind:'stairs' as const})),...storyNpcs.filter(n=>n.region===region).map(n=>({...n,kind:'npc' as const})),...(region==='elderwood'?[{...merchant,region:'elderwood' as const,kind:'npc' as const}]:[])];
}
export function minimapFloor(region:RegionId){return isLowerFloor(region)?'B1':region==='elderwood-homes-attic'?'F3':region==='elderwood-homes-upper'?'F2':isRaisedFloor(region)||region==='elderwood-upper'?'F1':'G';}
function palette(region:RegionId){
 if(region.startsWith('caverns'))return['#596182','#77728f','#9b92b0','#24425e','#ac9471','#38314d'];
 if(region==='swamp')return['#4a6752','#81805b','#969b86','#254d5b','#ad9667','#2c3938'];
 return region.startsWith('woods')?['#416144','#8e7752','#999b76','#286477','#b8a176','#353d36']:['#6e894d','#b29866','#b6b1a0','#347a91','#b99568','#535f59'];
}

/** A cached terrain overview with lightweight live markers, independent of camera zoom. */
export class Minimap{
 private root=document.querySelector<HTMLElement>('#minimap')!;
 private canvas=document.querySelector<HTMLCanvasElement>('#minimap-canvas')!;
 private title=document.querySelector<HTMLElement>('#minimap-name')!;
 private coords=document.querySelector<HTMLElement>('#minimap-coordinates')!;
 private toggle=document.querySelector<HTMLButtonElement>('#minimap-toggle')!;
 private content=document.querySelector<HTMLElement>('#minimap-content')!;
 private terrain=new Map<RegionId,HTMLCanvasElement>();
 private region?:RegionId;private nextAt=0;
 constructor(){
  this.toggle.addEventListener('click',()=>{
   this.content.hidden=!this.content.hidden;this.toggle.setAttribute('aria-expanded',String(!this.content.hidden));
   this.toggle.setAttribute('aria-label',`${this.content.hidden?'Show':'Hide'} minimap`);
   this.root.classList.toggle('is-collapsed',this.content.hidden);this.nextAt=0;
  });
 }
 hide(){this.root.hidden=true;}
 update(now:number,region:RegionId,player:Point,monsters:Iterable<MinimapActor>=[],peers:Iterable<MinimapActor>=[]){
  this.root.hidden=false;
  if(this.region!==region){this.region=region;this.nextAt=0;this.root.dataset.region=region;this.title.textContent=regions[region].name;this.title.title=regions[region].name;}
  if(this.content.hidden||now<this.nextAt)return;this.nextAt=now+100;
  const {width,height}=this.canvas,layout=minimapLayout(region,width,height,player),c=this.canvas.getContext('2d')!;
  let base=this.terrain.get(region);
  if(!base){
   const map=gridMap(region),colors=palette(region);base=document.createElement('canvas');base.width=map.width*4;base.height=map.height*4;const b=base.getContext('2d')!;
   b.save();b.scale(4,4);
   for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){b.fillStyle=colors[map.cells[y][x]]??colors[0];b.fillRect(x,y,1.01,1.01);}
   b.fillStyle='#1b2828aa';for(const key of map.propBlocked){const[x,y]=key.split(',').map(Number);b.fillRect(x,y,1,1);}
   b.strokeStyle='#242028';b.lineWidth=.3;b.beginPath();for(const edge of map.edges){const [axis,position]=edge.split(':'),[x,y]=position.split(',').map(Number);b.moveTo(x,y);b.lineTo(x+(axis==='h'?1:0),y+(axis==='v'?1:0));}b.stroke();b.restore();
   this.terrain.set(region,base);
  }
  c.fillStyle='#0e1720';c.fillRect(0,0,width,height);c.save();c.beginPath();c.rect(8,8,width-16,height-16);c.clip();c.imageSmoothingEnabled=false;c.drawImage(base,layout.left,layout.top,layout.width,layout.height);
  const unit=width/(this.canvas.clientWidth||180);
  const point=(p:Point)=>({x:layout.left+p.x*layout.scale,y:layout.top+p.y*layout.scale});
  const dot=(p:Point,color:string,radius:number)=>{const{x,y}=point(p);c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fillStyle=color;c.fill();c.strokeStyle='#10131d';c.lineWidth=1.5;c.stroke();};
  for(const marker of minimapMarkers(region)){
   const{x,y}=point(marker);c.fillStyle=marker.kind==='portal'?'#cf8bff':marker.kind==='stairs'?'#82e2e7':'#f1cd72';c.strokeStyle='#10131d';c.lineWidth=unit*.7;const size=unit*2.3;c.beginPath();
   if(marker.kind==='portal'){c.moveTo(x,y-size);c.lineTo(x+size,y);c.lineTo(x,y+size);c.lineTo(x-size,y);}
   else if(marker.kind==='stairs'){const d=marker.direction==='down'?-1:1;c.moveTo(x,y-size*d);c.lineTo(x+size,y+size*d);c.lineTo(x-size,y+size*d);}
   else c.rect(x-unit*1.5,y-unit*1.5,unit*3,unit*3);
   c.closePath();c.fill();c.stroke();
  }
  for(const m of monsters)if(m.region===region&&(m.hp??0)>0&&Math.hypot(m.x-player.x,m.y-player.y)<=12)dot(m,'#ee867c',unit*1.5);
  for(const p of peers)if(p.region===region&&(p.hp??1)>0)dot(p,'#86bbff',unit*1.8);
  dot(player,'#fff3c4',unit*3);c.restore();const p=point(player);this.canvas.dataset.playerX=String(p.x);this.canvas.dataset.playerY=String(p.y);
  this.coords.textContent=`${minimapFloor(region)} · ${Math.floor(player.x)}, ${Math.floor(player.y)}`;
  this.canvas.setAttribute('aria-label',`${regions[region].name} minimap. Your position: ${Math.floor(player.x)}, ${Math.floor(player.y)}. North is up.`);
 }
}
