import {woodsEncounterSpawns,woodsMap} from './woods';
export const monsterAggressiveLevel=6;
export const monsters={
 wolf:{name:'Forest Wolf',level:2,hp:65,damage:9,speed:2.6,detect:3,range:1,cooldown:1.2,leash:7,respawn:10,xp:35,gold:6,pelts:1,boss:false},
 spider:{name:'Thorn Spider',level:4,hp:85,damage:11,speed:2.9,detect:4,range:1,cooldown:1,leash:6,respawn:15,xp:30,gold:12,pelts:0,boss:false},
 boar:{name:'Wild Boar',level:6,hp:130,damage:16,speed:3.2,detect:4,range:1.1,cooldown:1.6,leash:6,respawn:20,xp:45,gold:18,pelts:0,boss:false},
 bear:{name:'Forest Bear',level:10,hp:520,damage:25,speed:2.1,detect:4.5,range:1.4,cooldown:1.8,leash:5,respawn:90,xp:180,gold:75,pelts:0,boss:true}
} as const;
export type MonsterKind=keyof typeof monsters;
export const monsterKind=(value:unknown):MonsterKind=>typeof value==='string'&&Object.hasOwn(monsters,value)?value as MonsterKind:'wolf';
export const monsterSpawns=woodsEncounterSpawns.map(spawn=>({...spawn,x:spawn.x/48,y:spawn.y/48+woodsMap.offsetY}));
export const monsterAggressive=(kind:MonsterKind)=>monsters[kind].boss||monsters[kind].level>=monsterAggressiveLevel;
