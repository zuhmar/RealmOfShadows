// Frame regions measured against the supplied 1536×1024 presentation sheet.
// Insets exclude the grid; the source image and its alpha channel stay unchanged.
export const suppliedCharacterSheet = {
 width:1536,height:1024,
 rows:[{direction:'down',top:102,bottom:318},{direction:'left',top:324,bottom:542},{direction:'right',top:548,bottom:767},{direction:'up',top:773,bottom:990}],
 groups:[
  {action:'idle',fps:5,columns:[[88,195],[195,307],[307,418],[418,535]]},
  {action:'walk',fps:8,columns:[[541,659],[659,781],[781,902],[902,1022]]},
 ],
} as const;

// Idle-only sheet: two columns of artwork, four direction rows.
// Keep the generous horizontal margins outside the frame rectangles.
export const idleCharacterSheet = {
 width:1536,height:1024,
 rows:[{direction:'down',top:20,bottom:276},{direction:'left',top:280,bottom:524},{direction:'right',top:530,bottom:760},{direction:'up',top:770,bottom:1004}],
 groups:[{action:'idle',fps:3,columns:[[464,720],[832,1088]]}],
} as const;
