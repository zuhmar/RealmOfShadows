import type {RegionId} from '@realm/game-data';
export const partyRules={capacity:4,inviteSeconds:60,rewardRange:16};
export interface Party{ id:string;leader:string;members:string[];turn:number }
export interface PartyInvite{partyId:string;leader:string;expiresAt:number}
export interface SocialPlayer{id:string;name:string;region:RegionId;level:number;hp:number}
export interface SocialState{self:string;players:SocialPlayer[];party:{id:string;leader:string;members:string[]}|null;invites:PartyInvite[]}
export interface ChatMessage{id:number;channel:'world'|'party';sender:string;name:string;text:string;at:number}
/** Session-only membership. All IDs are server session IDs, never names supplied in messages. */
export class PartySystem{
 private parties=new Map<string,Party>();private membership=new Map<string,string>();private invitations=new Map<string,PartyInvite[]>();private serial=0;
 get(id:string){const key=this.membership.get(id);return key?this.parties.get(key):undefined;}
 invites(id:string,now:number){const list=(this.invitations.get(id)??[]).filter(i=>i.expiresAt>now&&this.parties.get(i.partyId)?.leader===i.leader);if(list.length)this.invitations.set(id,list);else this.invitations.delete(id);return list;}
 act(id:string,request:unknown,online:(id:string)=>boolean,now:number):string{
  if(!request||typeof request!=='object'||!online(id))return 'Party unavailable.';
  const {kind,target,partyId}=request as {kind?:unknown;target?:unknown;partyId?:unknown};let party=this.get(id);
  if(kind==='leave'){if(!party)return 'You are not in a party.';this.remove(id);return 'You left the party.';}
  if(kind==='kick'){
   if(!party||party.leader!==id)return 'Only the party leader can remove members.';
   if(typeof target!=='string'||target===id||!party.members.includes(target))return 'Choose a party member.';
   this.remove(target);return 'Player removed from the party.';
  }
  if(kind==='invite'){
   if(typeof target!=='string'||target===id||!online(target))return 'Choose an online player in this world.';
   if(party&&party.leader!==id)return 'Only the party leader can invite players.';
   if(this.get(target))return 'That player is already in a party.';
   if(party&&party.members.length>=partyRules.capacity)return 'Your party is full.';
   const pending=this.invites(target,now);if(pending.length>=4)return 'That player has too many pending invitations.';
   if(!party){party={id:`party-${++this.serial}`,leader:id,members:[id],turn:0};this.parties.set(party.id,party);this.membership.set(id,party.id);}
   if(pending.some(i=>i.partyId===party!.id))return 'Invitation already sent.';
   this.invitations.set(target,[...pending,{partyId:party.id,leader:id,expiresAt:now+partyRules.inviteSeconds}]);return 'Party invitation sent.';
  }
  if(kind==='accept'||kind==='decline'){
   const pending=this.invites(id,now),invite=pending.find(i=>i.partyId===partyId);if(!invite)return 'That invitation has expired.';
   this.invitations.set(id,pending.filter(i=>i!==invite));if(kind==='decline')return 'Invitation declined.';
   if(party)return 'Leave your current party first.';
   const group=this.parties.get(invite.partyId);if(!group||!online(group.leader))return 'That party is no longer available.';
   if(group.members.length>=partyRules.capacity)return 'That party is full.';
   group.members.push(id);this.membership.set(id,group.id);this.invitations.delete(id);return 'You joined the party.';
  }
  return 'Choose a valid party action.';
 }
 remove(id:string){
  this.invitations.delete(id);const group=this.get(id);this.membership.delete(id);if(!group)return;
  group.members=group.members.filter(member=>member!==id);
  if(!group.members.length)this.parties.delete(group.id);
  if(group.leader===id){group.leader=group.members[0]??'';for(const [target,list]of this.invitations){const next=list.filter(i=>i.partyId!==group.id);if(next.length)this.invitations.set(target,next);else this.invitations.delete(target);}}
 }
}
