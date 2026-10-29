import type Phaser from 'phaser';
// World props are independent PNG sprites. Large objects are never cut into terrain tiles.
const files=import.meta.glob('../../../assets/world/objects/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const square=import.meta.glob('../../../assets/world/square-props/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const byKey=new Map<string,{key:string;url:string}>();
for(const [path,url]of Object.entries({...files,...square})){const key=path.split('/').at(-1)!.replace('.png','');byKey.set(key,{key,url});}
export const mapObjectTileAssets=[...byKey.values()];
export function installMapObjectTiles(_scene:Phaser.Scene){}
