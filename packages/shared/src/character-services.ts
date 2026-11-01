import {newAttributes,isClassChoice,canLearnSpell,skinDefinitions,cosmeticLook} from '@realm/game-data';
import type {Profile} from './economy';
/** Pure plan: paid token consumption and the resulting save commit together. */
export function planCharacterService(current:Profile,sku:unknown,classId?:unknown):Profile|string{
 const p=structuredClone(current);
 if(sku==='token:sex-change'){
  p.sex=p.sex==='female'?'male':'female';
  if(p.cosmetics.skin!=='auto')p.cosmetics.skin=cosmeticLook(p.cosmetics,p.classId,p.sex).skin;
 }else if(sku==='token:stat-reset'){
  if(Object.values(p.attributes).every(v=>v===10))return 'No spent attribute points to reset.';
  p.attributes=newAttributes();
 }else if(sku==='token:class-change'){
  if(p.level<5||p.classId==='citizen')return 'Reach level 5 and choose your first class for free.';
  if(!isClassChoice(classId)||classId===p.classId)return 'Choose a different class.';
  const old=p.classId;p.classId=classId;p.learnedSpells=p.learnedSpells.filter(id=>canLearnSpell(id,p));
  if(p.cosmetics.skin!=='auto'&&skinDefinitions[p.cosmetics.skin].theme===old)p.cosmetics.skin='auto';
 }else return 'Choose a valid service token.';
 return p;
}
