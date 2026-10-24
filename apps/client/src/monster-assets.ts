const files=import.meta.glob('../../../assets/monsters/svg/*.svg',{eager:true,query:'?url&no-inline',import:'default'}) as Record<string,string>;
export const monsterAssets=Object.entries(files).map(([p,url])=>({key:p.split('/').at(-1)!.replace('.svg',''),url}));
