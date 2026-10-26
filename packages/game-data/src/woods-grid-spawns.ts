// Cell coordinates for the active tile map. Keep IDs stable for respawns and
// distribute each species through its clearing and the paths approaching it.
export const woodsGridEncounters={
 wolf:{habitat:[[8,6],[16,5],[6,11],[16,12]],approach:[[10,17],[18,8],[23,7],[10,20],[26,9]]},
 spider:{habitat:[[8,33],[16,32],[6,38],[17,39]],approach:[[10,28],[18,36],[23,35],[10,25],[26,36]]},
 boar:{habitat:[[52,6],[59,5],[50,12],[59,13]],approach:[[57,18],[46,8],[43,7],[57,22],[49,9]]},
 bear:{habitat:[[55,35]],approach:[]},
} as const;
