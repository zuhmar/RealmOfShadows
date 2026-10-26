export const items={pelt:{name:'Wolf Pelt',stack:20,sell:4},potion:{name:'Healing Potion',stack:10,buy:12,heal:40,cooldown:3},crystalShard:{name:'Crystal Shard',stack:20,sell:8}} as const;
export type ItemId=keyof typeof items;
export const rewards={wolfXp:35,wolfGold:6,wolfPelts:1,capacity:32,dropLifetime:90,pickupRange:1.8,levelCap:100,levelFactor:100};
export const merchant={name:'Mara the Trader',x:14.5,y:8.5,range:2};
export function totalXp(level:number){return rewards.levelFactor*(level-1)**2;}
export function levelForXp(xp:number){return Math.min(rewards.levelCap,Math.floor(Math.sqrt(Math.max(0,xp)/rewards.levelFactor))+1);}
