import type {EquipmentTier} from './equipment-tiers';
export interface QuestObjective{event:'kill'|'identify'|'loot';target:string;count:number;label:string}
export interface QuestDefinition{id:string;island:string;name:string;type:'main'|'side';level:number;requires?:string;description:string;objectives:QuestObjective[];gold:number;xp:number;playable:boolean}
export interface QuestProgress{progress:number[];claimed:boolean}
export type QuestJournal=Record<string,QuestProgress>;
const islands:[string,string,number,string,string,string,EquipmentTier][]=[
 ['woods','Whispering Woods',1,'wolf','spider','bear','beginner'],
 ['caverns','Crystal Caverns',11,'bat','golem','wyrm','copper'],
 ['swamp','Murkmire Swamp',21,'slime','lurker','hydra','iron'],
 ['tundra','Frostfall Tundra',31,'frost-wolf','ice-troll','frost-giant','gold'],
 ['celestial','Celestial Realm',41,'fallen-sprite','sentinel','seraph','mythril'],
 ['peaks','Ember Peaks',51,'imp','magma-golem','drake','dragon'],
 ['fortress','Shadow Fortress',61,'shadow-knight','lich','shadow-dragon','shadow'],
];
const names:Record<string,string>={wolf:'Forest Wolf',spider:'Thorn Spider',bear:'Forest Bear',bat:'Cave Bat',golem:'Crystal Golem',wyrm:'Crystal Wyrm',slime:'Bog Slime',lurker:'Swamp Lurker',hydra:'Hydra','frost-wolf':'Frost Wolf','ice-troll':'Ice Troll','frost-giant':'Frost Giant','fallen-sprite':'Fallen Sprite',sentinel:'Celestial Sentinel',seraph:'Fallen Seraph',imp:'Fire Imp','magma-golem':'Magma Golem',drake:'Infernal Drake','shadow-knight':'Shadow Knight',lich:'Shadow Lich','shadow-dragon':'Shadow Dragon',boar:'Wild Boar',crawler:'Shard Crawler'};
export const quests:QuestDefinition[]=islands.flatMap(([island,name,level,first,second,boss,tier],index)=>{
 const reward=(n:number)=>Math.round(n*(index+1)),kill=(target:string,count:number):QuestObjective=>({event:'kill',target,count,label:`Defeat ${count} ${count===1?names[target]:names[target].endsWith('Wolf')?names[target].replace(/Wolf$/,'Wolves'):names[target]+'s'}`}),base={island,level,playable:index<2};
 return [
 {...base,id:`${island}-main-1`,type:'main' as const,name:`Secure ${name}`,description:`Mara needs a safe route through ${name}. Clear its outer threats.`,objectives:[kill(first,6),kill(second,4)],gold:reward(35),xp:reward(100)},
 {...base,id:`${island}-main-2`,type:'main' as const,name:`Face the ${names[boss]}`,requires:`${island}-main-1`,description:`Defeat the island guardian and report back to Mara.`,objectives:[kill(boss,1)],gold:reward(60),xp:reward(150)},
 {...base,id:`${island}-side-1`,type:'side' as const,name:`Thin the Ranks`,description:`Help travelers by clearing more threats near the trails.`,objectives:[kill(island==='woods'?'boar':island==='caverns'?'crawler':first,5)],gold:reward(25),xp:reward(75)},
 {...base,id:`${island}-side-2`,type:'side' as const,name:`Hidden Potential`,description:`Identify equipment from ${name}. Identification is free; keep the items.`,objectives:[{event:'identify' as const,target:tier,count:2,label:`Identify 2 ${tier} items`}],gold:reward(20),xp:reward(60)},
 {...base,id:`${island}-side-3`,type:'side' as const,name:`Recover the Spoils`,description:`Collect spoils left behind by the island's monsters. Keep everything you collect.`,objectives:[{event:'loot' as const,target:island,count:6,label:'Collect 6 monster loot bundles'}],gold:reward(20),xp:reward(60)},
 ];
});
export const questById=(id:unknown)=>typeof id==='string'?quests.find(q=>q.id===id):undefined;
export const questComplete=(q:QuestDefinition,p:QuestProgress)=>q.objectives.every((o,i)=>p.progress[i]>=o.count);
export function recordQuestEvent(journal:QuestJournal,event:QuestObjective['event'],target:string,island:string){
 for(const q of quests){const p=journal[q.id];if(!p||p.claimed||q.island!==island)continue;for(let i=0;i<q.objectives.length;i++){const o=q.objectives[i];if(o.event===event&&o.target===target)p.progress[i]=Math.min(o.count,p.progress[i]+1);}}
}
export function validQuestJournal(value:unknown,level=100):value is QuestJournal{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>quests.length)return false;
 const journal=value as QuestJournal;
 return Object.entries(journal).every(([id,p])=>{const q=questById(id);return !!q&&q.playable&&q.level<=level&&!!p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).sort().join(',')==='claimed,progress'&&typeof p.claimed==='boolean'&&Array.isArray(p.progress)&&p.progress.length===q.objectives.length&&p.progress.every((n,i)=>Number.isSafeInteger(n)&&n>=0&&n<=q.objectives[i].count)&&(!p.claimed||questComplete(q,p))&&(!q.requires||journal[q.requires]?.claimed===true);});
}
