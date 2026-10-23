// One tile layout drives rendering and shared client/server collision.
export const elderwoodPonds=[{x:11,y:5,w:3,h:4},{x:19,y:18,w:3,h:3}] as const;
export type ElderwoodTerrain='grass'|'dirt'|'stone'|'water';
export function elderwoodGround(x:number,y:number):ElderwoodTerrain{
 if(Math.abs(x-16)<=3&&Math.abs(y-13)<=3)return 'stone';
 if(Math.abs(x-16)<2||Math.abs(y-13)<2)return 'dirt';
 if(elderwoodPonds.some(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h))return 'water';
 return 'grass';
}
