// Idle-only sheet: two columns of artwork, four direction rows.
// Keep the generous horizontal margins outside the frame rectangles.
export const idleCharacterSheet = {
 width:1536,height:1024,
 rows:[{direction:'down',top:20,bottom:276},{direction:'left',top:280,bottom:524},{direction:'right',top:530,bottom:760},{direction:'up',top:770,bottom:1004}],
 groups:[{action:'idle',fps:3,columns:[[464,720],[832,1088]]}],
} as const;
