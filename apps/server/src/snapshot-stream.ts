interface Recipient{sessionId:string;send(type:string,data:unknown):void}
/** Preserve authoritative clock ticks without retransmitting unchanged inventory and housing. */
export class SnapshotStream{
 private previous=new Map<string,string>();
 send(client:Recipient,snapshot:{time:number;[key:string]:unknown}){
  const {time,...content}=snapshot,key=JSON.stringify(content);
  if(this.previous.get(client.sessionId)===key)client.send('economy-clock',{time});
  else{client.send('economy-state',snapshot);this.previous.set(client.sessionId,key);}
 }
 forget(id:string){this.previous.delete(id);}
}
