import {generatedItemUrl} from './generated-art';
// Drop a transparent PNG/WebP named after an item ID into assets/items/.
// PNG wins over WebP, so supplied art replaces the starter icons unchanged.
const files=import.meta.glob('../../../assets/items/**/*.{webp,png}',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const icons=new Map<string,string>();
for(const extension of ['webp','png'])for(const [path,url] of Object.entries(files)){
 if(!path.toLowerCase().endsWith(`.${extension}`))continue;
 const id=path.split('/').at(-1)!.replace(/\.[^.]+$/,'');icons.set(id,url);
}
export function itemSprite(id:string,name:string){const image=document.createElement('img');image.className='item-sprite';image.alt='';image.setAttribute('aria-hidden','true');const url=icons.get(id);if(url)image.src=url;else{image.hidden=true;void generatedItemUrl(id).then(url=>{if(url){image.src=url;image.hidden=false;}});}image.draggable=false;image.title=name;return image;}
