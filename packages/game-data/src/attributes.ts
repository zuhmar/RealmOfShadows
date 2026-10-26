import {skillLevel} from './classes';
export const attributeRules={base:10,cap:100,pointsPerLevel:3};
export const attributeDefinitions={strength:{name:'Strength',description:'+0.75 melee damage per point'},dexterity:{name:'Dexterity',description:'+0.75 distance damage per point'},intelligence:{name:'Intelligence',description:'+0.75 magic damage and +3 maximum mana per point'},vitality:{name:'Vitality',description:'+5 maximum health per point'}} as const;
export type AttributeId=keyof typeof attributeDefinitions;
export type Attributes=Record<AttributeId,number>;
export const newAttributes=():Attributes=>({strength:10,dexterity:10,intelligence:10,vitality:10});
export function isAttribute(value:unknown):value is AttributeId{return typeof value==='string'&&Object.hasOwn(attributeDefinitions,value);}
export function attributePoints(level:number,attributes:Attributes){return Math.max(0,(level-1)*attributeRules.pointsPerLevel-Object.values(attributes).reduce((sum,value)=>sum+value-attributeRules.base,0));}
export function maxHealth(attributes:Attributes){return 100+(attributes.vitality-attributeRules.base)*5;}
export function maxMana(attributes:Attributes){return 100+(attributes.intelligence-attributeRules.base)*3;}
export function attributeDamage(attributes:Attributes,skill:'melee'|'distance'|'magic'){return (attributes[skill==='melee'?'strength':skill==='distance'?'dexterity':'intelligence']-attributeRules.base)*.75;}
// Every shield cushions physical hits. Training improves the amount prevented;
// one point of incoming damage always gets through, and elemental attacks bypass it.
export function shieldBlock(incoming:number,shieldArmor:number,xp:number){if(shieldArmor<=0)return 0;const level=skillLevel(xp);return Math.max(0,Math.min(incoming-1,1+Math.floor((level-1)/5)+Math.floor(shieldArmor/3)));}
