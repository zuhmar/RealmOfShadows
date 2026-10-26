import type Phaser from 'phaser';
// World props are independent PNG sprites. Large objects are never cut into terrain tiles.
const files=import.meta.glob('../../../assets/world/objects/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const mapObjectTileAssets=Object.entries(files).map(([path,url])=>({key:path.split('/').at(-1)!.replace('.png',''),url}));
export function installMapObjectTiles(_scene:Phaser.Scene){}
