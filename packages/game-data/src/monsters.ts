import {expandWoodsPoint,woodsMap} from './woods';
export const monsterAggressiveLevel=6;
export const monsters={
 wolf:{name:'Forest Wolf',level:2,hp:65,damage:9,speed:2.6,detect:3,range:1,cooldown:1.2,leash:7,respawn:10,xp:35,gold:6,pelts:1,boss:false},
 spider:{name:'Thorn Spider',level:4,hp:85,damage:11,speed:2.9,detect:4,range:1,cooldown:1,leash:6,respawn:15,xp:30,gold:12,pelts:0,boss:false},
 boar:{name:'Wild Boar',level:6,hp:130,damage:16,speed:3.2,detect:4,range:1.1,cooldown:1.6,leash:6,respawn:20,xp:45,gold:18,pelts:0,boss:false},
 bear:{name:'Forest Bear',level:10,hp:520,damage:25,speed:2.1,detect:4.5,range:1.4,cooldown:1.8,leash:5,respawn:90,xp:180,gold:75,pelts:0,boss:true}
} as const;
export type MonsterKind=keyof typeof monsters;
export const monsterKind=(value:unknown):MonsterKind=>typeof value==='string'&&Object.hasOwn(monsters,value)?value as MonsterKind:'wolf';
// Open space between patrol starts keeps encounters separate while the portal
// remains a sanctuary. Keep the named boss as one encounter.
const habitatSpawns=[
 {id:'wolf-1',kind:'wolf',x:16,y:5.8},{id:'wolf-2',kind:'wolf',x:11.8,y:4.4},{id:'wolf-3',kind:'wolf',x:20.5,y:4.4},
 {id:'wolf-4',kind:'wolf',x:11.5,y:8},{id:'wolf-5',kind:'wolf',x:21,y:8.5},{id:'wolf-6',kind:'wolf',x:16,y:9.4},
 {id:'spider-1',kind:'spider',x:6.5,y:10},{id:'spider-2',kind:'spider',x:9.5,y:12},
 {id:'spider-3',kind:'spider',x:3.2,y:7.8},{id:'spider-4',kind:'spider',x:6.5,y:5.8},{id:'spider-5',kind:'spider',x:6.5,y:14.2},
 {id:'boar-1',kind:'boar',x:38,y:19.7},{id:'boar-2',kind:'boar',x:42.2,y:19.7},
 {id:'boar-3',kind:'boar',x:34,y:19.7},{id:'boar-4',kind:'boar',x:38,y:15.5},{id:'boar-5',kind:'boar',x:38.5,y:24.6},
 {id:'bear-1',kind:'bear',x:32.3,y:28.2}
] satisfies {id:string;kind:MonsterKind;x:number;y:number}[];

export const monsterSpawns=habitatSpawns.map(spawn=>{const [x,y]=expandWoodsPoint(spawn.x*48,(spawn.y-woodsMap.offsetY)*48);return {...spawn,x:x/48,y:y/48+woodsMap.offsetY};});
export const monsterAggressive=(kind:MonsterKind)=>monsters[kind].boss||monsters[kind].level>=monsterAggressiveLevel;
