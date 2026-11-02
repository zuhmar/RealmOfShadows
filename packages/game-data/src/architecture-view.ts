/** Approved Depot geometry, shared by Elderwood shells. Values use logical grid cells. */
export const architectureView={storyShift:.25,frontGutter:.25,wallHeight:1.25} as const;
export function projectedWall(key:string,x:number,y:number,w:number,h:number,level:number){
 const east=key.startsWith('house-wall-e'),west=key.startsWith('house-wall-w'),short=h<1;
 x-=(level+1)*architectureView.storyShift;
 if(east){w+=architectureView.frontGutter;h+=architectureView.wallHeight;}
 else if(!west)w+=architectureView.frontGutter;
 key=key.replace('house-wall-','house-depot-wall-');
 if(short&&(east||west))key=key.replace(/wall-([ew])(-window)?$/, 'wall-$1-short$2');
 return{key,x,y,w,h};
}
