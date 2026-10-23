import terrainUrl from '../../../assets/tilesets/elderwood/Glossy Cartoon Terrain Tileset.png';

// The glossy sheet is illustrated swatches, not a uniform, seamless atlas.
// Sample inside each painted border to exclude the background and gutters.
// Keep the original PNG unchanged; these rectangles are Phaser texture frames.
export const elderwoodTerrain={key:'elderwood-terrain',url:terrainUrl,
 columns:[64,316,564,812,1064,1312],rows:{grass:64,dirt:312,stone:552,water:792},size:160};
export type TerrainKind=keyof typeof elderwoodTerrain.rows;
export {elderwoodGround} from '@realm/game-data';
// Coordinate-based variation stays stable across travel and across clients.
export function terrainVariant(x:number,y:number){return ((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0)%6;}
