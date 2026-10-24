export type MapPolygon=readonly (readonly [number,number])[];
export interface IslandObject{key:string;x:number;y:number;w:number;h:number;footY:number;collision:MapPolygon;name?:string;description?:string}
export interface IslandGeometry{rivers:readonly MapPolygon[];cliffs:readonly MapPolygon[];bridges:readonly MapPolygon[]}
export function mapObject(key:string,x:number,y:number,w:number,h:number,collision:MapPolygon=[],name?:string):IslandObject{
 return {key,x,y,w,h,footY:y+h*.96,collision:collision.map(([px,py])=>[x+px*w,y+py*h]),name};
}
export function rectangle(x:number,y:number,w:number,h:number):MapPolygon{return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}
export function pointInPolygon(x:number,y:number,polygon:MapPolygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [ax,ay]=polygon[i],[bx,by]=polygon[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result;}return result;}
// Spatial buckets keep dense reference-driven maps inexpensive to collide with.
export function islandCollision(width:number,height:number,geometry:IslandGeometry,objects:readonly IslandObject[]){
 const size=64,columns=Math.ceil(width/size),buckets=new Map<number,{terrain:MapPolygon[];bridges:MapPolygon[];objects:MapPolygon[]}>();
 const insert=(polygon:MapPolygon,kind:'terrain'|'bridges'|'objects')=>{if(!polygon.length)return;const minX=Math.max(0,Math.floor(Math.min(...polygon.map(p=>p[0]))/size)),maxX=Math.min(columns-1,Math.floor(Math.max(...polygon.map(p=>p[0]))/size)),minY=Math.max(0,Math.floor(Math.min(...polygon.map(p=>p[1]))/size)),maxY=Math.min(Math.ceil(height/size)-1,Math.floor(Math.max(...polygon.map(p=>p[1]))/size));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const index=y*columns+x,bucket=buckets.get(index)??{terrain:[],bridges:[],objects:[]};bucket[kind].push(polygon);buckets.set(index,bucket);}};
 for(const p of [...geometry.rivers,...geometry.cliffs])insert(p,'terrain');for(const p of geometry.bridges)insert(p,'bridges');for(const object of objects)insert(object.collision,'objects');
 const clip=(polygon:MapPolygon,minX:number,minY:number,maxX:number,maxY:number)=>{
  let out=polygon.map(p=>[p[0],p[1]] as [number,number]);
  for(const [axis,bound,lower] of [[0,minX,true],[0,maxX,false],[1,minY,true],[1,maxY,false]] as const){const input=out;out=[];for(let i=0;i<input.length;i++){const a=input[i],b=input[(i+1)%input.length],aIn=lower?a[axis]>=bound:a[axis]<=bound,bIn=lower?b[axis]>=bound:b[axis]<=bound;if(aIn)out.push(a);if(aIn!==bIn){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}}
  let area=0;for(let i=0;i<out.length;i++){const a=out[i],b=out[(i+1)%out.length];area+=a[0]*b[1]-b[0]*a[1];}return Math.abs(area)>1e-5?out:[];
 };
 return (x:number,y:number,radius=0)=>{
  if(x-radius<0||y-radius<0||x+radius>=width||y+radius>=height)return true;
  const candidates={terrain:new Set<MapPolygon>(),bridges:new Set<MapPolygon>(),objects:new Set<MapPolygon>()};
  for(let by=Math.floor((y-radius)/size);by<=Math.floor((y+radius)/size);by++)for(let bx=Math.floor((x-radius)/size);bx<=Math.floor((x+radius)/size);bx++){const bucket=buckets.get(by*columns+bx);if(bucket)for(const kind of ['terrain','bridges','objects'] as const)for(const polygon of bucket[kind])candidates[kind].add(polygon);}
  if(radius===0){const inAny=(polygons:Set<MapPolygon>)=>[...polygons].some(p=>pointInPolygon(x,y,p));return inAny(candidates.objects)||(inAny(candidates.terrain)&&!inAny(candidates.bridges));}
  const intersection=(p:MapPolygon)=>clip(p,x-radius,y-radius,x+radius,y+radius);
  if([...candidates.objects].some(p=>intersection(p).length))return true;
  // Convex bridge decks can cover just the wet part of a land/bridge footprint.
  return [...candidates.terrain].some(p=>{const wet=intersection(p);return wet.length>0&&![...candidates.bridges].some(deck=>wet.every(([px,py])=>pointInPolygon(px,py,deck)));});
 };
}
