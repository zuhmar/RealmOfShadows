import url from '../../../assets/characters/Mara the Trader RPG Sprite Sheet.png';

// Bounds inspected against the original 1536x1024 sheet, including padding.
// Idle columns read down/left/right/up. The walking middle rows are different:
// column 3 has BOTH right-facing steps; column 4 has BOTH left-facing steps.
// Register each frame explicitly rather than treating the sheet as a grid.
export const maraAsset={key:'mara-trader',url,scale:.25,origin:1,frameWidth:180,frameHeight:280,
 animations:[
  {key:'idle-down',fps:2,frames:[[202,10,144,265],[428,10,145,265]]},
  {key:'idle-left',fps:2,frames:[[197,280,135,242],[438,280,136,242]]},
  {key:'idle-right',fps:2,frames:[[191,528,140,236],[440,529,144,235]]},
  {key:'idle-up',fps:2,frames:[[196,764,143,243],[428,764,144,243]]},
  {key:'walk-down',fps:6,frames:[[972,10,142,264],[1214,11,141,268]]},
  {key:'walk-left',fps:6,frames:[[1203,280,159,246],[1202,528,156,240]]},
  {key:'walk-right',fps:6,frames:[[966,280,146,245],[966,528,153,242]]},
  {key:'walk-up',fps:6,frames:[[972,768,152,244],[1210,769,142,244]]}
 ]
} as const;
