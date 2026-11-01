import {classes} from '@realm/game-data';
import {entryBrand} from './entry-screen';
export interface CharacterSlot{slot:number;occupied:boolean;name?:string;level?:number;classId?:string;skin?:string}
const previews=import.meta.glob('../../../assets/skins/reference-runtime/previews/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const preview=(skin='citizen')=>previews[`../../../assets/skins/reference-runtime/previews/${skin}.webp`]??previews['../../../assets/skins/reference-runtime/previews/citizen.webp'];
export function serverHttp(){const configured=import.meta.env.VITE_SERVER_URL as string|undefined;return (configured||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:2567`).replace(/^ws:/,'http:').replace(/^wss:/,'https:').replace(/\/$/,'');}
export class CharacterSelect{
 dialog:HTMLDialogElement;creationDialog:HTMLDialogElement;private list:HTMLElement;private feedback:HTMLElement;private generation=0;private busy=false;
 constructor(private pick:(slot:number,name?:string,sex?:'male'|'female')=>Promise<void>,back:()=>void){
  this.dialog=document.createElement('dialog');this.dialog.id='character-select-dialog';this.dialog.className='entry-screen';this.dialog.setAttribute('aria-labelledby','character-select-title');
  this.dialog.innerHTML=`<div class="entry-shell roster-shell"><header class="entry-brand">${entryBrand()}</header><section class="entry-panel"><div class="entry-heading"><div><p class="entry-eyebrow">Your account · Four character slots</p><h2 id="character-select-title">Choose your character</h2></div><button id="characters-back" class="entry-back">Back to login</button></div><p class="entry-description">Continue a journey, or begin a new one.</p><div id="character-slot-list"></div><p id="character-select-feedback" class="entry-feedback" role="status"></p></section></div>`;
  this.creationDialog=document.createElement('dialog');this.creationDialog.id='character-create-dialog';this.creationDialog.className='entry-screen';this.creationDialog.setAttribute('aria-labelledby','character-create-title');
  this.creationDialog.innerHTML=`<div class="entry-shell creation-shell"><header class="entry-brand">${entryBrand()}</header><section class="entry-panel"><div class="entry-heading"><div><p id="creation-slot" class="entry-eyebrow"></p><h2 id="character-create-title">Create your character</h2></div><button id="creation-back" class="entry-back">Back to characters</button></div><div class="creation-layout"><div class="creation-preview"><img id="creation-portrait" width="240" height="240" alt="Adventurer preview"><strong>Adventurer</strong><span>Level 1 · Citizen</span></div><form id="character-create-form"><label for="creation-name">Character name</label><input id="creation-name" type="text" maxlength="24" autocomplete="off" required><label for="creation-sex">Sex</label><select id="creation-sex" required><option value="">Choose male or female</option><option value="male">Male</option><option value="female">Female</option></select><p class="entry-description">Begin as an Adventurer. Choose Knight, Archer, Mage or Rogue at level 5.</p><button type="submit" class="entry-primary">Create character</button><p id="character-create-feedback" class="entry-feedback" role="status"></p></form></div></section></div>`;
  document.body.append(this.dialog,this.creationDialog);this.list=this.dialog.querySelector('#character-slot-list')!;this.feedback=this.dialog.querySelector('#character-select-feedback')!;
  this.dialog.querySelector('#characters-back')!.addEventListener('click',()=>{if(!this.busy)back()});
  this.creationDialog.querySelector('#creation-back')!.addEventListener('click',()=>{if(this.busy)return;this.creationDialog.close();this.dialog.showModal();this.list.querySelector<HTMLButtonElement>(`[data-slot="${this.creationDialog.dataset.slot}"] button`)?.focus()});
  for(const dialog of [this.dialog,this.creationDialog])dialog.addEventListener('cancel',e=>e.preventDefault());
  this.creationDialog.querySelector('#creation-sex')!.addEventListener('change',()=>{const sex=this.creationDialog.querySelector<HTMLSelectElement>('#creation-sex')!.value;this.creationDialog.querySelector<HTMLImageElement>('#creation-portrait')!.src=preview(sex==='female'?'citizen-female':'citizen')});
  this.creationDialog.querySelector('#character-create-form')!.addEventListener('submit',e=>{
   e.preventDefault();if(this.busy)return;const input=this.creationDialog.querySelector<HTMLInputElement>('#creation-name')!,sex=this.creationDialog.querySelector<HTMLSelectElement>('#creation-sex')!,name=input.value.trim(),feedback=this.creationDialog.querySelector('#character-create-feedback')!;
   if(!name||name.length>24||/[\x00-\x1f<>]/.test(name)){feedback.textContent='Choose a name of 1–24 characters.';input.focus();return;}
   if(sex.value!=='male'&&sex.value!=='female'){feedback.textContent='Choose male or female.';sex.focus();return;}
   void this.choose(Number(this.creationDialog.dataset.slot),name,sex.value);
  });
 }
 async open(token:string){
  this.close();const generation=++this.generation;this.list.replaceChildren();this.feedback.textContent='Loading characters…';this.dialog.showModal();
  const response=await fetch(`${serverHttp()}/characters`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)}),data=await response.json();
  if(generation!==this.generation||!this.dialog.open)return;
  if(!response.ok||!Array.isArray(data.slots)||data.slots.length!==4)throw Error(data.error||'Unable to load characters.');
  this.feedback.textContent='';
  for(const slot of data.slots as CharacterSlot[]){
   const card=document.createElement('article');card.className=`character-slot ${slot.occupied?'occupied-slot':'empty-slot'}`;card.dataset.slot=String(slot.slot);
   const number=document.createElement('span');number.className='slot-number';number.textContent=`Slot ${slot.slot}`;
   const title=document.createElement('h3');title.textContent=slot.occupied?slot.name??'Adventurer':'Empty slot';card.append(number);
   if(slot.occupied){const portrait=document.createElement('img');portrait.className='slot-portrait';portrait.src=preview(slot.skin);portrait.alt='';portrait.width=160;portrait.height=160;const p=document.createElement('p');p.textContent=`Level ${slot.level} · ${classes[slot.classId as keyof typeof classes]?.name??'Citizen'}`;const play=document.createElement('button');play.textContent='Play character';play.className='entry-primary';play.onclick=()=>void this.choose(slot.slot);card.append(portrait,title,p,play)}
   else{const icon=document.createElement('span');icon.className='empty-slot-icon';icon.textContent='+';icon.setAttribute('aria-hidden','true');const p=document.createElement('p');p.textContent='A new adventure starts here.';const create=document.createElement('button');create.textContent='Create character';create.onclick=()=>this.create(slot.slot);card.append(icon,title,p,create)}
   this.list.append(card);
  }
 }
 private create(slot:number){
  if(this.busy)return;this.dialog.close();this.creationDialog.dataset.slot=String(slot);this.creationDialog.querySelector('#creation-slot')!.textContent=`New character · Slot ${slot}`;
  const form=this.creationDialog.querySelector<HTMLFormElement>('form')!;form.reset();form.querySelector<HTMLInputElement>('#creation-name')!.value=`Adventurer ${slot}`;form.querySelector<HTMLInputElement>('#creation-name')!.setAttribute('aria-label',`Name for slot ${slot}`);form.querySelector<HTMLSelectElement>('#creation-sex')!.setAttribute('aria-label',`Sex for slot ${slot}`);
  this.creationDialog.querySelector<HTMLImageElement>('#creation-portrait')!.src=preview();this.creationDialog.querySelector('#character-create-feedback')!.textContent='';this.creationDialog.showModal();
 }
 private async choose(slot:number,name?:string,sex?:'male'|'female'){
  if(this.busy)return;this.busy=true;const active=this.creationDialog.open?this.creationDialog:this.dialog,feedback=active===this.dialog?this.feedback:this.creationDialog.querySelector('#character-create-feedback')!;
  for(const dialog of [this.dialog,this.creationDialog])dialog.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(b=>b.disabled=true);
  active.setAttribute('aria-busy','true');feedback.textContent='Entering the realm…';
  try{await this.pick(slot,name,sex)}catch(e){feedback.textContent=e instanceof Error?e.message:'Unable to enter this character.';this.busy=false;active.removeAttribute('aria-busy');for(const dialog of [this.dialog,this.creationDialog])dialog.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(b=>b.disabled=false)}
 }
 close(){++this.generation;this.busy=false;for(const dialog of [this.dialog,this.creationDialog]){dialog.close();dialog.removeAttribute('aria-busy');dialog.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(b=>b.disabled=false)}}
}
