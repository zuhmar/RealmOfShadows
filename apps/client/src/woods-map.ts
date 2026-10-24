const files=import.meta.glob('../../../assets/maps/whispering-woods/svg/*.svg',{eager:true,query:'?url&no-inline',import:'default'}) as Record<string,string>;
export const woodsMapAssets=Object.entries(files).filter(([p])=>!p.endsWith('/full-map.svg')).map(([p,url])=>({key:`woods-${p.split('/').at(-1)!.replace('.svg','')}`,url,scale:p.endsWith('/base.svg')?1.5:2}));
