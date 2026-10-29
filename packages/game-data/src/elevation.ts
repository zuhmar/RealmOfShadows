/** First outdoor stacked floor. Logical coordinates are shared with the Woods below. */
export const woodsLedge={x:37,y:3,width:6,height:4,faceHeight:2,from:'woods',to:'woods-upper'} as const;
export const isRaisedFloor=(region:string)=>region==='woods-upper';
export const visibleFloor=(viewer:string,other:string)=>viewer===other||(viewer==='woods'&&other==='woods-upper')||(viewer==='woods-upper'&&other==='woods');
export const floorDepth=(region:string)=>isRaisedFloor(region)?1024:0;
