import url from '../../../assets/characters/Mara the Trader RPG Sprite Sheet.png';

// Original combined sheet: first two columns idle, next two walk.
// Explicit bounds account for the large gap between the animation groups.
export const maraAsset={key:'mara-trader',url,scale:.25,origin:.97,
 rows:[{direction:'down',top:0,bottom:280},{direction:'left',top:280,bottom:528},{direction:'right',top:528,bottom:768},{direction:'up',top:768,bottom:1024}],
 groups:[{action:'idle',fps:2,columns:[[170,380],[410,620]]},{action:'walk',fps:6,columns:[[950,1160],[1190,1400]]}]
} as const;
