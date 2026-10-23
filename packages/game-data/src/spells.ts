import type {ClassId} from './classes';
export const spells={
 spark:{name:'Spark',classId:'shared',level:1,price:15,cost:10,cooldown:3,range:5,radius:0,power:14,skill:'magic',effect:'bolt'},
 mend:{name:'Mend',classId:'shared',level:1,price:20,cost:20,cooldown:8,range:0,radius:0,power:30,skill:'magic',effect:'heal'},
 cleave:{name:'Cleave',classId:'knight',level:5,price:35,cost:15,cooldown:5,range:1.5,radius:1.5,power:28,skill:'melee',effect:'nova'},
 powerShot:{name:'Power Shot',classId:'archer',level:5,price:35,cost:20,cooldown:5,range:7,radius:0,power:34,skill:'distance',effect:'arrow'},
 moonNova:{name:'Moon Nova',classId:'mage',level:5,price:35,cost:25,cooldown:4,range:5,radius:2,power:30,skill:'magic',effect:'nova'},
 shadowStrike:{name:'Shadow Strike',classId:'rogue',level:5,price:35,cost:15,cooldown:4,range:1.5,radius:0,power:32,skill:'melee',effect:'melee'}
} as const;
export type SpellId=keyof typeof spells;
export interface SpellAccess {classId:ClassId;level:number;learnedSpells:SpellId[]}
export function isSpell(id:unknown):id is SpellId{return typeof id==='string'&&Object.hasOwn(spells,id);}
export function canLearnSpell(id:SpellId,p:Pick<SpellAccess,'classId'|'level'>){const s=spells[id];return p.level>=s.level&&(s.classId==='shared'||s.classId===p.classId);}
