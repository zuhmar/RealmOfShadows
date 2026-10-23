import terrainUrl from '../../../assets/tilesets/elderwood/Glossy Cartoon Terrain Tileset.png';
import woodsUrl from '../../../assets/tilesets/whispering-woods/Whispering Woods Fantasy Tileset.png';

// The glossy sheet is illustrated swatches, not a uniform, seamless atlas.
// Sample inside each painted border to exclude the background and gutters.
// Keep the original PNG unchanged; these rectangles are Phaser texture frames.
export const elderwoodTerrain={key:'elderwood-terrain',url:terrainUrl,
 columns:[64,316,564,812,1064,1312],rows:{grass:64,dirt:312,stone:552,water:792},size:160};
export type TerrainKind=keyof typeof elderwoodTerrain.rows;
export {elderwoodGround} from '@realm/game-data';
// Coordinate-based variation stays stable across travel and across clients.
export function terrainVariant(x:number,y:number){return ((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0)%6;}

// Matching illustrated layout, with its own forest artwork and palette.
export const woodsTerrain={key:'woods-terrain',url:woodsUrl,
 columns:[64,316,564,812,1064,1312],rows:{grass:64,dirt:312,stone:552,water:792},size:160};
export const terrainAssets=[elderwoodTerrain,woodsTerrain];
export function woodsGround(x:number,y:number):TerrainKind{
 if(Math.abs(x-16)<=2&&Math.abs(y-13)<=2)return 'stone';
 if(Math.abs(x-16)<2||Math.abs(y-13)<2)return 'dirt';
 return 'grass';
}
