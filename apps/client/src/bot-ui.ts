import {monsters,spells,type SpellId} from '@realm/game-data';
import {BotBrain,readBotConfig} from './bot-brain';
export class BotUI{
 private key='';
 constructor(public brain:BotBrain,private stop:()=>void){
  try{brain.config=readBotConfig(JSON.parse(localStorage.getItem('realm-bot-config')??'null'))}catch{}
  const enabled=document.querySelector<HTMLInputElement>('#bot-enabled')!;enabled.onchange=()=>{if(enabled.checked){brain.enabled=true;brain.status='Ready · Close profile to begin'}else stop()};document.querySelector('#bot-stop')!.addEventListener('click',stop);
  const monster=document.querySelector<HTMLSelectElement>('#bot-monster')!;for(const[id,m]of Object.entries(monsters)){const o=document.createElement('option');o.value=id;o.textContent=m.name+(m.boss?' · Boss':'');monster.append(o)}monster.value=brain.config.monster;monster.onchange=()=>{brain.config=readBotConfig({...brain.config,monster:monster.value});this.save()};
  const radius=document.querySelector<HTMLSelectElement>('#bot-radius')!;radius.value=String(brain.config.radius);radius.onchange=()=>{brain.config=readBotConfig({...brain.config,radius:Number(radius.value)});this.save()};
  const potions=document.querySelector<HTMLInputElement>('#bot-potions')!,percent=document.querySelector<HTMLInputElement>('#bot-potion-percent')!;potions.checked=brain.config.potions;percent.value=String(brain.config.potionPercent);potions.onchange=()=>{brain.config.potions=potions.checked;this.save()};percent.onchange=()=>{brain.config=readBotConfig({...brain.config,potionPercent:Number(percent.value)});percent.value=String(brain.config.potionPercent);this.save()};
  document.querySelector('#bot-add-spell')!.addEventListener('click',()=>{const id=document.querySelector<HTMLSelectElement>('#bot-spell-select')!.value as SpellId;if(Object.hasOwn(spells,id)&&!brain.config.rotation.includes(id)){brain.config.rotation.push(id);this.save()}});
 }
 private save(){try{localStorage.setItem('realm-bot-config',JSON.stringify(this.brain.config))}catch{}this.key='';}
 render(learned:readonly SpellId[]){
  const b=this.brain;document.querySelector<HTMLInputElement>('#bot-enabled')!.checked=b.enabled;const status=document.querySelector('#bot-status')!;if(status.textContent!==b.status)status.textContent=b.status;document.querySelector<HTMLButtonElement>('#bot-stop')!.hidden=!b.enabled;
  const key=JSON.stringify([learned,b.config]);if(key===this.key)return;this.key=key;const host=document.querySelector('#bot-rotation')!;host.replaceChildren();
  const rotation=b.config.rotation.filter(id=>learned.includes(id));for(const id of rotation){const row=document.createElement('li'),name=document.createElement('span');name.textContent=spells[id].name;row.append(name);for(const [label,delta]of [['Earlier',-1],['Later',1],['Remove',0]] as const){const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',`${label} ${spells[id].name}`);const index=b.config.rotation.indexOf(id);button.disabled=delta!==0&&(rotation.indexOf(id)+delta<0||rotation.indexOf(id)+delta>=rotation.length);button.onclick=()=>{if(delta===0)b.config.rotation=b.config.rotation.filter(s=>s!==id);else{const other=rotation[rotation.indexOf(id)+delta],at=b.config.rotation.indexOf(other);[b.config.rotation[index],b.config.rotation[at]]=[b.config.rotation[at],b.config.rotation[index]]}this.save()};row.append(button)}host.append(row)}
  if(!rotation.length){const row=document.createElement('li');row.textContent=learned.length?'No spells selected · Weapon attacks only.':'Learn spells from Mara to build a rotation. Weapon attacks still work.';host.append(row)}
  const select=document.querySelector<HTMLSelectElement>('#bot-spell-select')!;select.replaceChildren();for(const id of learned.filter(id=>!rotation.includes(id))){const o=document.createElement('option');o.value=id;o.textContent=spells[id].name;select.append(o)}document.querySelector<HTMLButtonElement>('#bot-add-spell')!.disabled=!select.options.length;
 }
}
