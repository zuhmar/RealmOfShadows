const files=import.meta.glob('../../../assets/monsters/svg/*.svg',{eager:true,query:'?url&no-inline',import:'default'}) as Record<string,string>;
export const monsterAssets=Object.entries(files).map(([p,url])=>({key:p.split('/').at(-1)!.replace('.svg',''),url}));

import generatedUrl from '../../../assets/monsters/generated/whispering-woods-monsters.png?url';
// Keep the generated PNG intact. Phaser extracts each alpha-padded region at runtime.
export const generatedMonsters={key:'woods-monster-png',url:generatedUrl,frames:{
 spider:{x:30,y:204,w:690,h:467,width:120},
 boar:{x:787,y:168,w:514,h:499,width:108},
 bear:{x:1398,y:0,w:741,h:714,width:178}
}};
