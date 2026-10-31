import {regions,isRegion,type RegionId} from '@realm/game-data';
import atlas from '../../../assets/ui/wayfarer/island-atlas.webp?url';
export const wayfarerDestinations=[
 {id:'elderwood',name:'Elderwood',range:'Safe haven',description:'The village, Depot, crafting hall and your home port.'},
 {id:'woods',name:'Whispering Woods',range:'Levels 1–10',description:'Ancient forest trails, woodland beasts and the Forest Bear.'},
 {id:'caverns',name:'Crystal Caverns',range:'Levels 11–20',description:'Crystal galleries, underground passages and the Crystal Wyrm.'},
 {id:'swamp',name:'Murkmire Swamp',range:'Levels 21–30',description:'Wetland exploration preview. The story and encounters are still to come.'},
 {id:'tundra',name:'Frostfall Tundra',range:'Levels 31–40',description:'Frozen cliffs, icebound forests and the northern frontier.'},
 {id:'celestial',name:'Celestial Realm',range:'Levels 41–50',description:'Golden sanctuaries and floating islands above the clouds.'},
 {id:'peaks',name:'Ember Peaks',range:'Levels 51–60',description:'Volcanic passes, rivers of lava and dragonfire.'},
 {id:'fortress',name:'Shadow Fortress',range:'Levels 61–100',description:'The final road to the Shadow Dragon.'},
] as const;
export function renderWayfarer(host:HTMLElement,current:RegionId,travel:(region:RegionId)=>void){
 host.replaceChildren();for(const[destinationIndex,d]of wayfarerDestinations.entries()){
  const available=isRegion(d.id),here=current===d.id,button=document.createElement('button');button.type='button';button.className='wayfarer-card';button.dataset.island=d.id;button.disabled=!available||here;button.classList.toggle('wayfarer-current',here);button.classList.toggle('wayfarer-planned',!available);
  const art=document.createElement('span');art.className='wayfarer-art';art.setAttribute('aria-hidden','true');art.style.backgroundImage=`url("${atlas}")`;art.style.backgroundPosition=`${destinationIndex%2*100}% ${Math.floor(destinationIndex/2)*100/3}%`;
  const text=document.createElement('span');text.className='wayfarer-copy';const range=document.createElement('small');range.textContent=d.range;const name=document.createElement('strong');name.textContent=available?regions[d.id].name:d.name;const description=document.createElement('span');description.className='wayfarer-description';description.textContent=d.description;const badge=document.createElement('span');badge.className='wayfarer-status';badge.textContent=here?'Current island':!available?'Coming soon':d.id==='swamp'?'Explore preview':'Travel';text.append(range,name,description,badge);button.append(art,text);button.setAttribute('aria-label',`${name.textContent} · ${d.range} · ${badge.textContent}`);const target=d.id;if(isRegion(target)&&!here)button.addEventListener('click',()=>travel(target));host.append(button);
 }
}
