import {monsters,monsterSpawns} from './monsters';
export const combat={playerHp:100,mana:100,bolt:{damage:18,range:6,cooldown:.7,speed:10},nova:{damage:28,range:5,radius:2,cooldown:4,cost:25},wolf:monsters.wolf,playerRespawn:3,portalSafeRadius:3.5};
export const wolfSpawns=monsterSpawns.filter(s=>s.kind==='wolf');
