import {generatedFrames,type GeneratedFrame} from './generated-frames';
export type {GeneratedFrame} from './generated-frames';
import buildingsUrl from '../../../assets/generated/buildings.png?url';
import villageUrl from '../../../assets/generated/village.png?url';
import forestUrl from '../../../assets/generated/forest.png?url';
import itemsUrl from '../../../assets/generated/items.png?url';
import characterUrl from '../../../assets/generated/character.png?url';
import hoodedUrl from '../../../assets/generated/hooded.png?url';
export interface GeneratedSheet {key:string;url:string;scale:number;frames:Record<string,GeneratedFrame>}
// Common materials use the same painted source in both regions. Each destination
// retains its own logical canvas and placement, so world footprints stay intact.
export const sharedEnvironmentSprites:Record<string,string>=Object.fromEntries(
 ['oak','pine','boulder','banner','lamp','gate-pier'].map(name=>[`woods-${name}`,`elderwood-${name}`]),
);
export const generatedSheets:GeneratedSheet[]=[
 {key:'generated-buildings',url:buildingsUrl,scale:2,frames:generatedFrames.buildings},
 {key:'generated-village',url:villageUrl,scale:2,frames:generatedFrames.village},
 {key:'generated-forest',url:forestUrl,scale:2,frames:generatedFrames.forest},
 {key:'generated-items',url:itemsUrl,scale:1,frames:generatedFrames.items},
 {key:'generated-character',url:characterUrl,scale:1,frames:generatedFrames.character},
 {key:'generated-hooded',url:hoodedUrl,scale:1,frames:generatedFrames.hooded},
];
