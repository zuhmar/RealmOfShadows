// Load shared prefab textures once; every placed prop retains its own depth.
const files=import.meta.glob('../../../assets/maps/elderwood/svg/*.svg',{eager:true,query:'?url&no-inline',import:'default'}) as Record<string,string>;
export const elderwoodMapAssets=Object.entries(files).filter(([path])=>!path.endsWith('/full-map.svg')).map(([path,url])=>{const name=path.split('/').at(-1)!.replace('.svg','');return {key:`elderwood-${name}`,url,scale:name==='base'?1.5:2};});
