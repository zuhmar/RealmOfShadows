import {villageDoors,type RegionId} from '@realm/game-data';
interface Actor{x:number;y:number;stepX?:number;stepY?:number;region:string;hp?:number}
export function toggleVillageDoor(states:{get(id:string):boolean|undefined;set(id:string,value:boolean):unknown},actor:Actor,id:unknown,actors:Iterable<Actor>){
 const door=typeof id==='string'?villageDoors(actor.region).find(d=>d.id===id):undefined;
 if(!door||(actor.hp??1)<=0||Math.hypot(actor.x-door.x,actor.y-door.y)>2.5)return 'Move closer to the door.';
 const open=states.get(door.id)!==false;
 if(open){for(const other of actors)if(other.region===actor.region&&(other.hp??1)>0){const cells=[`${Math.floor(other.x)},${Math.floor(other.y)}`];if(Number.isFinite(other.stepX)&&Number.isFinite(other.stepY))cells.push(`${Math.floor(other.stepX!)},${Math.floor(other.stepY!)}`);if(cells.some(c=>door.cells.includes(c)))return 'The doorway is occupied.';}}
 states.set(door.id,!open);return `${door.name} door ${open?'closed':'opened'}.`;
}
