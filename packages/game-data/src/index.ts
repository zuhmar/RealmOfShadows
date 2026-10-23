export const WORLD = { tile:64, width:32, height:24, speed:4, sprint:1.5, capacity:32, spawn:{x:16.5,y:14.5} };
export const landmarks = [
 {name:'The Copperleaf Bank',x:5,y:5,w:5,h:4,color:0x668ca0,description:'Your future vault. Banking arrives in Phase 5.'},
 {name:'Willow & Anvil',x:22,y:5,w:5,h:4,color:0xb78256,description:'The crafting district. Professions arrive in Phase 4.'},
 {name:'Adventurers’ Hall',x:5,y:17,w:5,h:4,color:0x8b77a3,description:'A home for future parties and guilds.'},
 {name:'Whispering Gate',x:23,y:17,w:4,h:3,color:0x668b72,description:'The woods await. Hunting opens in Phase 3.'},
];
export function blocked(x:number,y:number):boolean {
 return x<1||y<1||x>=WORLD.width-1||y>=WORLD.height-1||landmarks.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)||(x===16&&y===10);
}
export type Facing='down'|'left'|'right'|'up';
export interface SpriteManifest {key:string;url:string;frameWidth:number;frameHeight:number;anchor:{x:number;y:number};scale:number;animations:Partial<Record<'idle'|'walk',Record<Facing,{frames:number[];fps:number}>>>}
// Add a supplied sprite sheet here. Empty means explicit geometric placeholders.
export const characterSprite:SpriteManifest|null=null;
