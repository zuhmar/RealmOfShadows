export const skillRules={cap:100,factor:100,hitXp:5,novaHitXp:3};
export type SkillId='melee'|'distance'|'magic'|'shielding';
export function skillLevel(xp:number){return Math.min(skillRules.cap,Math.floor(Math.sqrt(Math.max(0,xp)/skillRules.factor))+1);}
export function skillRequirement(level:number){return skillRules.factor*(level-1)**2;}
export const weapons={
 sword:{name:'Beginner Sword',skill:'melee',attack:20,range:1.4,cooldown:0.8,speed:0,kind:'melee',tier:'beginner',level:1,price:0},
 bow:{name:'Beginner Bow',skill:'distance',attack:20,range:6,cooldown:0.8,speed:12,kind:'arrow',tier:'beginner',level:1,price:0},
 wand:{name:'Beginner Staff',skill:'magic',attack:20,range:6,cooldown:0.7,speed:10,kind:'bolt',tier:'beginner',level:1,price:0},
 dagger:{name:'Beginner Daggers',skill:'melee',attack:15,range:1.25,cooldown:0.45,speed:0,kind:'melee',tier:'beginner',level:1,price:0},
 knightSword:{name:'Copper Sword',skill:'melee',attack:26,range:1.4,cooldown:0.8,speed:0,kind:'melee',tier:'copper',level:5,price:120},
 archerBow:{name:'Copper Bow',skill:'distance',attack:26,range:7,cooldown:0.8,speed:13,kind:'arrow',tier:'copper',level:5,price:120},
 mageStaff:{name:'Copper Staff',skill:'magic',attack:28,range:6,cooldown:0.8,speed:10,kind:'bolt',tier:'copper',level:5,price:120},
 rogueDaggers:{name:'Copper Daggers',skill:'melee',attack:21,range:1.25,cooldown:0.45,speed:0,kind:'melee',tier:'copper',level:5,price:120},
 ironSword:{name:'Iron Sword',skill:'melee',attack:36,range:1.4,cooldown:0.8,speed:0,kind:'melee',tier:'iron',level:11,price:360},
 ironBow:{name:'Iron Bow',skill:'distance',attack:36,range:7,cooldown:0.8,speed:13,kind:'arrow',tier:'iron',level:11,price:360},
 ironStaff:{name:'Iron Staff',skill:'magic',attack:36,range:6,cooldown:0.8,speed:10,kind:'bolt',tier:'iron',level:11,price:360},
 ironDaggers:{name:'Iron Daggers',skill:'melee',attack:29,range:1.25,cooldown:0.45,speed:0,kind:'melee',tier:'iron',level:11,price:360},
 goldSword:{name:'Gold Sword',skill:'melee',attack:48,range:1.4,cooldown:0.8,speed:0,kind:'melee',tier:'gold',level:21,price:900},
 goldBow:{name:'Gold Bow',skill:'distance',attack:48,range:7,cooldown:0.8,speed:13,kind:'arrow',tier:'gold',level:21,price:900},
 goldStaff:{name:'Gold Staff',skill:'magic',attack:48,range:6,cooldown:0.8,speed:10,kind:'bolt',tier:'gold',level:21,price:900},
 goldDaggers:{name:'Gold Daggers',skill:'melee',attack:38,range:1.25,cooldown:0.45,speed:0,kind:'melee',tier:'gold',level:21,price:900},
 mythrilSword:{name:'Mythril Sword',skill:'melee',attack:62,range:1.4,cooldown:0.8,speed:0,kind:'melee',tier:'mythril',level:31,price:2000},
 mythrilBow:{name:'Mythril Bow',skill:'distance',attack:62,range:7,cooldown:0.8,speed:13,kind:'arrow',tier:'mythril',level:31,price:2000},
 mythrilStaff:{name:'Mythril Staff',skill:'magic',attack:62,range:6,cooldown:0.8,speed:10,kind:'bolt',tier:'mythril',level:31,price:2000},
 mythrilDaggers:{name:'Mythril Daggers',skill:'melee',attack:50,range:1.25,cooldown:0.45,speed:0,kind:'melee',tier:'mythril',level:31,price:2000},
 dragonSword:{name:'Dragon Sword',skill:'melee',attack:82,range:1.4,cooldown:0.8,speed:0,kind:'melee',tier:'dragon',level:51,price:4800},
 dragonBow:{name:'Dragon Bow',skill:'distance',attack:82,range:7,cooldown:0.8,speed:13,kind:'arrow',tier:'dragon',level:51,price:4800},
 dragonStaff:{name:'Dragon Staff',skill:'magic',attack:82,range:6,cooldown:0.8,speed:10,kind:'bolt',tier:'dragon',level:51,price:4800},
 dragonDaggers:{name:'Dragon Daggers',skill:'melee',attack:66,range:1.25,cooldown:0.45,speed:0,kind:'melee',tier:'dragon',level:51,price:4800},
 shadowSword:{name:'Shadow Sword',skill:'melee',attack:105,range:1.4,cooldown:0.8,speed:0,kind:'melee',tier:'shadow',level:61,price:10000},
 shadowBow:{name:'Shadow Bow',skill:'distance',attack:105,range:7,cooldown:0.8,speed:13,kind:'arrow',tier:'shadow',level:61,price:10000},
 shadowStaff:{name:'Shadow Staff',skill:'magic',attack:105,range:6,cooldown:0.8,speed:10,kind:'bolt',tier:'shadow',level:61,price:10000},
 shadowDaggers:{name:'Shadow Daggers',skill:'melee',attack:84,range:1.25,cooldown:0.45,speed:0,kind:'melee',tier:'shadow',level:61,price:10000},
} as const;
export type WeaponId=keyof typeof weapons;
export const classes={knight:{name:'Knight',description:'A close-range fighter, starting with a copper sword.',weapon:'knightSword'},archer:{name:'Archer',description:'A ranged hunter, starting with a copper bow.',weapon:'archerBow'},mage:{name:'Mage',description:'A spellcaster, starting with a copper staff.',weapon:'mageStaff'},rogue:{name:'Rogue',description:'A quick melee fighter, starting with copper daggers.',weapon:'rogueDaggers'}} as const;
export type ClassId='citizen'|keyof typeof classes;
export const classRules={unlockLevel:5,starterWeapons:['wand','sword','bow','dagger'] as WeaponId[],wolfDefense:4};
export function isWeapon(value:unknown):value is WeaponId{return typeof value==='string'&&Object.hasOwn(weapons,value);}
export function isClassChoice(value:unknown):value is keyof typeof classes{return typeof value==='string'&&Object.hasOwn(classes,value);}
export function weaponDamage(weapon:WeaponId,xp:number,multiplier=1,attributeBonus=0){return Math.max(1,Math.floor((weapons[weapon].attack+.6*skillLevel(xp)+attributeBonus)*multiplier-.5*classRules.wolfDefense));}
