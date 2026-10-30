import type {HouseRecord} from '@realm/game-data';
import {randomUUID} from 'node:crypto';
import {readProgress,type CharacterProgress} from '../../../packages/shared/src/saves';
export interface Identity{id:string;email:string;displayName?:string}
export interface ProgressStore{
 verify(token:unknown):Promise<Identity>;
 claim(userId:string,lease:string,initial:CharacterProgress):Promise<CharacterProgress>;
 houses?():Promise<HouseRecord[]>;
 commitHouse?(userId:string,lease:string,record:HouseRecord,revision:number,progress:CharacterProgress):Promise<{savedAt:string}>;
 save(userId:string,lease:string,progress:CharacterProgress,release:boolean):Promise<string>;
}
export class SupabaseStore implements ProgressStore{
 constructor(private url:string,private secret:string){}
 private async request(path:string,body?:unknown,token?:string){
 const headers:Record<string,string>={apikey:this.secret,'Content-Type':'application/json'};
 if(token)headers.Authorization=`Bearer ${token}`;else if(this.secret.startsWith('eyJ'))headers.Authorization=`Bearer ${this.secret}`;
 const response=await fetch(`${this.url.replace(/\/$/,'')}${path}`,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 if(!response.ok){const error=await response.json().catch(()=>({}));if(error?.message?.includes('CHARACTER_IN_USE'))throw Error('This character is already connected. Close the other game and wait up to a minute.');if(error?.message?.includes('SAVE_SESSION_EXPIRED'))throw Error('Your save session expired. Reconnect to reload your character.');throw Error(path.startsWith('/auth/')?'Sign-in expired. Please sign in again.':'Save service unavailable. Check the server settings and database migrations.');}
 return response.json();
 }
 async houses(){return await this.request('/rest/v1/rpc/list_player_houses',{}) as HouseRecord[];}
 async commitHouse(userId:string,lease:string,record:HouseRecord,revision:number,progress:CharacterProgress){return await this.request('/rest/v1/rpc/commit_player_house',{p_user_id:userId,p_session_id:lease,p_house_id:record.id,p_revision:revision,p_record:record,p_progress:progress}) as {savedAt:string};}
 async verify(token:unknown){if(typeof token!=='string'||token.length>8192||!token.length)throw Error('Sign in to load your character.');const user=await this.request('/auth/v1/user',undefined,token);if(typeof user.id!=='string'||typeof user.email!=='string')throw Error('Invalid account.');return {id:user.id,email:user.email,displayName:typeof user.user_metadata?.display_name==='string'?user.user_metadata.display_name.replace(/[\x00-\x1f]/g,'').trim().slice(0,40):undefined};}
 async claim(userId:string,lease:string,initial:CharacterProgress){return readProgress(await this.request('/rest/v1/rpc/claim_character',{p_user_id:userId,p_session_id:lease,p_initial_progress:initial}));}
 async save(userId:string,lease:string,progress:CharacterProgress,release:boolean){return await this.request('/rest/v1/rpc/save_character',{p_user_id:userId,p_session_id:lease,p_progress:readProgress(progress),p_release:release}) as string;}
}
// Serialize each character's writes. A delayed autosave must not overwrite a later
// purchase/logout; a stale server cannot overwrite the current database lease.
export class SaveSession{
 readonly lease=randomUUID();tail:Promise<unknown>=Promise.resolve();savedAt='';closed=false;failed=false;
 constructor(readonly store:ProgressStore,readonly identity:Identity){}
 commitHouse(record:HouseRecord,revision:number,progress:CharacterProgress){if(this.closed||!this.store.commitHouse)return Promise.reject(Error('Housing saves are unavailable.'));const snapshot=readProgress(progress),next=this.tail.catch(()=>{}).then(async()=>{if(this.failed)throw Error('Save transaction failed.');try{const result=await this.store.commitHouse!(this.identity.id,this.lease,record,revision,snapshot);this.savedAt=result.savedAt;}catch(e){this.failed=true;throw e;}});this.tail=next;return next;}
 async claim(initial:CharacterProgress){return this.store.claim(this.identity.id,this.lease,initial);}
 save(progress:CharacterProgress,release=false){if(this.closed)return Promise.reject(Error('Save session closed.'));if(release)this.closed=true;const snapshot=readProgress(progress);const next=this.tail.catch(()=>{}).then(()=>{if(this.failed)throw Error('Save transaction failed.');return this.store.save(this.identity.id,this.lease,snapshot,release);});this.tail=next;return next.then(at=>{this.savedAt=at;return at;});}
}
const url=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
export const progressStore:ProgressStore|undefined=url&&secret?new SupabaseStore(url,secret):undefined;
