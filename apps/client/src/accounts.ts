import {createClient,type Session} from '@supabase/supabase-js';
let configurationMessage='Account sign-in is not configured for this build.';
// Account configuration must never stop the game module from loading. Vercel
// values are copied manually, so handle whitespace, missing/invalid values and
// the commonly copied /rest/v1 API path without leaking keys into diagnostics.
function initializeAccounts(){
 const value=import.meta.env.VITE_SUPABASE_URL?.trim(),key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
 if(!value||!key)return;
 try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||!/^\/(rest\/v1\/?)?$/.test(url.pathname)||url.username||url.password||url.search||url.hash)throw Error('Invalid project URL');
 return createClient(url.origin,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 }catch{configurationMessage='Account sign-in is unavailable. You can still play as a guest.';console.warn('Account configuration is invalid. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the client deployment settings.');return;}
}
export const supabase=initializeAccounts();
export interface AccountUI{
 session:()=>Promise<Session|null>;
 current:()=>Session|null;
 status:(message:string)=>void;
 connecting:(value:boolean)=>void;
}
// Passwords go directly to Supabase Auth, never to the game server or save table.
export function setupAccounts(reconnect:()=>Promise<void>,leave:()=>Promise<void>):AccountUI{
 const form=document.querySelector<HTMLFormElement>('#account-form')!,feedback=document.querySelector<HTMLElement>('#account-feedback')!,signout=document.querySelector<HTMLButtonElement>('#sign-out')!;
 let current:Session|null=null,ready=false,busy=false,connecting=false,lastUser:string|null=null;
 const message=(text:string)=>feedback.textContent=text;
 const render=()=>{form.hidden=Boolean(current);signout.hidden=!current;for(const control of Array.from(form.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button')))control.disabled=!supabase||busy||connecting;signout.disabled=busy||connecting;document.querySelector('#account-label')!.textContent=current?`Signed in · ${current.user.email}`:'Guest · Progress is not saved';};
 const initialize=supabase?supabase.auth.getSession().then(({data,error})=>{if(error)message(error.message);current=data.session;lastUser=current?.user.id??null;ready=true;render();return current;}).catch(()=>{ready=true;message('Unable to restore sign-in. Please sign in again.');render();return null;}):Promise.resolve(null);
 if(!supabase)message(configurationMessage);render();
 supabase?.auth.onAuthStateChange((_event,session)=>{
 current=session;render();const user=session?.user.id??null;if(ready&&user!==lastUser){lastUser=user;setTimeout(()=>void reconnect(),0);}
 });
 form.addEventListener('submit',async event=>{event.preventDefault();if(!supabase||busy||connecting)return;busy=true;message('Connecting to your account…');render();
 const email=document.querySelector<HTMLInputElement>('#account-email')!.value.trim(),password=document.querySelector<HTMLInputElement>('#account-password')!.value;
 try{const create=(event as SubmitEvent).submitter?.id==='create-account';const result=create?await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/'}}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;document.querySelector<HTMLInputElement>('#account-password')!.value='';message(create&&!result.data.session?'Check your email to confirm your account, then sign in.':'Loading your saved character…');}
 catch(error){message(error instanceof Error?error.message:'Account request failed. Please try again.');}
 finally{busy=false;render();}
 });
 signout.addEventListener('click',async()=>{if(!supabase||busy||connecting)return;busy=true;render();message('Saving and signing out…');try{await leave();const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;message('Signed out. Guest progress is not saved.');}catch{message('Could not finish signing out. Please reconnect before continuing.');}finally{busy=false;render();}});
 return {session:()=>initialize.then(()=>current),current:()=>current,status:message,connecting:(value:boolean)=>{connecting=value;render();}};
}
