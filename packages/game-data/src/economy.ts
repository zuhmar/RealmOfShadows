export const items={pelt:{name:'Wolf Pelt',stack:20,sell:4},potion:{name:'Healing Potion',stack:10,buy:12,heal:40,cooldown:3}} as const;
export type ItemId=keyof typeof items;
export const rewards={wolfXp:35,wolfGold:6,wolfPelts:1,capacity:12,dropLifetime:90,pickupRange:1.8,levelCap:100,levelFactor:100};
export const merchant={name:'Mara the Trader',x:20.5,y:13.5,range:2};
export function totalXp(level:number){return rewards.levelFactor*(level-1)**2;}
export function levelForXp(xp:number){return Math.min(rewards.levelCap,Math.floor(Math.sqrt(Math.max(0,xp)/rewards.levelFactor))+1);}
