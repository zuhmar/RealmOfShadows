import {skinDefinitions,wingDefinitions,auraDefinitions,type Cosmetics} from '@realm/game-data';
import type {EconomySnapshot} from '@realm/shared';
const thumbnails=import.meta.glob('../../../assets/skins/runtime/skin-*-down-0.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
let previous='';
export function setupWardrobe(change:(cosmetics:Cosmetics)=>void){
 previous='';let selectionTimer:ReturnType<typeof setTimeout>|undefined;
 // Coalesce quick browsing so the final selection stays within the server request budget.
 const choose=()=>{const next:Cosmetics={skin:document.querySelector<HTMLSelectElement>('#cosmetic-skin')!.value as Cosmetics['skin'],wings:document.querySelector<HTMLSelectElement>('#cosmetic-wings')!.value as Cosmetics['wings'],aura:document.querySelector<HTMLSelectElement>('#cosmetic-aura')!.value as Cosmetics['aura']};clearTimeout(selectionTimer);selectionTimer=setTimeout(()=>change(next),150);};
 for(const [id,defs]of [['skin',skinDefinitions],['wings',wingDefinitions],['aura',auraDefinitions]] as const){const select=document.querySelector<HTMLSelectElement>(`#cosmetic-${id}`)!;select.replaceChildren();if(id==='skin')select.add(new Option('Automatic · Class outfit','auto'));for(const [value,def]of Object.entries(defs))select.add(new Option(def.name,value));select.addEventListener('change',choose);}
 const gallery=document.querySelector('#outfit-grid')!;gallery.replaceChildren();
 for(const [id,def]of Object.entries(skinDefinitions)){
  const card=document.createElement('button');card.type='button';card.className='outfit-card';card.dataset.outfit=id;card.setAttribute('aria-pressed','false');card.title=def.description;
  const image=document.createElement('img');image.src=thumbnails[`../../../assets/skins/runtime/skin-${id}-down-0.webp`];image.alt='';image.width=160;image.height=160;
  const name=document.createElement('strong');name.textContent=def.name;card.append(image,name);card.addEventListener('click',()=>{document.querySelector<HTMLSelectElement>('#cosmetic-skin')!.value=id;choose();});gallery.append(card);
 }
}
export function renderWardrobe(bag:EconomySnapshot){
 const key=JSON.stringify([bag.classId,bag.cosmetics]);if(previous===key)return;previous=key;
 for(const field of ['skin','wings','aura'] as const)document.querySelector<HTMLSelectElement>(`#cosmetic-${field}`)!.value=bag.cosmetics[field];
 for(const card of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-outfit]')))card.setAttribute('aria-pressed',String(card.dataset.outfit===bag.cosmetics.skin));
 document.querySelector('#wardrobe-status')!.textContent=bag.cosmetics.skin==='auto'?'Automatic follows your class. Choose any outfit for a look of your own.':`${skinDefinitions[bag.cosmetics.skin].description} Available to every class.`;
}
