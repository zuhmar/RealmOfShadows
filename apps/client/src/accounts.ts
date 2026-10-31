import {CharacterSelect} from './character-select';
import {createClient,type Session} from '@supabase/supabase-js';
let configurationMessage='Account sign-in is not configured on this site. Guest play is available.';
// Account configuration must never stop the game module from loading. Vercel
// values are copied manually, so handle whitespace, missing/invalid values and
// the commonly copied /rest/v1 API path without leaking keys into diagnostics.
function initializeAccounts(){
 const clean=(value:string|undefined)=>value?.trim().replace(/^(['"])(.*)\1$/,'$2').trim();
 let value=clean(import.meta.env.VITE_SUPABASE_URL);const key=clean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
 if(value&&/^[a-z0-9-]+\.supabase\.co(?:\/.*)?$/i.test(value))value=`https://${value}`;
 if(!value||!key)return;
 try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||!/^\/(rest\/v1\/?)?$/.test(url.pathname)||url.username||url.password||url.search||url.hash)throw Error('Invalid project URL');
 return createClient(url.origin,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 }catch{configurationMessage='Account sign-in is unavailable. You can still play as a guest.';console.warn('Account configuration is invalid. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the client deployment settings.');return;}
}
export const supabase=initializeAccounts();
export type PlayMode='account'|'guest';
export interface AccountUI{
 session:()=>Promise<Session|null>;
 current:()=>Session|null;
 mode:()=>PlayMode|null;
 character:()=>{slot:number;name?:string}|undefined;
 status:(message:string)=>void;
 connecting:(value:boolean)=>void;
 entered:()=>void;
 failed:(message:string)=>void;
}
// Explicit entry choices: restoring a Supabase session does not enter the world.
export function setupAccounts(start:(mode:PlayMode)=>Promise<void>,leave:()=>Promise<void>):AccountUI{
 const dialog=document.querySelector<HTMLDialogElement>('#login-dialog')!,form=document.querySelector<HTMLFormElement>('#account-form')!,feedback=document.querySelector<HTMLElement>('#account-feedback')!,signout=document.querySelector<HTMLButtonElement>('#sign-out')!,guest=document.querySelector<HTMLButtonElement>('#play-guest')!,retry=document.querySelector<HTMLButtonElement>('#retry-login')!;
 let current:Session|null=null,busy=false,connecting=false,selected:PlayMode|null=null,character:{slot:number;name?:string}|undefined;
 const characters=new CharacterSelect(async(slot,name)=>{character={slot,name};selected='account';characters.close();show();await start('account');},()=>{characters.close();selected=null;character=undefined;show();render();});
 dialog.dataset.accountsUnavailable=String(!supabase);
 const message=(text:string)=>feedback.textContent=text||(!supabase?configurationMessage:'');
 const render=()=>{
 form.hidden=Boolean(current);document.querySelector<HTMLElement>('#returning-account')!.hidden=!current;document.querySelector('#returning-label')!.textContent=current?`Welcome back, ${current.user.email}`:'';
 // Native mobile inputs stay focusable even when account setup is unavailable.
 for(const input of Array.from(form.querySelectorAll<HTMLInputElement>('input')))input.disabled=busy||connecting;
 document.querySelector<HTMLButtonElement>('#sign-in')!.disabled=!supabase||busy||connecting;
 document.querySelector<HTMLButtonElement>('#create-account')!.disabled=!supabase||busy||connecting||Boolean(current);
 for(const id of ['continue-account','different-account'])document.querySelector<HTMLButtonElement>(`#${id}`)!.disabled=busy||connecting;
 guest.disabled=busy||connecting;retry.disabled=busy||connecting;signout.disabled=busy||connecting;
 document.querySelector<HTMLButtonElement>('#switch-character')!.hidden=selected!=='account'||!current;
 signout.hidden=selected!=='account'||!current;document.querySelector<HTMLElement>('#open-login')!.hidden=selected==='account'&&Boolean(current);
 document.querySelector('#account-label')!.textContent=selected==='account'&&current?`Signed in · ${current.user.email}`:'Guest · Progress is not saved';
 };
 const show=()=>{for(const other of Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')))if(other!==dialog)other.close();if(!dialog.open)dialog.showModal();};
 const initialize=supabase?supabase.auth.getSession().then(({data,error})=>{if(error)message(error.message);current=data.session;render();}).catch(()=>{message('Unable to restore sign-in. Please sign in again.');render();}):Promise.resolve();
 const back=async()=>{connecting=true;render();show();try{await leave();selected=null;retry.hidden=true;message('');}catch{message('Unable to leave the game. Reload before switching characters.');}finally{connecting=false;render();}};
 const play=async(mode:PlayMode)=>{if(mode==='account')await initialize;selected=mode;retry.hidden=true;message(mode==='account'?'Loading your saved character…':'Entering as guest…');try{if(mode==='account'){if(!current)throw Error('Please sign in again.');character=undefined;dialog.close();await characters.open(current.access_token);}else{characters.close();character=undefined;await start(mode);}}catch(error){connecting=false;characters.close();show();message(error instanceof Error?error.message:'Unable to connect. Please retry.');retry.hidden=false;render();}};
 if(!supabase)message(configurationMessage);else message('');render();if(dialog.open)dialog.close();show();dialog.addEventListener('cancel',event=>event.preventDefault());
 supabase?.auth.onAuthStateChange((_event,session)=>{const previous=current?.user.id;current=session;render();if(selected==='account'&&previous&&previous!==session?.user.id&&!busy)setTimeout(()=>void back(),0);});
 form.addEventListener('submit',async event=>{event.preventDefault();if(!supabase||busy||connecting)return;busy=true;message('Connecting to your account…');render();
 const email=document.querySelector<HTMLInputElement>('#account-email')!.value.trim(),password=document.querySelector<HTMLInputElement>('#account-password')!.value;
 try{const create=(event as SubmitEvent).submitter?.id==='create-account';const result=create?await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/'}}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;document.querySelector<HTMLInputElement>('#account-password')!.value='';if(result.data.session){current=result.data.session;await play('account');}else message('Check your email to confirm your account, then sign in.');}
 catch(error){message(error instanceof Error?error.message:'Account request failed. Please try again.');}
 finally{busy=false;render();}
 });
 guest.addEventListener('click',()=>{if(!busy&&!connecting)void play('guest');});
 document.querySelector('#continue-account')!.addEventListener('click',()=>{if(current&&!busy&&!connecting)void play('account');});
 retry.addEventListener('click',()=>{if(selected&&!busy&&!connecting)void play(selected);});
 document.querySelector('#switch-character')!.addEventListener('click',async()=>{if(busy||connecting||!current)return;connecting=true;render();try{await leave();connecting=false;await play('account');}catch{connecting=false;message('Could not save your character. Retry before switching.');show();}finally{render();}});
 document.querySelector('#open-login')!.addEventListener('click',()=>void back());
 document.querySelector('#different-account')!.addEventListener('click',async()=>{if(!supabase||busy||connecting)return;busy=true;render();try{const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;current=null;selected=null;message('Sign in with another account or play as guest.');}catch{message('Could not clear sign-in. Please try again.');}finally{busy=false;render();}});
 signout.addEventListener('click',async()=>{if(!supabase||busy||connecting)return;busy=true;render();message('Saving and signing out…');show();try{await leave();selected=null;const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;current=null;retry.hidden=true;message('Signed out. Choose how to begin your next adventure.');}catch{message('Could not finish signing out. Reload before continuing.');}finally{busy=false;render();}});
 return {character:()=>character,session:()=>selected==='guest'?Promise.resolve(null):initialize.then(()=>selected==='account'?current:null),current:()=>selected==='account'?current:null,mode:()=>selected,status:message,connecting:(value:boolean)=>{connecting=value;render();},entered:()=>{connecting=false;message('');retry.hidden=true;render();characters.close();dialog.close();},failed:(text:string)=>{connecting=false;message(text);retry.hidden=!selected;render();show();}};
}
