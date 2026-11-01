import {classes} from '@realm/game-data';
import {entryBrand} from './entry-screen';
export interface CharacterSlot{slot:number;occupied:boolean;name?:string;level?:number;classId?:string;skin?:string}
const previews=import.meta.glob('../../../assets/skins/reference-runtime/previews/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const preview=(skin='citizen')=>previews[`../../../assets/skins/reference-runtime/previews/${skin}.webp`]??previews['../../../assets/skins/reference-runtime/previews/citizen.webp'];
export function serverHttp(){const configured=import.meta.env.VITE_SERVER_URL as string|undefined;return (configured||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:2567`).replace(/^ws:/,'http:').replace(/^wss:/,'https:').replace(/\/$/,'');}
export class CharacterSelect{
 dialog:HTMLDialogElement;creationDialog:HTMLDialogElement;private list:HTMLElement;private feedback:HTMLElement;private generation=0;private busy=false;private slots:CharacterSlot[]=[];private selected=0;private scrollTimer?:ReturnType<typeof setTimeout>;private scrollTarget?:number;
 constructor(private pick:(slot:number,name?:string,sex?:'male'|'female')=>Promise<void>,back:()=>void){
  this.dialog=document.createElement('dialog');this.dialog.id='character-select-dialog';this.dialog.className='entry-screen';this.dialog.setAttribute('aria-labelledby','character-select-title');
  this.dialog.innerHTML=`<div class="entry-shell roster-shell"><header class="entry-brand">${entryBrand()}</header><section class="entry-panel"><div class="entry-heading"><div><p class="entry-eyebrow">Your account · Four character slots</p><h2 id="character-select-title">Choose your character</h2></div><button id="characters-back" class="entry-back">Back to login</button></div><div class="character-carousel" role="region" aria-roledescription="carousel" aria-label="Your characters"><button id="character-previous" class="carousel-arrow" aria-label="Previous character">‹</button><div id="character-slot-list" role="list" tabindex="0" aria-label="Character slots"></div><button id="character-next" class="carousel-arrow" aria-label="Next character">›</button></div><div class="carousel-details" aria-live="polite"><h3 id="selected-character-name"></h3><p id="selected-character-details"></p></div><div id="character-carousel-dots" aria-label="Choose a slot"></div><p class="carousel-hint">Swipe or use the arrows · Tap a character to play</p><p id="character-select-feedback" class="entry-feedback" role="status"></p></section></div>`;
  this.creationDialog=document.createElement('dialog');this.creationDialog.id='character-create-dialog';this.creationDialog.className='entry-screen';this.creationDialog.setAttribute('aria-labelledby','character-create-title');
  this.creationDialog.innerHTML=`<div class="entry-shell creation-shell"><header class="entry-brand">${entryBrand()}</header><section class="entry-panel"><div class="entry-heading"><div><p id="creation-slot" class="entry-eyebrow"></p><h2 id="character-create-title">Create your character</h2></div><button id="creation-back" class="entry-back">Back to characters</button></div><div class="creation-layout"><div class="creation-preview"><img id="creation-portrait" width="240" height="240" alt="Adventurer preview"><strong>Adventurer</strong><span>Level 1 · Citizen</span></div><form id="character-create-form"><label for="creation-name">Character name</label><input id="creation-name" type="text" maxlength="24" autocomplete="off" required><label for="creation-sex">Sex</label><select id="creation-sex" required><option value="">Choose male or female</option><option value="male">Male</option><option value="female">Female</option></select><p class="entry-description">Begin as an Adventurer. Choose Knight, Archer, Mage or Rogue at level 5.</p><button type="submit" class="entry-primary">Create character</button><p id="character-create-feedback" class="entry-feedback" role="status"></p></form></div></section></div>`;
  document.body.append(this.dialog,this.creationDialog);this.list=this.dialog.querySelector('#character-slot-list')!;this.feedback=this.dialog.querySelector('#character-select-feedback')!;
  this.dialog.querySelector('#character-previous')!.addEventListener('click',()=>this.select(this.selected-1));
  this.dialog.querySelector('#character-next')!.addEventListener('click',()=>this.select(this.selected+1));
  this.list.addEventListener('keydown',e=>{if(this.busy||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();this.select(e.key==='Home'?0:e.key==='End'?this.slots.length-1:this.selected+(e.key==='ArrowRight'?1:-1));this.list.querySelector<HTMLButtonElement>('.selected-slot button')?.focus({preventScroll:true})});
  this.list.addEventListener('scroll',()=>{clearTimeout(this.scrollTimer);this.scrollTimer=setTimeout(()=>{if(!this.dialog.open||!this.slots.length||this.busy)return;const bounds=this.list.getBoundingClientRect(),center=bounds.x+bounds.width/2;let nearest=0,distance=Infinity;Array.from(this.list.children).forEach((item,index)=>{const rect=item.getBoundingClientRect(),d=Math.abs(rect.x+rect.width/2-center);if(d<distance){nearest=index;distance=d}});if(this.scrollTarget!==undefined){if(nearest!==this.scrollTarget||distance>2){this.select(this.scrollTarget,true,false);return;}this.scrollTarget=undefined;}this.select(nearest,false)},100)});
  for(const event of ['pointerdown','touchstart','wheel'])this.list.addEventListener(event,()=>{this.scrollTarget=undefined},{passive:true});
  new ResizeObserver(()=>{if(this.dialog.open&&this.slots.length)this.select(this.selected,true,false)}).observe(this.list);
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
  this.close();const generation=++this.generation;this.list.replaceChildren();this.slots=[];this.feedback.textContent='Loading characters…';this.dialog.showModal();
  const response=await fetch(`${serverHttp()}/characters`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)}),data=await response.json();
  if(generation!==this.generation||!this.dialog.open)return;
  if(!response.ok||!Array.isArray(data.slots)||data.slots.length!==4)throw Error(data.error||'Unable to load characters.');
  this.feedback.textContent='';this.slots=data.slots;this.selected=0;
  const dots=this.dialog.querySelector('#character-carousel-dots')!;dots.replaceChildren();
  for(const [index,slot] of this.slots.entries()){
   const card=document.createElement('article');card.className=`character-slot ${slot.occupied?'occupied-slot':'empty-slot'}`;card.dataset.slot=String(slot.slot);card.setAttribute('role','listitem');
   const button=document.createElement('button');button.className='carousel-character';button.setAttribute('aria-label',slot.occupied?'Play character':'Create character');button.title=slot.occupied?`${slot.name} · Level ${slot.level}`:`Create character in slot ${slot.slot}`;
   if(slot.occupied){const portrait=document.createElement('img');portrait.className='slot-portrait';portrait.src=preview(slot.skin);portrait.alt=slot.name??'Adventurer';portrait.width=240;portrait.height=240;button.append(portrait);button.onclick=()=>{this.select(index);void this.choose(slot.slot)}}
   else{const icon=document.createElement('span');icon.className='empty-slot-icon';icon.textContent='+';icon.setAttribute('aria-hidden','true');button.append(icon);button.onclick=()=>{this.select(index);this.create(slot.slot)}}
   card.append(button);this.list.append(card);
   const dot=document.createElement('button');dot.className='carousel-dot';dot.setAttribute('aria-label',`Show slot ${slot.slot}`);dot.onclick=()=>this.select(index);dots.append(dot);
  }
  this.select(0,true,false);
 }
 private select(index:number,scroll=true,animate=true){
  if(this.busy||!this.slots.length)return;this.selected=Math.max(0,Math.min(index,this.slots.length-1));const slot=this.slots[this.selected];
  Array.from(this.list.children).forEach((item,i)=>{item.classList.toggle('selected-slot',i===this.selected);item.querySelector('button')!.setAttribute('aria-current',String(i===this.selected))});
  this.dialog.querySelector('#selected-character-name')!.textContent=slot.occupied?slot.name??'Adventurer':'Create a character';
  this.dialog.querySelector('#selected-character-details')!.textContent=slot.occupied?`Level ${slot.level} · ${classes[slot.classId as keyof typeof classes]?.name??'Citizen'} · Slot ${slot.slot}`:`Slot ${slot.slot} · Tap + to begin`;
  Array.from(this.dialog.querySelector('#character-carousel-dots')!.children).forEach((dot,i)=>dot.setAttribute('aria-current',String(i===this.selected)));
  this.dialog.querySelector<HTMLButtonElement>('#character-previous')!.disabled=this.selected===0;
  this.dialog.querySelector<HTMLButtonElement>('#character-next')!.disabled=this.selected===this.slots.length-1;
  if(scroll){this.scrollTarget=this.selected;const item=this.list.children[this.selected] as HTMLElement;this.list.scrollTo({left:item.offsetLeft-(this.list.clientWidth-item.offsetWidth)/2,behavior:animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'auto'})}
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
 close(){clearTimeout(this.scrollTimer);this.scrollTarget=undefined;++this.generation;this.busy=false;for(const dialog of [this.dialog,this.creationDialog]){dialog.close();dialog.removeAttribute('aria-busy');dialog.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(b=>b.disabled=false)}}
}
