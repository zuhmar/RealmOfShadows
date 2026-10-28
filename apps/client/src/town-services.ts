import Phaser from 'phaser';
import {craftingStations,craftingStation,professionDefinitions,villageBuildings,insideBuilding,type CraftingStation} from '@realm/game-data';
import {SkinAvatar} from './skin-avatar';
export function drawTownServices(scene:Phaser.Scene,region:string,click:(id:string)=>void){
 if(region!=='elderwood')return;
 for(const station of craftingStations){
  if(!('npc'in station))continue;
  const npc=station.npc,skin=new SkinAvatar(scene);skin.pose({skin:npc.skin,wings:'none',aura:'none'},'down',false,0);
  const shadow=scene.add.ellipse(0,0,30,12,0x102823,.3),label=scene.add.text(0,-94,`${station.name}\n${station.id==='smithy'?'Blacksmithing':'Wood · Food · Potions'}`,{fontSize:'11px',align:'center',color:'#ffe1a8',backgroundColor:'#203b36'}).setOrigin(.5);
  const hit=scene.add.zone(0,-38,72,92).setInteractive({useHandCursor:true});
  const view=scene.add.container(npc.x*64,npc.y*64,[shadow,skin,label,hit]).setDepth(npc.y*64+1).setData('townService',station.id).setData('serviceHit',hit);
  hit.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target===scene.game.canvas&&!p.rightButtonDown())click(station.id)});
  view.setVisible(false);hit.input!.enabled=false;
 }
}
export function updateTownServices(objects:Phaser.GameObjects.GameObject[],p:{x:number;y:number},region:string){
 for(const object of objects){const id=object.getData('townService');if(!id)continue;const station=craftingStation(id)!,building=villageBuildings.find(b=>b.id===station.building)!;
  const visible=region==='elderwood'&&insideBuilding(p,building);(object as Phaser.GameObjects.Container).setVisible(visible);const hit=object.getData('serviceHit') as Phaser.GameObjects.Zone;hit.input!.enabled=visible;
 }
}
export function showTownService(station:CraftingStation){
 const host=document.querySelector<HTMLElement>('#town-service-panel')!;host.hidden=false;host.replaceChildren();
 document.querySelector('#inventory-title')!.textContent=station.name;
 const heading=document.createElement('h3'),guide=document.createElement('p');heading.textContent=station.id==='smithy'?'Smithy services':station.id==='workshop'?'Workshop services':'Public crafting station';guide.textContent=station.guide;host.append(heading,guide);
 const pairs={blacksmithing:'mining',woodworking:'woodcutting',cooking:'fishing',alchemy:'herbalism'};
 for(const skill of station.skills){const button=document.createElement('button');button.type='button';button.textContent=professionDefinitions[skill].name;button.addEventListener('click',()=>{const panel=document.querySelector<HTMLDetailsElement>('#professions-panel')!;panel.open=true;for(const pair of Array.from(document.querySelectorAll<HTMLDetailsElement>('#profession-list > details'))){pair.open=pair.dataset.profession===pairs[skill];if(pair.open)pair.scrollIntoView({block:'start'});}});host.append(button);}
 host.closest('dialog')!.scrollTop=0;
 if(station.id==='smithy'){
  const identify=document.createElement('button');identify.type='button';identify.textContent='Identify equipment · Free';identify.addEventListener('click',()=>{document.querySelector<HTMLDetailsElement>('#professions-panel')!.open=false;const panel=document.querySelector<HTMLDetailsElement>('#loot-equipment')!;panel.open=true;panel.scrollIntoView({block:'nearest'});});host.append(identify);
 }
}
