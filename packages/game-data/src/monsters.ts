import {rootsSpawns} from './woods-depths';
import {depthsSpawns} from './caverns-depths';
import {woodsEncounterSpawns,woodsMap} from './woods';
import {cavernsSpawns} from './caverns';
export const monsterAggressiveLevel=6;
export const monsters={
 wolf:{name:'Forest Wolf',level:2,hp:65,damage:9,speed:2.6,detect:3,range:1,cooldown:1.2,leash:7,respawn:10,xp:35,gold:6,pelts:1,boss:false},
 spider:{name:'Thorn Spider',level:4,hp:85,damage:11,speed:2.9,detect:4,range:1,cooldown:1,leash:6,respawn:15,xp:30,gold:12,pelts:0,boss:false},
 boar:{name:'Wild Boar',level:6,hp:130,damage:16,speed:3.2,detect:4,range:1.1,cooldown:1.6,leash:6,respawn:20,xp:45,gold:18,pelts:0,boss:false},
 bear:{name:'Forest Bear',level:10,hp:520,damage:25,speed:2.1,detect:4.5,range:1.4,cooldown:1.8,leash:5,respawn:90,xp:180,gold:75,pelts:0,boss:true},
 bat:{name:'Cave Bat',level:12,hp:150,damage:13,speed:3.1,detect:3.5,range:1,cooldown:1.1,leash:6,respawn:15,xp:80,gold:15,pelts:0,shards:1,boss:false},
 crawler:{name:'Shard Crawler',level:14,hp:210,damage:18,speed:2.7,detect:4,range:1.1,cooldown:1.9,leash:6,respawn:20,xp:110,gold:22,pelts:0,shards:1,boss:false},
 golem:{name:'Crystal Golem',level:16,hp:340,damage:24,speed:1.8,detect:4,range:1.5,cooldown:2.5,leash:6,respawn:25,xp:155,gold:35,pelts:0,shards:2,boss:false},
 wyrm:{name:'Crystal Wyrm',level:20,hp:1100,damage:32,speed:2,detect:6,range:4.5,cooldown:2.8,leash:7,respawn:120,xp:650,gold:160,pelts:0,shards:8,boss:true}
} as const;
export type MonsterKind=keyof typeof monsters;
export const monsterKind=(value:unknown):MonsterKind=>typeof value==='string'&&Object.hasOwn(monsters,value)?value as MonsterKind:'wolf';
export const monsterSpawns=woodsEncounterSpawns.map(spawn=>({...spawn,x:spawn.x/48,y:spawn.y/48+woodsMap.offsetY}));
export const allMonsterSpawns=[...monsterSpawns.map(s=>({...s,region:'woods' as const})),...cavernsSpawns,...depthsSpawns,...rootsSpawns];
export const combatRegion=(region:string)=>region==='woods-depths'||region==='woods'||region==='caverns'||region==='caverns-depths';
export const monsterRegion=(monster:{region?:string})=>monster.region==='woods-depths'?'woods-depths' as const:monster.region==='caverns-depths'?'caverns-depths' as const:monster.region==='caverns'?'caverns' as const:'woods' as const;
export const monsterAggressive=(kind:MonsterKind)=>monsters[kind].boss||monsters[kind].level>=monsterAggressiveLevel;
