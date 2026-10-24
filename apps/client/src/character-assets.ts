import downUrl from '../../../assets/characters/Citizen_walk_down.png?url';
import leftUrl from '../../../assets/characters/Citizen_walk_left.png?url';
import rightUrl from '../../../assets/characters/Citizen_walk_right.png?url';
import upUrl from '../../../assets/characters/Citizen_walk_up.png?url';

// Six 256px cells per sheet: idle first, followed by five walking frames.
// Alpha bounds include every nontransparent pixel. Phaser trims align their
// feet and centers inside a common 256px frame without changing the source PNGs.
export const characterAssets=[
 {key:'citizen-down',url:downUrl,direction:'down',bounds:[[61,10,195,246],[66,10,189,246],[70,10,185,246],[67,10,188,246],[67,10,188,246],[69,10,187,246]]},
 {key:'citizen-left',url:leftUrl,direction:'left',bounds:[[63,9,192,251],[62,9,194,251],[62,9,194,251],[63,9,193,251],[63,9,193,251],[63,9,193,251]]},
 {key:'citizen-right',url:rightUrl,direction:'right',bounds:[[66,12,190,248],[62,12,194,248],[67,12,189,248],[63,12,192,248],[65,12,191,248],[66,12,189,248]]},
 {key:'citizen-up',url:upUrl,direction:'up',bounds:[[62,6,193,250],[72,7,194,249],[73,12,194,245],[68,11,187,241],[72,15,186,239],[78,20,186,238]]},
] as const;
export const characterFrameSize=256;
export const characterStyle={scale:.30,origin:1};
