export const islandResourceSets={
 elderwood:{name:'Elderwood',level:1,fish:[['pondMinnow','Pond Minnow'],['brookPerch','Brook Perch'],['goldenCarp','Golden Carp']],tree:{item:'oakLog',name:'Elderwood Oak',material:'Oak Log'},plant:{item:'meadowleaf',name:'Meadowleaf'}},
 woods:{name:'Whispering Woods',level:1,fish:[['leafscaleMinnow','Leafscale Minnow'],['mossfinTrout','Mossfin Trout'],['whisperPike','Whisper Pike']],tree:{item:'birchLog',name:'Silver Birch',material:'Birch Log'},plant:{item:'whisperfern',name:'Whisperfern'}},
 caverns:{name:'Crystal Caverns',level:11,fish:[['blindCavefish','Blind Cavefish'],['crystalGuppy','Crystal Guppy'],['gemscaleChar','Gemscale Char']],tree:{item:'crystalrootLog',name:'Crystalroot Tree',material:'Crystalroot Log'},plant:{item:'glowcap',name:'Glowcap'}},
 swamp:{name:'Murkmire Swamp',level:21,fish:[['mudskipper','Mudskipper'],['mireCatfish','Mire Catfish'],['bogEel','Bog Eel']],tree:{item:'mangroveLog',name:'Bog Mangrove',material:'Mangrove Log'},plant:{item:'bogbloom',name:'Bogbloom'}},
 tundra:{name:'Frostfall Tundra',level:31,fish:[['iceMinnow','Ice Minnow'],['frostTrout','Frost Trout'],['glacierSalmon','Glacier Salmon']],tree:{item:'frostpineLog',name:'Frostpine',material:'Frostpine Log'},plant:{item:'frostmint',name:'Frostmint'}},
 celestial:{name:'Celestial Realm',level:41,fish:[['starfinDace','Starfin Dace'],['sunscaleKoi','Sunscale Koi'],['moonray','Moonray']],tree:{item:'starwoodLog',name:'Starwood Tree',material:'Starwood Log'},plant:{item:'sunblossom',name:'Sunblossom'}},
 peaks:{name:'Ember Peaks',level:51,fish:[['ashfinCarp','Ashfin Carp'],['emberPerch','Ember Perch'],['flamefinSnapper','Flamefin Snapper']],tree:{item:'emberwoodLog',name:'Emberwood Tree',material:'Emberwood Log'},plant:{item:'ashroot',name:'Ashroot'}},
 fortress:{name:'Shadow Fortress',level:61,fish:[['gloomMinnow','Gloom Minnow'],['shadowBass','Shadow Bass'],['voidAngler','Void Angler']],tree:{item:'nightwoodLog',name:'Nightwood Tree',material:'Nightwood Log'},plant:{item:'nightshade',name:'Nightshade'}},
} as const;
export type ResourceIsland=keyof typeof islandResourceSets;
export type FishId=typeof islandResourceSets[ResourceIsland]['fish'][number][0];
export type TreeMaterialId=typeof islandResourceSets[ResourceIsland]['tree']['item'];
export type PlantMaterialId=typeof islandResourceSets[ResourceIsland]['plant']['item'];
export type VarietyMaterialId=FishId|TreeMaterialId|PlantMaterialId;
export const resourceVarietyMaterials=Object.fromEntries(Object.values(islandResourceSets).flatMap(s=>[
 ...s.fish.map(([id,name],i)=>[id,{name,stack:20,sell:2+Math.floor(s.level/10)*2+i*2}]),
 [s.tree.item,{name:s.tree.material,stack:50,sell:2+Math.floor(s.level/10)*2}],
 [s.plant.item,{name:s.plant.name,stack:50,sell:2+Math.floor(s.level/10)*2}],
])) as Record<VarietyMaterialId,{name:string;stack:number;sell:number}>;
export const fishForIsland=(region:string)=>{
 const island=region==='woods-depths'?'woods':region==='caverns-depths'?'caverns':region;
 const set=islandResourceSets[island as ResourceIsland];return set?set.fish.map(([item,name],i)=>({item,name,level:set.level+i*3,xp:25+Math.floor(set.level/10)*5+i*5})):[];
};
