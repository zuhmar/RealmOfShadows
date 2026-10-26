export const equipmentTiers={
 beginner:{name:'Beginner',level:1,color:0x759bc4},
 copper:{name:'Copper',level:5,color:0xc47b43},
 iron:{name:'Iron',level:11,color:0xaab9c8},
 gold:{name:'Gold',level:21,color:0xe2bc46},
 mythril:{name:'Mythril',level:31,color:0x76d5e8},
 dragon:{name:'Dragon',level:51,color:0xd5553f},
 shadow:{name:'Shadow',level:61,color:0xa679dc},
} as const;
export type EquipmentTier=keyof typeof equipmentTiers;
