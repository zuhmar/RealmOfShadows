export const skillRules={cap:100,factor:100,hitXp:5,novaHitXp:3};
export type SkillId='melee'|'distance'|'magic';
export function skillLevel(xp:number){return Math.min(skillRules.cap,Math.floor(Math.sqrt(Math.max(0,xp)/skillRules.factor))+1);}
export function skillRequirement(level:number){return skillRules.factor*(level-1)**2;}
export const weapons={
 wand:{name:'Training Wand',skill:'magic',attack:20,range:6,cooldown:.7,speed:10,kind:'bolt'},
 sword:{name:'Training Sword',skill:'melee',attack:20,range:1.4,cooldown:.8,speed:0,kind:'melee'},
 bow:{name:'Training Bow',skill:'distance',attack:20,range:6,cooldown:.8,speed:12,kind:'arrow'},
 dagger:{name:'Training Dagger',skill:'melee',attack:15,range:1.25,cooldown:.45,speed:0,kind:'melee'},
 knightSword:{name:'Knight’s Sword',skill:'melee',attack:26,range:1.4,cooldown:.8,speed:0,kind:'melee'},
 archerBow:{name:'Archer’s Bow',skill:'distance',attack:26,range:7,cooldown:.8,speed:13,kind:'arrow'},
 mageStaff:{name:'Mage’s Staff',skill:'magic',attack:28,range:6,cooldown:.8,speed:10,kind:'bolt'},
 rogueDaggers:{name:'Rogue’s Daggers',skill:'melee',attack:21,range:1.25,cooldown:.45,speed:0,kind:'melee'},
} as const;
export type WeaponId=keyof typeof weapons;
export const classes={knight:{name:'Knight',description:'A close-range fighter, starting with a knight’s sword.',weapon:'knightSword'},archer:{name:'Archer',description:'A ranged hunter, starting with an archer’s bow.',weapon:'archerBow'},mage:{name:'Mage',description:'A spellcaster, starting with a mage’s staff.',weapon:'mageStaff'},rogue:{name:'Rogue',description:'A quick melee fighter, starting with paired daggers.',weapon:'rogueDaggers'}} as const;
export type ClassId='citizen'|keyof typeof classes;
export const classRules={unlockLevel:5,starterWeapons:['wand','sword','bow','dagger'] as WeaponId[],wolfDefense:4};
export function isWeapon(value:unknown):value is WeaponId{return typeof value==='string'&&Object.hasOwn(weapons,value);}
export function isClassChoice(value:unknown):value is keyof typeof classes{return typeof value==='string'&&Object.hasOwn(classes,value);}
export function weaponDamage(weapon:WeaponId,xp:number,multiplier=1){return Math.max(1,Math.floor((weapons[weapon].attack+.6*skillLevel(xp))*multiplier-.5*classRules.wolfDefense));}
