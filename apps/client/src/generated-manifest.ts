import {generatedFrames,type GeneratedFrame} from './generated-frames';
export type {GeneratedFrame} from './generated-frames';
import buildingsUrl from '../../../assets/generated/buildings.png?url';
import villageUrl from '../../../assets/generated/village.png?url';
import forestUrl from '../../../assets/generated/forest.png?url';
import itemsUrl from '../../../assets/generated/items.png?url';
import characterUrl from '../../../assets/generated/character.png?url';
export interface GeneratedSheet {key:string;url:string;scale:number;frames:Record<string,GeneratedFrame>}
export const generatedSheets:GeneratedSheet[]=[
 {key:'generated-buildings',url:buildingsUrl,scale:2,frames:generatedFrames.buildings},
 {key:'generated-village',url:villageUrl,scale:2,frames:generatedFrames.village},
 {key:'generated-forest',url:forestUrl,scale:2,frames:generatedFrames.forest},
 {key:'generated-items',url:itemsUrl,scale:1,frames:generatedFrames.items},
 {key:'generated-character',url:characterUrl,scale:1,frames:generatedFrames.character},
];
