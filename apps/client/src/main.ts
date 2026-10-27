import {renderProfessions} from './profession-ui';
import {professionAssets,drawProfessionNodes,updateProfessionNodes} from './profession-world';
import {renderQuests} from './quest-ui';
import {renderDepot} from './depot-ui';
import bagIconUrl from '../../../assets/generated/bag-icon.png?url';
import {generatedSourceSheets,installGeneratedArt} from './generated-art';
import {mapObjectTileAssets} from './map-object-tiles';
import {terrainTileAssets,drawTiledTerrain} from './tiled-terrain';
import {generatedMonsters} from './monster-assets';
import Phaser from 'phaser';
import {displayDensity,displaySize} from './display';
import {SkinAvatar,skinAssets,installSkinAnimations} from './skin-avatar';
import {setupWardrobe,renderWardrobe} from './wardrobe';
import {setupAccounts,type AccountUI} from './accounts';
import {Client,type Room} from 'colyseus.js';
import {resolveFishingWater,resourceTarget,fishingCastClear,fishingShores,professionLevel,resourceNodes,craftingBench,professionRules,compareGear,supplySellPrice,catalogueSellPrice,droppedSellPrice,gearDefinition,gearStats,gearName,gearSlot,rarityDefinitions,type GearSlot,cosmeticLook,readCosmeticLook,type Cosmetics,depotBoxes,atDepot,gridDirections,gridMap,rootsMap,rootsObjects,stairsFor,availableStair,isLowerFloor,depthsMap,depthsObjects,attributeDefinitions,attributeRules,maxHealth,maxMana,type AttributeId,regionSize,monsters,monsterKind,monsterRegion,combatRegion,cavernsMap,cavernsObjects,woodsMap,woodsObjects,WORLD,equipmentTiers,readAppearance,equipmentItems,equipmentSlots,type EquipmentSlot,elderwoodMap,elderwoodObjects,landmarks,characterSprite,regions,portalFor,canTravel,combat as C,items,merchant,rewards,weapons,classes,classRules,skillRequirement,spells,canLearnSpell,isSpell,type RegionId,type Facing} from '@realm/game-data';
import {inAttackRange,attackPath,sight,move,occupiedCells,pathfind,CombatSimulation,newFighter,Economy,type EconomySnapshot,type Fighter,type Wolf,type CombatEvent,type Point,type Motion,type Input} from '@realm/shared';
import './style.css';
import {animatedMonsters,animatedMonster,installMonsterAnimations,playMonster} from './monster-animations';
import {characterAssets,characterFrameSize,characterStyle} from './character-assets';
import {maraAsset} from './mara-assets';
import {itemSprite} from './item-assets';
let noticeTimer:ReturnType<typeof setTimeout>;
const notice=(s:string)=>{const element=document.querySelector('#notice')!;element.textContent=s;element.classList.remove('is-quiet');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>element.classList.add('is-quiet'),5500);};
class Elderwood extends Phaser.Scene {
 terrainCleanup?:()=>void;
 viewZoom=.85;
 region:RegionId='elderwood';worldObjects:Phaser.GameObjects.GameObject[]=[];portalGlow?:Phaser.GameObjects.Graphics;traveling=false;travelTimer?:ReturnType<typeof setTimeout>;
 portraitKey='';inventoryRenderKey='';economy=new Economy();bag?:EconomySnapshot;dropViews=new Map<string,Phaser.GameObjects.Container>();shopOpen=false;lastXp=0;
 fxObjects=new Set<Phaser.GameObjects.GameObject>();sim=new CombatSimulation();fighter:Fighter=newFighter();wolfViews=new Map<string,Phaser.GameObjects.Container>();selected='';autoAttack=false;chaseAt=0;
 entryReady=false;connectionGeneration=0;pendingEntry=false;
 accounts?:AccountUI;switchingAccount=false;accountLoaded=false;connectBusy=false;
 room?:Room; avatar!:Phaser.GameObjects.Container; bodySprite?:Phaser.GameObjects.Sprite;
 local:Motion={...WORLD.spawn,stamina:100}; keys!:Record<string,Phaser.Input.Keyboard.Key>;
 peers=new Map<string,Phaser.GameObjects.Container>();route:Point[]=[];seq=0;acc=0;online=false;preview=false;touch={x:0,y:0};pendingResource?:string;pendingWorkbench=false;resourceRouteAt=0;pendingIdentifications=new Set<string>();pendingLoot?:string;lootRouteAt=0;pendingDepot?:string;activeDepot='';pendingStair?:string;pendingInteraction:'portal'|'trader'|undefined;sprinting=false;pending:Input[]=[];facing:Facing='down';walking=false;animationStyle=new Map<string,{scale:number;origin:number}>();
 preload(){for(const a of professionAssets)this.load.image(a.key,a.url);for(const asset of skinAssets)this.load.image(asset.key,asset.url);for(const sheet of generatedSourceSheets)this.load.image(sheet.key,sheet.url);for(const asset of mapObjectTileAssets)this.load.image(asset.key,asset.url);for(const asset of terrainTileAssets)this.load.image(asset.key,asset.url);this.load.image(generatedMonsters.key,generatedMonsters.url);this.load.image(maraAsset.key,maraAsset.url);for(const asset of animatedMonsters)this.load.image(asset.key,asset.url);for(const asset of characterAssets)this.load.image(asset.key,asset.url);if(characterSprite)this.load.spritesheet(characterSprite.key,characterSprite.url,{frameWidth:characterSprite.frameWidth,frameHeight:characterSprite.frameHeight});}
 create(){
 installGeneratedArt(this);
 if(this.textures.exists(generatedMonsters.key)){const texture=this.textures.get(generatedMonsters.key);for(const [kind,f]of Object.entries(generatedMonsters.frames))texture.add(kind,0,f.x,f.y,f.w,f.h);}
 setupWardrobe(cosmetics=>this.economyAction({kind:'cosmetics',cosmetics}));
 const drawers=Array.from(document.querySelectorAll<HTMLDetailsElement>('nav details'));for(const drawer of drawers)drawer.addEventListener('toggle',()=>{if(drawer.open)for(const other of drawers)if(other!==drawer)other.open=false;});
 if(this.textures.exists(maraAsset.key)){const texture=this.textures.get(maraAsset.key);for(const animation of maraAsset.animations){const frames=animation.frames.map(([x,y,w,h],i)=>{const name=`${animation.key}-${i}`;texture.add(name,0,x,y,w,h)?.setTrim(maraAsset.frameWidth,maraAsset.frameHeight,(maraAsset.frameWidth-w)/2,maraAsset.frameHeight-h,w,h);return {key:maraAsset.key,frame:name};});this.anims.create({key:`mara-${animation.key}`,frames,frameRate:animation.fps,repeat:-1});}}
 document.querySelector('#character-panel')!.addEventListener('click',()=>this.openCharacter());document.querySelector('#close-character')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#character-dialog')!.close());
 this.economy.join('local');this.bag=this.economy.snapshot('local',0);
 installMonsterAnimations(this);
 for(const asset of characterAssets){
 if(!this.textures.exists(asset.key))continue;
 const texture=this.textures.get(asset.key);
 const frames=asset.bounds.map(([left,top,right,bottom],i)=>{const name=`frame-${i}`,w=right-left,h=bottom-top;
 texture.add(name,0,i*characterFrameSize+left,top,w,h)?.setTrim(characterFrameSize,characterFrameSize,(characterFrameSize-w)/2,characterFrameSize-h,w,h);
 return {key:asset.key,frame:name};});
 for(const action of ['idle','walk'] as const){const animation=`${action}-${asset.direction}`;
 this.anims.create({key:animation,frames:action==='idle'?frames.slice(0,1):frames.slice(1),frameRate:action==='idle'?1:8,repeat:-1});
 this.animationStyle.set(animation,characterStyle);}
 }
 installSkinAnimations(this);
 for(const [id,s] of Object.entries(spells)){const button=document.createElement('button');button.dataset.spell=id;button.addEventListener('click',()=>this.economyAction({kind:'learn',spell:id}));document.querySelector('#spell-shop')!.append(button);}
 this.drawMap();
 this.drawPortraits();
 this.avatar=this.makeAvatar(0xf0cc80,'You');this.bodySprite=this.avatar.getData('sprite');this.avatar.setPosition(this.local.x*64,this.local.y*64);
 if(characterSprite&&this.textures.exists(characterSprite.key)){this.avatar.removeAll(true);this.bodySprite=this.add.sprite(0,0,characterSprite.key).setOrigin(characterSprite.anchor.x,characterSprite.anchor.y).setScale(characterSprite.scale);this.avatar.add(this.bodySprite);for(const [action,directions] of Object.entries(characterSprite.animations))for(const [direction,a] of Object.entries(directions!)){this.anims.create({key:`${action}-${direction}`,frames:a.frames.map(frame=>({key:characterSprite!.key,frame})),frameRate:a.fps,repeat:-1});}}
 this.cameras.main.setBounds(0,0,WORLD.width*64,WORLD.height*64).startFollow(this.avatar,true,.12,.12).setZoom(this.viewZoom*displayDensity());
// Track game keys without global preventDefault: disabling the scene keyboard
 // alone does not stop Phaser from swallowing letters typed into DOM forms.
 this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SHIFT,SPACE,ONE,TWO,THREE,I,E,ESC',false) as typeof this.keys;
 this.input.mouse?.disableContextMenu();this.input.on('pointerdown',(p:Phaser.Input.Pointer,objects:Phaser.GameObjects.GameObject[])=>{if(p.event.target!==this.game.canvas||!this.entryReady||document.querySelector('dialog[open]'))return;if(!p.rightButtonDown()&&!objects.some(o=>!o.getData('resourceHit'))&&gridMap(this.region).cells[Math.floor(p.worldY/64)]?.[Math.floor(p.worldX/64)]===3){const water=resolveFishingWater(this.region,Math.floor(p.worldX/64),Math.floor(p.worldY/64));if(water)this.approachResource(water.id);else notice('No reachable fishing shore here.');return;}if(objects.length)return;if(!p.rightButtonDown()&&Array.from(this.dropViews.values()).some(v=>Phaser.Math.Distance.Between(p.worldX,p.worldY,v.x,v.y)<32))return;if(combatRegion(this.region)&&!p.rightButtonDown()&&Array.from(this.wolfViews.values()).some(v=>Math.abs(p.worldX-v.x)<(v.getData('hitWidth')??110)/2&&p.worldY>=v.y-(v.getData('hitHeight')??100)&&p.worldY<=v.y+12))return;if(!p.middleButtonDown()){this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.selected='';this.cast('stop');this.route=pathfind(this.local,{x:p.worldX/64,y:p.worldY/64},this.region,this.occupied());if(!this.route.length)notice('Choose a clear path through town.');}});
 this.input.keyboard!.removeCapture([Phaser.Input.Keyboard.KeyCodes.SPACE,Phaser.Input.Keyboard.KeyCodes.ESC]);
 const accountForm=document.querySelector<HTMLFormElement>('#account-form')!;accountForm.addEventListener('focusin',()=>{this.input.keyboard!.enabled=false;this.input.keyboard!.resetKeys();});accountForm.addEventListener('focusout',()=>{this.input.keyboard!.enabled=this.entryReady;});
 this.keys.SPACE.on('down',()=>{if(document.activeElement?.matches('button,summary'))return;if(this.selected&&combatRegion(this.region))this.cast('bolt');else this.interact();});
 for(const [id,definition]of Object.entries(attributeDefinitions)){const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');row.className='attribute-row';label.id=`attribute-${id}`;button.type='button';button.dataset.attribute=id;button.disabled=true;button.textContent='+';button.setAttribute('aria-label',`Increase ${definition.name}`);button.title=definition.description;button.addEventListener('click',()=>this.economyAction({kind:'attribute',attribute:id}));row.append(label,button);document.querySelector('#attribute-list')!.append(row);}
 document.querySelector('#choose-class')!.addEventListener('click',()=>this.openClasses());document.querySelector('#close-class')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#class-dialog')!.close());document.querySelector('#weapon-select')!.addEventListener('change',event=>{const value=(event.target as HTMLSelectElement).value;this.economyAction(value.startsWith('gear:')?{kind:'equip-gear',item:value.slice(5)}:{kind:'equip',weapon:value});});
 this.keys.I.on('down',()=>this.openInventory(false));this.keys.E.on('down',()=>this.pickupNearest());this.keys.THREE.on('down',()=>this.economyAction({kind:'potion'}));
 document.querySelector('#inventory-button')!.addEventListener('click',()=>this.openInventory(false));document.querySelector('#potion')!.addEventListener('click',()=>this.economyAction({kind:'potion'}));document.querySelector('#loot')!.addEventListener('click',()=>this.pickupNearest());
 document.querySelector('#close-depot')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#depot-dialog')!.close());
 document.querySelector('#close-inventory')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#inventory-dialog')!.close());document.querySelector('#buy-potion')!.addEventListener('click',()=>this.economyAction({kind:'buy'}));document.querySelector('#sell-pelts')!.addEventListener('click',()=>this.economyAction({kind:'sell'}));
 this.keys.ONE.on('down',()=>this.cast('bolt'));this.keys.TWO.on('down',()=>this.cast('nova'));this.keys.ESC.on('down',()=>{this.selected='';this.cast('stop');});

 document.querySelector('#close-portal')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#portal-dialog')!.close());
 document.querySelector<HTMLImageElement>('#bag-icon')!.src=bagIconUrl;
 for(const tab of ['profile','wardrobe','settings'])document.querySelector(`#${tab}-tab`)!.addEventListener('click',()=>{for(const name of ['profile','wardrobe','settings']){document.querySelector<HTMLElement>(`#${name}-content`)!.hidden=name!==tab;document.querySelector(`#${name}-tab`)!.setAttribute('aria-selected',String(name===tab));}});
 const sprint=document.querySelector('#sprint')!;sprint.addEventListener('click',()=>{this.sprinting=!this.sprinting;sprint.setAttribute('aria-pressed',String(this.sprinting));sprint.textContent=`Sprint: ${this.sprinting?'on':'off'}`;});
 for(const [id,delta] of [['zoom-in',.1],['zoom-out',-.1]] as const)document.querySelector(`#${id}`)!.addEventListener('click',()=>{this.viewZoom=Phaser.Math.Clamp(this.viewZoom+delta,.5,1.5);this.cameras.main.setZoom(this.viewZoom*displayDensity());});
 window.addEventListener('blur',()=>{this.touch={x:0,y:0};this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];this.input.keyboard?.resetKeys();});
 this.input.keyboard!.enabled=false;this.accounts=setupAccounts(()=>this.reconnectAccount(),()=>this.leaveAccount());
 }
 drawPortraits(){
 if(!this.bag)return;this.portraitKey=JSON.stringify([this.bag.classId,this.bag.cosmetics]);const skin=new SkinAvatar(this);skin.pose(cosmeticLook(this.bag.cosmetics,this.bag.classId),'down',false,0);for(const id of ['profile-portrait','character-portrait','wardrobe-portrait'])skin.portrait(document.querySelector<HTMLCanvasElement>(`#${id}`)!);skin.destroy();
 }
 openCharacter(){
 this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;
 if(this.traveling||!this.entryReady)return;for(const dialog of Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')))dialog.close();this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();document.querySelector<HTMLDialogElement>('#character-dialog')!.showModal();
 }
 openClasses(){
 const bag=this.bag;if(!bag||bag.classId!=='citizen'||bag.level<classRules.unlockLevel||this.fighter.hp<=0)return;
 const list=document.querySelector('#class-options')!;list.replaceChildren();for(const [id,definition] of Object.entries(classes)){const button=document.createElement('button');button.type='button';const name=document.createElement('strong');name.textContent=definition.name;const text=document.createElement('span');text.textContent=definition.description;button.append(name,text);button.addEventListener('click',()=>this.economyAction({kind:'class',classId:id}));list.append(button);}
 document.querySelector<HTMLDialogElement>('#character-dialog')!.close();document.querySelector<HTMLDialogElement>('#class-dialog')!.showModal();this.route=[];this.input.keyboard?.resetKeys();
 }
 economyAction(request:{kind:string;drop?:string;weapon?:string;classId?:string;spell?:string;item?:string;slot?:string;attribute?:string;category?:string;box?:string;cosmetics?:Cosmetics}){
 if(request.kind==='identify'&&request.item&&this.bag?.gear.some(g=>g.id===request.item&&!g.rarity))this.pendingIdentifications.add(request.item);
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,stepX:this.local.stepX,stepY:this.local.stepY,region:this.region});const message=this.economy.act('local',this.fighter,request,this.sim.time);this.bag=this.economy.snapshot('local',this.sim.time);document.querySelector<HTMLSelectElement>('#weapon-select')!.value=this.bag.equippedGear.weapon?`gear:${this.bag.equippedGear.weapon}`:this.bag.weapon;notice(message);document.querySelector('#inventory-feedback')!.textContent=message;this.renderInventory();if(document.querySelector<HTMLDialogElement>('#depot-dialog')!.open&&this.activeDepot)this.drawDepot();document.querySelector('#depot-feedback')!.textContent=message;}
 else if(this.online)this.room?.send('economy',request);
 }
 lootPath(drop:Point):Point[]{
 // Loot may land inside sanctuary; combat approach deliberately excludes it.
 const candidates=Array.from({length:25},(_,i)=>({x:Math.floor(drop.x)+.5+i%5-2,y:Math.floor(drop.y)+.5+Math.floor(i/5)-2})).filter(p=>Math.hypot(p.x-drop.x,p.y-drop.y)<=rewards.pickupRange&&sight(p,drop,this.region)).sort((a,b)=>Math.hypot(a.x-this.local.x,a.y-this.local.y)-Math.hypot(b.x-this.local.x,b.y-this.local.y));
 for(const p of candidates){const route=pathfind(this.local,p,this.region,this.occupied());if(route.length)return route;}return [];
 }
 approachResource(id:string){
 if(!this.entryReady||this.traveling||this.fighter.hp<=0||document.querySelector('dialog[open]'))return;const target=id==='workbench'?this.region==='elderwood'?craftingBench:undefined:resourceTarget(id);if(!target||('region'in target&&target.region!==this.region))return;
 this.selected='';this.cast('stop');this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;if('skill'in target&&professionLevel(this.bag?.professions?.[target.skill]??0)<target.level){notice(`Requires ${target.skill} level ${target.level}.`);return;}this.pendingResource=id==='workbench'?undefined:id;this.pendingWorkbench=id==='workbench';this.resourceRouteAt=0;if('water'in target&&target.water){const ring=this.add.ellipse(target.x*64,target.y*64,42,20).setStrokeStyle(2,0x97e4ff).setDepth(9998);this.fxObjects.add(ring);this.tweens.add({targets:ring,alpha:0,scale:1.4,duration:1100,onComplete:()=>{this.fxObjects.delete(ring);ring.destroy();}});}
 }
 approachLoot(id:string){
 if(!this.entryReady||this.traveling||this.fighter.hp<=0||document.querySelector('dialog[open]'))return;
 const drop=this.bag?.drops.find(d=>d.id===id&&(d.region??'woods')===this.region);if(!drop)return;
 this.selected='';this.cast('stop');this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=id;this.lootRouteAt=0;
 }
 pickupNearest(){const nearest=this.bag?.drops.filter(d=>(d.region??'woods')===this.region).sort((a,b)=>Math.hypot(a.x-this.local.x,a.y-this.local.y)-Math.hypot(b.x-this.local.x,b.y-this.local.y))[0];if(nearest)this.approachLoot(nearest.id);else notice('No loot nearby. Defeat a monster to earn EXP and leave a bundle.');}
 openInventory(shop:boolean){
 this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;
 if(shop&&(this.region!=='elderwood'||Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)>merchant.range)){notice('Walk closer to Mara the Trader.');return;}
 if(this.fighter.hp<=0)return;const dialog=document.querySelector<HTMLDialogElement>('#inventory-dialog')!;document.querySelector<HTMLDialogElement>('#portal-dialog')!.close();document.querySelector<HTMLDialogElement>('#character-dialog')!.close();this.shopOpen=shop;this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();document.querySelector('#inventory-title')!.textContent=shop?merchant.name:'Your inventory';document.querySelector<HTMLElement>('#shop-controls')!.hidden=!shop;document.querySelector('#inventory-feedback')!.textContent='';this.renderInventory();if(!dialog.open)dialog.showModal();
 }
 renderInventory(){
 const bag=this.bag;if(!bag)return;document.querySelector('#inventory-summary')!.textContent=`${bag.gold} gold · ${bag.usedSlots} / ${bag.capacity} bag slots${bag.usedSlots>bag.capacity?' · Over capacity: sell items to make room':''} · Level ${bag.level}`;
 const key=JSON.stringify([bag.inventory,bag.weapon,bag.equipment,bag.ownedWeapons,bag.ownedEquipment,bag.gold,bag.level,bag.gear,bag.equippedGear,this.shopOpen]);if(key===this.inventoryRenderKey)return;this.inventoryRenderKey=key;
 const equipped=document.querySelector('#equipment-slots')!,owned=document.querySelector('#equipment-items')!;equipped.replaceChildren();owned.replaceChildren();
 document.querySelector('#equipment-stats')!.textContent=`${bag.armor} armor · ${bag.weaponAttack} attack · ${weapons[bag.weapon].name}`;
 const makeItem=(id:string,name:string,detail:string,action?:()=>void)=>{const element=document.createElement(action?'button':'div');if(element instanceof HTMLButtonElement){element.type='button';element.addEventListener('click',action!);}element.className='equipment-item';element.append(itemSprite(id,name));const title=document.createElement('strong');title.textContent=name;const text=document.createElement('span');text.textContent=detail;element.append(title,text);return element;};
 const appendOwned=(element:HTMLElement,id:string,active:boolean)=>{if(this.shopOpen&&!active){const wrapper=document.createElement('div');wrapper.className='owned-equipment-entry';const sell=document.createElement('button');sell.type='button';sell.dataset.sellItem=id;sell.className='sell-owned-button';sell.textContent=`Sell · ${catalogueSellPrice(id as keyof typeof equipmentItems)} gold`;sell.addEventListener('click',()=>this.economyAction({kind:'sell-equipment',item:id}));wrapper.append(element,sell);owned.append(wrapper);}else owned.append(element);};
 const weaponGear=bag.gear.find(g=>g.id===bag.equippedGear.weapon);equipped.append(makeItem(bag.weapon,weaponGear?gearName(weaponGear):weapons[bag.weapon].name,'Weapon',weaponGear?()=>this.economyAction({kind:'unequip-gear',item:weaponGear.id}):undefined));
 for(const [slot,label] of Object.entries(equipmentSlots)){
 const id=bag.equipment[slot as EquipmentSlot];const rolled=bag.gear.find(g=>g.id===bag.equippedGear[slot as GearSlot]);const name=rolled?gearName(rolled):id?equipmentItems[id].name:'Empty';const element=makeItem(id??'',name,id?`${label} · Tap to unequip`:label,id?()=>this.economyAction({kind:'unequip-item',slot}):undefined);element.setAttribute('aria-label',`${label}: ${name}${id?', unequip':''}`);element.dataset.slot=slot;equipped.append(element);
 }
 for(const id of bag.ownedWeapons){const active=bag.weapon===id&&!bag.equippedGear.weapon;const element=makeItem(id,weapons[id].name,active?'Equipped':`${weapons[id].attack} base attack · Equip`,()=>this.economyAction({kind:'equip',weapon:id}));(element as HTMLButtonElement).disabled=active;element.dataset.item=id;element.classList.toggle('is-equipped',active);appendOwned(element,id,active);}
 for(const id of bag.ownedEquipment){const definition=equipmentItems[id],active=bag.equipment[definition.slot]===id&&!bag.equippedGear[definition.slot];const element=makeItem(id,definition.name,`${definition.armor} armor · ${active?'Unequip':'Equip'}`,()=>this.economyAction(active?{kind:'unequip-item',slot:definition.slot}:{kind:'equip-item',item:id}));element.dataset.item=id;element.classList.toggle('is-equipped',active);appendOwned(element,id,active);}
 const loot=document.querySelector('#loot-equipment-items')!;loot.replaceChildren();document.querySelector('#loot-equipment-summary')!.textContent=`Monster equipment · ${bag.gear.length} items`;
 for(const gear of bag.gear){const definition=gearDefinition(gear.base),stats=gearStats(gear),slot=gearSlot(gear.base),active=bag.equippedGear[slot]===gear.id,rarity=gear.rarity?rarityDefinitions[gear.rarity]:null,card=makeItem(gear.base,gearName(gear),gear.rarity?`${stats.attack?`${stats.attack} attack`:`${stats.armor} armor`} · Level ${definition.level} · ${active?'Equipped':'In bag'}`:'Identify to reveal rarity and bonuses');card.classList.add('loot-gear');card.classList.toggle('unidentified',!gear.rarity);card.dataset.gear=gear.id;if(rarity)card.style.setProperty('--rarity-color',rarity.color);
 const comparison=compareGear(gear,bag);
 if(comparison&&!active){const text=document.createElement('span');text.className='gear-comparison';const signed=(n:number)=>`${n>0?'+':''}${n}`;const changes=[`${signed(comparison.attack||comparison.armor)} ${slot==='weapon'?'attack':'armor'}`,...Object.entries(comparison.bonuses).filter(([,v])=>v!==0).map(([id,v])=>`${signed(v)} ${attributeDefinitions[id as AttributeId].name}`)];text.textContent=`Compared with ${comparison.currentName}: ${changes.join(' · ')}`;card.append(text);
 if(comparison.weapon){const {before,after,beforeAttack,afterAttack}=comparison.weapon,detail=document.createElement('span');detail.className='gear-comparison';detail.textContent=`Weapon attack/sec ${ (beforeAttack/before.cooldown).toFixed(1)} → ${(afterAttack/after.cooldown).toFixed(1)} · Range ${before.range} → ${after.range}${before.skill!==after.skill?` · Uses ${after.skill} skill instead of ${before.skill}`:''}`;card.append(detail);}}
 if(gear.rarity&&this.pendingIdentifications.delete(gear.id)){card.classList.add('gear-revealed');const reveal=document.querySelector<HTMLElement>('#identification-reveal')!;reveal.hidden=false;reveal.style.setProperty('--rarity-color',rarity!.color);reveal.textContent=`Identified: ${gearName(gear)} · ${stats.attack||stats.armor} ${slot==='weapon'?'attack':'armor'} · ${Object.entries(stats.bonuses).filter(([,v])=>v>0).map(([id,v])=>`+${v} ${attributeDefinitions[id as AttributeId].name}`).join(' · ')}`;}
 const bonus=document.createElement('span');bonus.textContent=gear.rarity?Object.entries(stats.bonuses).filter(([,amount])=>amount>0).map(([id,amount])=>`+${amount} ${attributeDefinitions[id as AttributeId].name}`).join(' · '):'?';card.append(bonus);
 const action=document.createElement('button');action.type='button';action.dataset.gearAction=gear.rarity?active?'unequip':'equip':'identify';action.textContent=gear.rarity?active?'Unequip':`Equip${bag.level<definition.level?` · Level ${definition.level}`:''}`:'Identify';action.disabled=!!gear.rarity&&!active&&bag.level<definition.level;action.addEventListener('click',()=>this.economyAction({kind:gear.rarity?active?'unequip-gear':'equip-gear':'identify',item:gear.id}));card.append(action);
 const discard=document.createElement('button');discard.type='button';discard.className='quiet-button';discard.textContent='Discard';discard.disabled=active;discard.dataset.gearAction='discard';discard.addEventListener('click',()=>this.economyAction({kind:'discard-gear',item:gear.id}));card.append(discard);if(this.shopOpen){const sell=document.createElement('button');sell.type='button';sell.dataset.gearAction='sell';sell.disabled=active;sell.textContent=`Sell · ${droppedSellPrice(gear)} gold`;sell.addEventListener('click',()=>this.economyAction({kind:'sell-gear',item:gear.id}));card.append(sell);}loot.append(card);
 }
 const catalogue=document.querySelector('#equipment-catalogue')!,openTiers=new Set(Array.from(catalogue.querySelectorAll<HTMLDetailsElement>('details[open]')).map(d=>d.dataset.tier));catalogue.replaceChildren();
 for(const [tier,definition]of Object.entries(equipmentTiers)){
 const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');details.dataset.tier=tier;details.open=openTiers.has(tier);summary.textContent=`${definition.name} set · Level ${definition.level}`;list.className='equipment-catalogue-grid';details.append(summary,list);
 for(const [id,item]of Object.entries({...equipmentItems,...weapons})){if(item.tier!==tier)continue;const ownedItem=[...bag.ownedEquipment,...bag.ownedWeapons].includes(id as never),stat='armor'in item?`${item.armor} armor`:`${item.attack} attack`;const card=makeItem(id,item.name,`${stat} · ${ownedItem?'Owned':`${item.price} gold`}`,()=>this.economyAction({kind:'buy-equipment',item:id}));card.dataset.buyItem=id;(card as HTMLButtonElement).disabled=ownedItem||bag.level<item.level||bag.gold<item.price;list.append(card);}
 catalogue.append(details);
 }
 const grid=document.querySelector('#inventory-grid')!;grid.replaceChildren();for(let i=0;i<bag.inventory.length+Math.max(0,bag.capacity-bag.usedSlots);i++){const slot=document.createElement('div');slot.className='inventory-slot';const stack=bag.inventory[i];if(stack){slot.append(itemSprite(stack.item,items[stack.item].name));const name=document.createElement('strong');name.textContent=items[stack.item].name;const count=document.createElement('span');count.textContent=`×${stack.quantity}`;slot.append(name,count);if(this.shopOpen){const sell=document.createElement('button');sell.type='button';sell.dataset.sellStack=String(stack.id);sell.textContent=`Sell stack · ${supplySellPrice(stack.item)*stack.quantity} gold`;sell.addEventListener('click',()=>this.economyAction({kind:'sell-supply',item:String(stack.id)}));slot.append(sell);}if(stack.item==='cookedFish'){const eat=document.createElement('button');eat.type='button';eat.textContent='Eat · 30 HP';eat.addEventListener('click',()=>this.economyAction({kind:'food'}));slot.append(eat);}if(stack.item==='potion'){const use=document.createElement('button');use.type='button';use.textContent='Use';use.addEventListener('click',()=>this.economyAction({kind:'potion'}));slot.append(use);}}else slot.textContent='Empty';grid.append(slot);}
 }
 renderRewards(){
 const bag=this.bag;if(!bag)return;
 const fishing=document.querySelector<HTMLElement>('#fishing-status')!;fishing.hidden=!bag.fishing;if(bag.fishing){const remaining=Math.max(0,Math.ceil(bag.fishing.endsAt-bag.time-1e-6)),label=document.querySelector('#fishing-label')!,text=`Fishing… ${remaining}s · Move to cancel`;if(label.textContent!==text)label.textContent=text;const progress=document.querySelector<HTMLProgressElement>('#fishing-progress')!;progress.max=bag.fishing.endsAt-bag.fishing.startedAt;progress.value=Math.max(0,Math.min(progress.max,bag.time-bag.fishing.startedAt));}
 updateProfessionNodes(this.worldObjects,bag,this.local);renderProfessions(bag,this.region==='elderwood'&&Math.hypot(this.local.x-craftingBench.x,this.local.y-craftingBench.y)<=craftingBench.range,r=>this.economyAction(r));
 renderQuests(bag,this.region==='elderwood'&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<=merchant.range,r=>this.economyAction(r));
 document.querySelector('#level-label')!.textContent=`Level ${bag.level} · ${bag.classId==='citizen'?'Citizen':classes[bag.classId].name}`;document.querySelector('#gold-label')!.textContent=`${bag.gold} gold`;document.querySelector('#profile-level')!.textContent=`Level ${bag.level} · ${bag.classId==='citizen'?'Citizen':classes[bag.classId].name}`;
 const spellSelect=document.querySelector<HTMLSelectElement>('#spell-select')!;
 if(spellSelect.dataset.known!==bag.learnedSpells.join(',')){const previous=spellSelect.value;spellSelect.replaceChildren();const bar=document.querySelector('#learned-spells')!;bar.replaceChildren();
 for(const id of bag.learnedSpells){const option=document.createElement('option');option.value=id;option.textContent=spells[id].name;spellSelect.append(option);const button=document.createElement('button');button.dataset.spell=id;button.textContent=spells[id].name;button.title=`${spells[id].cost} mana`;button.addEventListener('click',()=>{spellSelect.value=id;this.cast('nova');});bar.append(button);}
 if(bag.learnedSpells.includes(previous as typeof bag.learnedSpells[number]))spellSelect.value=previous;spellSelect.dataset.known=bag.learnedSpells.join(',');}

 for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('#spell-shop button'))){const id=button.dataset.spell;if(!isSpell(id))continue;const s=spells[id],known=bag.learnedSpells.includes(id);button.hidden=s.classId!=='shared'&&s.classId!==bag.classId;button.disabled=known||!canLearnSpell(id,bag)||bag.gold<s.price;button.textContent=`${s.name} · ${known?'Learned':`${s.price} gold · Level ${s.level} · ${s.cost} mana · ${s.cooldown}s cooldown`}`;}
 const selector=document.querySelector<HTMLSelectElement>('#weapon-select')!,identifiedWeapons=bag.gear.filter(g=>g.rarity&&gearSlot(g.base)==='weapon'),weaponKey=JSON.stringify([bag.ownedWeapons,identifiedWeapons,bag.level]);if(selector.dataset.weapons!==weaponKey){selector.replaceChildren();for(const id of bag.ownedWeapons){const option=document.createElement('option');option.value=id;option.textContent=weapons[id].name;selector.append(option);}for(const gear of identifiedWeapons){const option=document.createElement('option');option.value=`gear:${gear.id}`;option.textContent=gearName(gear);option.disabled=bag.level<gearDefinition(gear.base).level;selector.append(option);}selector.dataset.weapons=weaponKey;}if(document.activeElement!==selector)selector.value=bag.equippedGear.weapon?`gear:${bag.equippedGear.weapon}`:bag.weapon;

 const choose=document.querySelector<HTMLButtonElement>('#choose-class')!;choose.hidden=bag.classId!=='citizen';choose.disabled=bag.level<classRules.unlockLevel;choose.textContent=bag.level>=classRules.unlockLevel?'Choose your class':'Choose class at level 5';
 for(const skill of ['melee','distance','magic','shielding'] as const){const level=bag.skills[skill];document.querySelector(`#skill-${skill}`)!.textContent=`${skill[0].toUpperCase()+skill.slice(1)} ${level} · ${level>=100?'Max':`${bag.skillXp[skill]-skillRequirement(level)} / ${skillRequirement(level+1)-skillRequirement(level)} EXP`}`;}
 if(bag.classId!=='citizen')document.querySelector<HTMLDialogElement>('#class-dialog')!.close();
 document.querySelector('#attribute-summary')!.textContent=`Attributes · ${bag.attributePoints} points available`;
 for(const [id,definition]of Object.entries(attributeDefinitions)){document.querySelector(`#attribute-${id}`)!.textContent=`${definition.name} ${bag.attributes[id as AttributeId]}${bag.effectiveAttributes[id as AttributeId]>bag.attributes[id as AttributeId]?` +${bag.effectiveAttributes[id as AttributeId]-bag.attributes[id as AttributeId]}`:''}`;document.querySelector<HTMLButtonElement>(`[data-attribute="${id}"]`)!.disabled=bag.attributePoints<1||bag.attributes[id as AttributeId]>=attributeRules.cap||this.fighter.hp<=0;}
 document.querySelector('#attribute-effects')!.textContent=`${maxHealth(bag.effectiveAttributes)} maximum HP · ${maxMana(bag.effectiveAttributes)} maximum mana. Strength boosts melee, Dexterity distance, Intelligence magic. 3 points per level.`;
 const exp=document.querySelector<HTMLProgressElement>('#experience')!;exp.max=Math.max(1,bag.nextXp-bag.levelXp);exp.value=bag.level>=rewards.levelCap?exp.max:bag.xp-bag.levelXp;exp.title=`${bag.xp} total EXP`;document.querySelector('#xp-label')!.textContent=bag.level>=rewards.levelCap?'Level cap':`${bag.xp-bag.levelXp} / ${bag.nextXp-bag.levelXp} EXP`;
 if(bag.xp>this.lastXp){notice(`+${bag.xp-this.lastXp} EXP · Level ${bag.level} · Collect your spoils.`);this.lastXp=bag.xp;}
 const visible=new Set<string>();for(const drop of bag.drops.filter(d=>(d.region??'woods')===this.region)){visible.add(drop.id);if(this.dropViews.has(drop.id))continue;const glow=this.add.ellipse(0,5,48,22,drop.gear?0xb6a0ff:0xffd475,.16).setStrokeStyle(2,drop.gear?0xcebcff:0xffdf94,.8);const glyph=this.add.graphics();glyph.fillStyle(0x352f20,.8);glyph.fillEllipse(0,6,34,14);glyph.fillStyle(0xe2bd65);glyph.fillRoundedRect(-12,-13,24,24,6);glyph.lineStyle(2,0xffe3a0);glyph.strokeRoundedRect(-12,-13,24,24,6);const label=this.add.text(0,-28,drop.gear?'Spoils · Unidentified gear':'Monster spoils',{fontSize:'11px',color:'#ffe5ad',backgroundColor:'#24392d'}).setOrigin(.5);const zone=this.add.zone(0,0,56,56).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.approachLoot(drop.id);});const view=this.add.container(drop.x*64,drop.y*64,[glow,glyph,label,zone]).setData('glow',glow).setDepth(drop.y*64+1);this.dropViews.set(drop.id,view);}
 for(const [id,view] of this.dropViews){if(!visible.has(id)){view.destroy();this.dropViews.delete(id);}else{const glow=view.getData('glow') as Phaser.GameObjects.Ellipse;glow.setAlpha(.55+.25*Math.sin(this.time.now/350)).setScale(1+.1*Math.sin(this.time.now/350));}}
 }
 cast(kind:'bolt'|'nova'|'stop'){
 if(kind==='stop'){this.route=[];this.chaseAt=0;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;}
 if(document.querySelector('dialog[open]')!==null||this.traveling||this.fighter.hp<=0)return;
 const spell=document.querySelector<HTMLSelectElement>('#spell-select')!.value;if(kind==='nova'&&!isSpell(spell)){notice('Learn a spell from Mara first.');return;}
 if(kind!=='stop'&&!(kind==='nova'&&spell==='mend')&&!this.selected){notice('Click or tap a monster to select it.');return;}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,stepX:this.local.stepX,stepY:this.local.stepY,region:this.region});if(!(kind==='nova'?this.sim.castSpell('local',this.fighter,spell,this.selected,this.economy.profiles.get('local')):this.sim.action('local',this.fighter,kind,this.selected))&&kind!=='stop')notice('Spell unavailable. Check learned spells, target range, mana, cooldown and sanctuary.');}
 else if(this.online)this.room?.send('combat',{kind:kind==='nova'?'spell':kind,spell,target:this.selected});
 this.autoAttack=kind==='bolt';if(kind==='stop')this.autoAttack=false;
 }
 effect(event:CombatEvent){
 if(event.region!==this.region)return;
 if(event.kind==='bolt'||event.kind==='arrow'){
 const arrow=event.kind==='arrow',ink=this.add.graphics();ink.lineStyle(arrow?3:5,arrow?0xd1a968:0x66bfff,.9);ink.lineBetween(-16,0,5,0);
 if(arrow){ink.fillStyle(0xf5e9c5);ink.fillTriangle(12,0,2,-5,2,5);ink.lineStyle(2,0xe9d9ac);ink.lineBetween(-15,0,-20,-5);ink.lineBetween(-15,0,-20,5);}
 else{ink.fillStyle(0xaeeaff,.25);ink.fillCircle(0,0,11);ink.fillStyle(0xf1fcff);ink.fillCircle(0,0,4);}
 const tx=(event.toX??event.x)*64,ty=(event.toY??event.y)*64-25;
 ink.setPosition(event.x*64,event.y*64-25).setRotation(Math.atan2(ty-ink.y,tx-ink.x)).setDepth(9999);this.fxObjects.add(ink);
 this.tweens.add({targets:ink,x:tx,y:ty,duration:Math.max(50,Math.hypot(tx-ink.x,ty-ink.y)/64/(event.speed??C.bolt.speed)*1000),onComplete:()=>{this.fxObjects.delete(ink);ink.destroy();}});
 }
 if(event.kind==='warning'){
 const g=this.add.graphics().setDepth(9997);g.lineStyle(3,0xffbb69,.95);g.fillStyle(0xec8451,.17);
 const x=event.x*64,y=event.y*64,tx=(event.toX??event.x)*64,ty=(event.toY??event.y)*64;
 if(Math.hypot(tx-x,ty-y)<2){g.fillCircle(x,y,(event.radius??1)*64);g.strokeCircle(x,y,(event.radius??1)*64);}
 else{const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy),nx=-dy/d*(event.radius??.6)*64,ny=dx/d*(event.radius??.6)*64;g.fillPoints([{x:x+nx,y:y+ny},{x:tx+nx,y:ty+ny},{x:tx-nx,y:ty-ny},{x:x-nx,y:y-ny}],true);g.lineBetween(x,y,tx,ty);g.strokeCircle(tx,ty,(event.radius??.6)*64);}
 this.fxObjects.add(g);this.tweens.add({targets:g,alpha:.4,duration:(event.speed??.7)*1000,onComplete:()=>{this.fxObjects.delete(g);g.destroy();}});
 }
 if(event.kind==='venom'||event.kind==='shard'){const orb=this.add.circle(event.x*64,event.y*64-24,7,event.kind==='shard'?0x75dfff:0xb2d75d).setStrokeStyle(2,event.kind==='shard'?0xe4f8ff:0xe3e9a0).setDepth(9999);this.fxObjects.add(orb);this.tweens.add({targets:orb,x:(event.toX??event.x)*64,y:(event.toY??event.y)*64,duration:Math.hypot((event.toX??event.x)-event.x,(event.toY??event.y)-event.y)/(event.speed??7)*1000,onComplete:()=>{this.fxObjects.delete(orb);orb.destroy();}});}
 if(event.kind==='charge'){const dust=this.add.ellipse((event.toX??event.x)*64,(event.toY??event.y)*64,70,28,0xc2a16b,.5).setDepth(9998);this.fxObjects.add(dust);this.tweens.add({targets:dust,alpha:0,scale:1.8,duration:400,onComplete:()=>{this.fxObjects.delete(dust);dust.destroy();}});}
 if(event.kind==='melee'){const slash=this.add.circle(event.x*64,event.y*64-20,22,0xf1ddac,.2).setStrokeStyle(3,0xf6e8bf).setDepth(9999);this.fxObjects.add(slash);this.tweens.add({targets:slash,alpha:0,scale:1.5,duration:200,onComplete:()=>{this.fxObjects.delete(slash);slash.destroy();}});}
 if(event.kind==='nova'){const ring=this.add.circle(event.x*64,event.y*64,(event.radius??C.nova.radius)*64,0x9f95ff,.22).setStrokeStyle(4,0xd1beff).setDepth(9998);this.fxObjects.add(ring);this.tweens.add({targets:ring,alpha:0,scale:1.15,duration:650,onComplete:()=>{this.fxObjects.delete(ring);ring.destroy();}});}
 if(event.kind==='block'){const text=this.add.text(event.x*64,event.y*64-88,`Blocked ${event.damage}`,{fontSize:'13px',color:'#9ddcff',stroke:'#142a38',strokeThickness:3}).setDepth(10000);this.fxObjects.add(text);this.tweens.add({targets:text,y:text.y-24,alpha:0,duration:700,onComplete:()=>{this.fxObjects.delete(text);text.destroy();}});}
 if(event.kind==='hit'){
 const impact=this.add.graphics().setPosition(event.x*64,event.y*64-30).setDepth(9999);impact.lineStyle(3,0xffe1ac,.95);
 for(let i=0;i<6;i++){const angle=i*Math.PI/3;impact.lineBetween(Math.cos(angle)*6,Math.sin(angle)*6,Math.cos(angle)*16,Math.sin(angle)*16);}
 this.fxObjects.add(impact);this.tweens.add({targets:impact,scale:1.7,alpha:0,duration:180,onComplete:()=>{this.fxObjects.delete(impact);impact.destroy();}});
 }
 if(event.kind==='hit'||event.kind==='heal'){const number=this.add.text(event.x*64,event.y*64-65,`${event.kind==='heal'?'+':'−'}${event.damage}`,{fontSize:'20px',color:event.kind==='heal'?'#a9edaa':'#ffd19c',stroke:'#1b292b',strokeThickness:3}).setOrigin(.5).setDepth(10000);this.fxObjects.add(number);this.tweens.add({targets:number,y:number.y-30,alpha:0,duration:800,onComplete:()=>{this.fxObjects.delete(number);number.destroy();}});}
 }
 renderCombat(delta:number){
 const wolves=this.preview?this.sim.wolves:this.room?.state?.wolves;
 const visible=new Set<string>();
 if(combatRegion(this.region)&&wolves)wolves.forEach((w:Wolf,id:string)=>{if(monsterRegion(w)!==this.region)return;
 const kind=monsterKind(w.kind),stats=monsters[kind],animated=animatedMonster(kind);let view=this.wolfViews.get(id);
 if(w.hp<=0){if(view&&animated&&!view.getData('defeated')){view.setData('defeated',true);const original=view.getData('sprite') as Phaser.GameObjects.Sprite;
 const corpse=this.add.sprite(view.x,view.y,original.texture.key).setOrigin(.5,1).setScale(animated.scale).setDepth(view.y);playMonster(corpse,animated.kind,'death',w.facing);this.fxObjects.add(corpse);
 this.tweens.add({targets:corpse,alpha:0,delay:850,duration:550,onComplete:()=>{this.fxObjects.delete(corpse);corpse.destroy();}});}return;}
 visible.add(id);
 const painted=!animated&&this.textures.exists(generatedMonsters.key),paint=kind in generatedMonsters.frames?generatedMonsters.frames[kind as keyof typeof generatedMonsters.frames]:undefined;
 if(!view){const sprite=this.add.sprite(0,0,animated?`${animated.key}-down-0`:generatedMonsters.key,animated?undefined:kind).setOrigin(.5,.95).setScale(kind==='wolf'?.2:kind==='bear'?.95:.6);if(painted&&paint){sprite.setTexture(generatedMonsters.key,kind).setOrigin(.5,1).setScale(paint.width/paint.w);sprite.setData('paintScale',paint.width/paint.w);}if(animated)sprite.setOrigin(.5,1).setScale(animated.scale);const health=this.add.graphics();const ring=this.add.ellipse(0,-1,stats.boss?116:70,stats.boss?38:24,0xdeb96d,.12).setStrokeStyle(2,0xe7c77e,.85).setVisible(false);const label=this.add.text(0,animated?-animated.height-12:painted?(kind==='bear'?-198:kind==='boar'?-130:-96):kind==='bear'?-150:-92,`${stats.name} · Lv ${stats.level}${stats.boss?' · BOSS':''}`,{fontSize:'12px',color:'#f5dfbd',backgroundColor:'#203a31'}).setOrigin(.5);view=this.add.container(w.x*64,w.y*64,[ring,sprite,health,label]).setData('sprite',sprite).setData('health',health).setData('ring',ring).setData('hp',w.hp).setData('hitWidth',animated?animated.width:painted&&paint?paint.width+12:110).setData('hitHeight',animated?animated.height:painted&&paint?paint.h*paint.width/paint.w+12:100);const zone=this.add.zone(0,animated?-animated.height/2:painted&&paint?-paint.h*paint.width/paint.w/2:-30,view.getData('hitWidth'),view.getData('hitHeight')).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target!==this.game.canvas||pointer.rightButtonDown())return;this.selected=id;this.route=[];this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.chaseAt=0;this.cast('bolt');notice('Approaching target · Auto-attack in weapon range');});view.add(zone);this.wolfViews.set(id,view);}
 const moving=w.mode==='chase'||w.mode==='return',sprite=view.getData('sprite') as Phaser.GameObjects.Sprite;if(view.getData('mode')==='windup'&&w.mode==='attack')view.setData('strikeUntil',this.time.now+220);view.setData('mode',w.mode);const striking=w.mode==='windup'||this.time.now<(view.getData('strikeUntil')??0);if(animated){
 const previousMode=view.getData('animationMode'),now=this.time.now;
 if(w.mode==='attack'&&(previousMode!=='attack'||now>=(view.getData('nextStrike')??0))){view.setData('nextStrike',now+stats.cooldown*1000);view.setData('attackUntil',now+330);}
 view.setData('animationMode',w.mode);const brace=w.mode==='windup'?1+.025*Math.sin(now/65):1;sprite.setScale(animated.scale*brace,animated.scale/brace).setY(0).setFlipX(false);
 playMonster(sprite,animated.kind,now<(view.getData('attackUntil')??0)?'attack':moving?'walk':'idle',w.facing);
 }else if(painted&&paint){sprite.anims.stop();const scale=sprite.getData('paintScale') as number,phase=this.time.now/(moving?85:270),bob=moving?Math.abs(Math.sin(phase))*3:Math.sin(phase)*.8;const pulse=striking?Math.sin(this.time.now/75)*.025:0;sprite.setScale(scale*(1+pulse),scale*(1-pulse+(moving?Math.sin(phase)*.018:0))).setY(-bob).setFlipX(w.facing==='left');}const previous=view.getData('hp') as number;if(w.hp<previous)view.setData('flashUntil',this.time.now+150);view.setData('hp',w.hp);const ready=inAttackRange(this.local,w,weapons[this.bag?.weapon??this.fighter.weapon].range)&&sight(this.local,w,this.region)&&!this.sim.safe({...this.local,region:this.region});
 const ring=view.getData('ring') as Phaser.GameObjects.Ellipse;ring.setVisible(this.selected===id||w.mode==='windup').setStrokeStyle(w.mode==='windup'?3:2,w.mode==='windup'?0xff925f:ready?0xa9e5ae:0xe7c77e,.9).setScale(w.mode==='windup'?1+.08*Math.sin(this.time.now/65):1);sprite.setAngle(0);view.x+=(w.x*64-view.x)*(1-Math.exp(-delta/70));view.y+=(w.y*64-view.y)*(1-Math.exp(-delta/70));view.setDepth(view.y);sprite.setTint(this.time.now<(view.getData('flashUntil')??0)?0xff8c7e:w.mode==='windup'?0xffcb8d:this.selected===id?0xffe4aa:0xffffff);const bar=view.getData('health') as Phaser.GameObjects.Graphics;bar.y=animated?70-animated.height:painted?(kind==='bear'?-109:kind==='boar'?-44:-14):kind==='bear'?-52:-10;bar.clear();bar.fillStyle(0x162727);bar.fillRoundedRect(-30,-73,60,6,3);const trail=Math.max(w.hp,(view.getData('trailHp')??w.hp)-delta*stats.hp/900);view.setData('trailHp',trail);bar.fillStyle(0xe4b177);bar.fillRoundedRect(-30,-73,60*trail/stats.hp,6,3);bar.fillStyle(0xbacb85);bar.fillRoundedRect(-30,-73,60*w.hp/stats.hp,6,3);
 });
 for(const [id,view] of this.wolfViews)if(!visible.has(id)){view.destroy();this.wolfViews.delete(id);if(this.selected===id)this.selected='';}
 const target=wolves?.get(this.selected);document.querySelector<HTMLElement>('#spell-bar')!.hidden=!combatRegion(this.region)||!target||monsterRegion(target)!==this.region||target.hp<=0;const targetStatus=!target?'':target.mode==='return'?'Returning':this.sim.safe({...this.local,region:this.region})?'Leave portal sanctuary':!sight(this.local,target,this.region)?'Blocked':inAttackRange(this.local,target,weapons[this.bag?.weapon??this.fighter.weapon].range)?'In range':'Approaching';
 document.querySelector('#combat-target')!.textContent=target&&target.hp>0?`${monsters[monsterKind(target.kind)].name} · ${Math.ceil(target.hp)} / ${monsters[monsterKind(target.kind)].hp} · ${targetStatus}`:'Select a monster';
 (document.querySelector('#health') as HTMLMeterElement).max=maxHealth(this.fighter.attributes);(document.querySelector('#mana') as HTMLMeterElement).max=maxMana(this.fighter.attributes);(document.querySelector('#health') as HTMLMeterElement).value=this.fighter.hp;(document.querySelector('#mana') as HTMLMeterElement).value=this.fighter.mana;document.querySelector('#character-health')!.textContent=`${Math.ceil(this.fighter.hp)} / ${maxHealth(this.fighter.attributes)} HP`;document.querySelector('#character-mana')!.textContent=`${Math.floor(this.fighter.mana)} / ${maxMana(this.fighter.attributes)} MP`;
 document.querySelector('#death-notice')!.textContent=this.fighter.hp<=0?'Defeated · Returning to Elderwood…':'';
 this.avatar?.setAlpha(this.fighter.hp<=0?.35:1);
 }
 drawMap(){
 const bounds=regionSize(this.region);this.cameras.main.setBounds(0,0,bounds.width*64,bounds.height*64);
 this.terrainCleanup?.();this.terrainCleanup=undefined;
 for(const obj of this.worldObjects)obj.destroy();
 const existing=new Set(this.children.list),config=regions[this.region];
 this.cameras.main.setBackgroundColor('#233c38');this.terrainCleanup=drawTiledTerrain(this,this.region);
 const grid=gridMap(this.region),mapConfig={width:grid.width*48,height:grid.height*48,worldWidth:grid.width,worldHeight:grid.height,offsetY:0},mapObjects=grid.objects;
 const illustratedMap=true;
 if(illustratedMap){
 for(const object of mapObjects){const sx=mapConfig.worldWidth*64/mapConfig.width,sy=mapConfig.worldHeight*64/mapConfig.height;
 if((this.region==='caverns'||this.region==='caverns-depths')&&(object.key.includes('crystal')||object.key.includes('lantern')))this.add.ellipse((object.x+object.w/2)*sx,(object.y+object.h*.9)*sy+mapConfig.offsetY*64,object.w*sx*1.4,object.h*sy*.35,0x6ddcff,.09).setDepth(-2);
 this.add.image(object.x*sx,object.y*sy+mapConfig.offsetY*64,object.key).setOrigin(0).setDisplaySize(object.w*sx,object.h*sy).setDepth(object.key==='depot-floor'?-10:object.footY*sy+mapConfig.offsetY*64).setData('depotFront',object.key.startsWith('depot-wall')&&object.y===8*48);}
 }else{
 for(let x=0;x<WORLD.width;x++)for(const y of [0,23])this.tree(x*64+32,y*64+32);
 for(let y=1;y<23;y++)for(const x of [0,31])this.tree(x*64+32,y*64+32);
 }
 if(!illustratedMap)this.add.text(16.5*64,12.2*64,config.name.toUpperCase(),{fontFamily:'Georgia',fontSize:'18px',color:'#535d42',letterSpacing:3}).setOrigin(.5);
 for(const b of config.obstacles){const rock=this.add.graphics();rock.fillStyle(config.accent,.45);rock.fillRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.lineStyle(3,config.accent,.6);rock.strokeRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.setDepth((b.y+b.h)*64);}
 this.portalGlow=undefined;
 if(!isLowerFloor(this.region)){
 const x=portalFor(this.region).x*64,y=portalFor(this.region).y*64;
 const illustratedPortal=this.textures.exists('elderwood-portal');
 const portal=this.add.graphics();
 if(illustratedPortal){portal.fillStyle(0xc576ff,.12);portal.fillEllipse(x,y,160,48);portal.setDepth(-1);}
 this.portalGlow=portal;
 const portalArt=illustratedMap?mapObjects.find(object=>object.key.endsWith('-portal')):undefined;
 const portalScale=mapConfig.worldWidth*64/mapConfig.width;
 const portalWidth=(portalArt?.w??200)*portalScale,portalHeight=(portalArt?.h??179)*portalScale;
 const portalCenterX=portalArt?(portalArt.x+portalArt.w/2)*portalScale:x;
 const portalTop=portalArt?portalArt.y*portalScale+mapConfig.offsetY*64:y-portalHeight;
 if(!illustratedMap)this.add.image(portalCenterX,portalTop,'elderwood-portal').setOrigin(.5,0).setDisplaySize(portalWidth,portalHeight).setDepth(y);
 this.add.text(portalCenterX,portalTop-18,'WAYFARER PORTAL',{fontFamily:'Georgia',fontSize:'14px',color:'#e9e4cb',backgroundColor:'#193b36'}).setOrigin(.5).setDepth(y+1);
 const target=this.add.zone(portalCenterX,portalTop+portalHeight/2,portalWidth,portalHeight).setInteractive({useHandCursor:true}).setDepth(y+2);
 target.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target!==this.game.canvas)return;this.approachInteraction('portal');});
 }
 if(this.region==='elderwood')for(const box of depotBoxes){const zone=this.add.zone(box.x*64,box.y*64,64,64).setInteractive({useHandCursor:true}).setDepth((box.y+.5)*64+2).setData('depot',box.id);zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.approachDepot(box.id);});}
 for(const stair of stairsFor(this.region)){
 const x=stair.x*64,y=stair.y*64;this.add.text(x,y-(stair.direction==='up'?245:180),stair.label,{fontFamily:'Georgia',fontSize:'14px',color:'#d8d0ff',backgroundColor:'#29233d'}).setOrigin(.5).setDepth(y+1);
 const zone=this.add.zone(x,y-(stair.direction==='up'?95:40),215,stair.direction==='up'?230:175).setInteractive({useHandCursor:true}).setDepth(y+2);zone.setData('stair',stair.id);zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.approachStairs(stair.id);});
 }
 if(this.region==='elderwood'){const trader=this.makeAvatar(0xddc79b,merchant.name,false);trader.setPosition(merchant.x*64,merchant.y*64).setDepth(merchant.y*64);const sprite=trader.getData('sprite') as Phaser.GameObjects.Sprite|undefined;if(sprite&&this.textures.exists(maraAsset.key))sprite.setTexture(maraAsset.key,'idle-down-0').setOrigin(.5,maraAsset.origin).setScale(maraAsset.scale).play('mara-idle-down');const tradeZone=this.add.zone(merchant.x*64,merchant.y*64-30,100,110).setInteractive({useHandCursor:true}).setDepth(merchant.y*64+1);tradeZone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.approachInteraction('trader');});}
 drawProfessionNodes(this,this.region,id=>this.approachResource(id),()=>this.approachResource('workbench'));
 this.worldObjects=this.children.list.filter(obj=>!existing.has(obj));
 document.querySelector('h1')!.textContent=config.name;
 }
 approachDepot(id:string){
 if(!this.entryReady||this.traveling||this.fighter.hp<=0||document.querySelector('dialog[open]'))return;const box=depotBoxes.find(b=>b.id===id);if(!box||this.region!=='elderwood')return;
 this.selected='';this.cast('stop');this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=id;
 if(atDepot({...this.local,region:this.region},id)){this.openDepot(id);return;}
 const routes=gridDirections.map(([dx,dy])=>({x:box.x+dx,y:box.y+dy})).filter(p=>atDepot({...p,region:this.region},id)).map(p=>pathfind(this.local,p,this.region,this.occupied())).filter(r=>r.length);routes.sort((a,b)=>a.length-b.length);this.route=routes[0]??[];if(!this.route.length){this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;notice('No clear route to that Depot box.');}
 }
 openDepot(id:string){if(!atDepot({...this.local,region:this.region},id)||this.fighter.hp<=0)return;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];this.input.keyboard?.resetKeys();this.activeDepot=id;document.querySelector('#depot-feedback')!.textContent='';this.drawDepot(true);document.querySelector<HTMLDialogElement>('#depot-dialog')!.showModal();}
 drawDepot(force=false){if(this.bag&&this.activeDepot)renderDepot(this.bag,this.activeDepot,request=>this.economyAction(request),force);}
 approachStairs(id:string){
 if(!this.entryReady||this.traveling||this.fighter.hp<=0||document.querySelector('dialog[open]'))return;const stair=stairsFor(this.region).find(s=>s.id===id);if(!stair)return;
 this.selected='';this.cast('stop');this.pendingInteraction=undefined;this.pendingStair=id;
 if(availableStair(this.local,this.region,id)){this.useStairs(id);return;}
 this.route=pathfind(this.local,{x:stair.x,y:stair.y+1.8},this.region);if(!this.route.length){this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;notice('No clear path to the stairs.');}
 }
 useStairs(id:string){const stair=availableStair(this.local,this.region,id);if(!stair||this.fighter.hp<=0||this.traveling)return;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];this.input.keyboard?.resetKeys();
 if(this.preview){this.applyTravel(stair.to,{...stair.arrival,stamina:this.local.stamina});return;}
 if(!this.online)return;this.traveling=true;this.pending=[];this.room!.send('stairs',id);notice('Changing depth…');this.travelTimer=setTimeout(()=>{this.traveling=false;notice('Stair travel timed out. Try again.');},5000);
 }
 approachInteraction(kind:'portal'|'trader'){
 if(!this.entryReady||this.traveling||this.fighter.hp<=0||document.querySelector('dialog[open]'))return;
 this.selected='';this.cast('stop');this.pendingInteraction=kind;
 const center=kind==='portal'?portalFor(this.region):merchant,range=kind==='portal'?portalFor(this.region).radius:merchant.range;
 if(Math.hypot(this.local.x-center.x,this.local.y-center.y)<=range){this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];if(kind==='portal')this.openPortal();else this.openInventory(true);return;}
 const targets=kind==='portal'?[portalFor(this.region).arrival]:Array.from({length:12},(_,i)=>({x:merchant.x+Math.cos(i*Math.PI/6)*1.4,y:merchant.y+Math.sin(i*Math.PI/6)*1.4}));
 this.route=targets.map(target=>pathfind(this.local,target,this.region)).filter(route=>route.length).sort((a,b)=>a.length-b.length)[0]??[];
 if(!this.route.length){this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;notice('No clear route to that interaction.');}
 }
 openPortal(){
 if(isLowerFloor(this.region)){notice('Use the stairs to return to the upper floor.');return;}
 if(this.fighter.hp<=0)return;
 if(this.traveling)return;
 if(Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)>portalFor(this.region).radius){notice('Walk closer to the glowing portal, then interact.');return;}
 this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();
 const dialog=document.querySelector<HTMLDialogElement>('#portal-dialog')!,list=document.querySelector('#destinations')!;list.replaceChildren();
 for(const [id,destination] of Object.entries(regions)){if(id===this.region||isLowerFloor(id))continue;const button=document.createElement('button');button.type='button';const name=document.createElement('strong');name.textContent=destination.name;const description=document.createElement('span');description.textContent=destination.description;button.append(name,description);button.addEventListener('click',()=>this.travel(id as RegionId));list.append(button);}
 if(!dialog.open)dialog.showModal();
 }
 travel(destination:RegionId){
 if(!canTravel(this.local,this.region,destination)){notice('Walk closer to the portal to travel.');return;}
 document.querySelector<HTMLDialogElement>('#portal-dialog')!.close();this.route=[];this.input.keyboard?.resetKeys();
 if(this.preview){this.applyTravel(destination,{...portalFor(destination).arrival,stamina:this.local.stamina});return;}
 if(!this.online){notice('Connect to the server before traveling.');return;}
 this.traveling=true;this.pending=[];this.room!.send('travel',destination);notice('Traveling…');
 this.travelTimer=setTimeout(()=>{this.traveling=false;notice('Travel request timed out. Try the portal again.');},5000);
 }
 applyTravel(region:RegionId,position:Motion){
 clearTimeout(this.travelTimer);document.querySelectorAll<HTMLDetailsElement>('nav details').forEach(drawer=>drawer.open=false);document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog=>{if(dialog.id!=='login-dialog')dialog.close();});for(const view of this.dropViews.values())view.destroy();this.dropViews.clear();for(const obj of this.fxObjects){this.tweens.killTweensOf(obj);obj.destroy();}this.fxObjects.clear();this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.traveling=false;this.region=region;this.selected='';this.autoAttack=false;this.fighter.target='';this.fighter.auto=false;this.fighter.region=region;this.fighter.x=position.x;this.fighter.y=position.y;for(const view of this.wolfViews.values())view.destroy();this.wolfViews.clear();this.local={x:position.x,y:position.y,stamina:position.stamina,stepX:position.x,stepY:position.y};this.pending=[];this.route=[];this.walking=false;this.touch={x:0,y:0};this.input.keyboard?.resetKeys();this.drawMap();
 for(const obj of this.peers.values())obj.destroy();this.peers.clear();
 this.avatar.setPosition(this.local.x*64,this.local.y*64);this.cameras.main.centerOn(this.avatar.x,this.avatar.y);notice(isLowerFloor(region)?`${regions[region].name}. Click the stairs to return to the upper floor.`:`Arrived in ${regions[region].name}.`);
 }
 tree(x:number,y:number){this.add.image(x,y,'elderwood-oak').setOrigin(.5,1).setDisplaySize(88,112).setDepth(y);}
 occupied(){const peers:any[]=[];this.room?.state?.players?.forEach((p:any,id:string)=>{if(id!==this.room?.sessionId)peers.push(p);});return occupiedCells(this.preview?[...this.sim.wolves.values()]:[...(this.room?.state?.wolves?.values()??[]),...peers],this.region);}
 makeAvatar(color:number,label:string,player=true){const shadow=this.add.graphics();shadow.fillStyle(0x102823,.3);shadow.fillEllipse(0,0,30,13);const text=this.add.text(0,-94,label,{fontFamily:'sans-serif',fontSize:'12px',color:'#fff5d7',backgroundColor:'#203b36'}).setOrigin(.5);if(player){const skin=new SkinAvatar(this);skin.pose({skin:'citizen',wings:'none',aura:'none'},'down',false,0);return this.add.container(0,0,[shadow,skin,text]).setData('skinAvatar',skin).setData('sprite',skin.sprite);}const sprite=this.add.sprite(0,0,'citizen-down','frame-0').setOrigin(.5,1).setScale(characterStyle.scale);sprite.play('idle-down');return this.add.container(0,0,[shadow,sprite,text]).setData('sprite',sprite);}
 enterWorld(){this.entryReady=true;this.input.keyboard!.enabled=true;this.input.keyboard!.resetKeys();this.accounts?.entered();}
 startPreview(message:string){this.enterWorld();this.online=false;this.preview=true;this.pending=[];document.querySelector('#connection')!.textContent='Local preview · No multiplayer';notice(message);}
 async leaveAccount(){this.pendingIdentifications.clear();const reveal=document.querySelector<HTMLElement>('#identification-reveal');if(reveal){reveal.hidden=true;reveal.textContent='';}this.connectionGeneration++;this.entryReady=false;this.preview=false;this.input.keyboard!.enabled=false;this.switchingAccount=true;this.online=false;this.route=[];this.pending=[];if(this.room){const room=this.room;this.room=undefined;if(room.connection.isOpen)await room.leave(true);}this.switchingAccount=false;}
 async reconnectAccount(){if(this.connectBusy){this.pendingEntry=true;return;}if(this.switchingAccount)return;try{await this.leaveAccount();this.accountLoaded=false;this.lastXp=0;this.economy.leave('local');this.economy.join('local');this.bag=this.economy.snapshot('local',0);this.preview=false;this.fighter=newFighter();this.seq=0;this.applyTravel('elderwood',{...WORLD.spawn,stamina:100});await this.connect();}catch{this.accounts?.failed('Could not switch accounts. Reload to reconnect.');}}
 async connect(){
 if(this.connectBusy)return;this.connectBusy=true;const generation=this.connectionGeneration;this.accounts?.connecting(true);let expectedUser:string|null=null;try{const session=await this.accounts?.session();expectedUser=session?.user.id??null;if(this.accounts?.mode()==='account'&&!session){this.accounts?.failed('Please sign in again to load your character.');return;}
 const configured=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_SERVER_URL;
 const localHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 if(!configured&&!localHost){if(session){document.querySelector('#connection')!.textContent='Account offline · Configure the game server';this.accounts?.failed('Your character cannot load without the multiplayer server.');return;}this.startPreview('Explore Elderwood locally. Multiplayer requires a configured game server.');return;}
 try{const joinedRoom=await new Client(configured||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:2567`).joinOrCreate('elderwood',session?{accessToken:session.access_token}:{});if(generation!==this.connectionGeneration||(this.accounts?.current()?.user.id??null)!==expectedUser){if(joinedRoom.connection.isOpen)await joinedRoom.leave(true);return;}this.room=joinedRoom;this.online=true;this.preview=false;this.accounts?.status(session?'Loading saved character…':'');document.querySelector('#connection')!.textContent='● Connected to Elderwood';const room=this.room;this.room.onStateChange((state:any)=>{if(this.room!==room)return;const p=state.players.get(this.room!.sessionId);if(p){Object.assign(this.fighter,{armor:p.armor,hp:p.hp,mana:p.mana,deadUntil:p.deadUntil,shotAt:p.shotAt,spellAt:p.spellAt,auto:p.auto,weapon:p.weapon,meleeXp:p.meleeXp,distanceXp:p.distanceXp,magicXp:p.magicXp,shieldingXp:p.shieldingXp,shieldArmor:p.shieldArmor,weaponBonus:p.weaponBonus});if(p.region!==this.region)this.applyTravel(p.region,p);this.pending=this.pending.filter(i=>i.seq>p.seq);this.local={x:p.x,y:p.y,stamina:p.stamina,stepX:p.stepX,stepY:p.stepY};for(const input of this.pending)if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region,this.occupied());}const present=new Set<string>();state.players.forEach((other:any,id:string)=>{if(id===this.room!.sessionId||other.region!==this.region)return;present.add(id);if(!this.peers.has(id))this.peers.set(id,this.makeAvatar(0xc5b1e1,'Adventurer').setPosition(other.x*64,other.y*64));const peer=this.peers.get(id)!,stepX=Number.isFinite(other.stepX)?other.stepX-other.x:0,stepY=Number.isFinite(other.stepY)?other.stepY-other.y:0,stepping=other.hp>0&&Math.hypot(stepX,stepY)>.0001;const facing=stepping?(Math.abs(stepX)>Math.abs(stepY)?(stepX>0?'right':'left'):(stepY>0?'down':'up')):(peer.getData('facing')??'down');peer.setData('target',{x:other.x*64,y:other.y*64,moving:stepping,facing}).setData('look',readCosmeticLook(other.look));});for(const [id,obj] of this.peers)if(!present.has(id)){obj.destroy();this.peers.delete(id);}});this.room.onMessage('economy-state',(state:EconomySnapshot)=>{if(this.room!==room)return;if(!this.accountLoaded){if(state.account)this.lastXp=state.xp;this.accountLoaded=true;}this.bag=state;this.fighter.attributes={...state.effectiveAttributes};if(!this.entryReady)this.enterWorld();document.querySelector('#save-status')!.textContent=state.account?(state.account.state==='error'?'Save failed · Reconnect before continuing':state.account.state==='saving'?'Saving…':state.account.savedAt?`Saved at ${new Date(state.account.savedAt).toLocaleTimeString()}`:'Character loaded · Autosave enabled'):'Guest progress is not saved';if(state.account?.state==='ready')this.accounts?.status('');document.querySelector<HTMLSelectElement>('#weapon-select')!.value=state.equippedGear.weapon?`gear:${state.equippedGear.weapon}`:state.weapon;if(document.querySelector<HTMLDialogElement>('#inventory-dialog')!.open)this.renderInventory();});this.room.onMessage('economy-result',(message:string)=>{notice(message);document.querySelector('#inventory-feedback')!.textContent=message;document.querySelector('#depot-feedback')!.textContent=message;});this.room.onMessage('combat-error',(message:string)=>notice(message));this.room.onMessage('combat-event',(event:CombatEvent)=>this.effect(event));this.room.onMessage('travel-complete',()=>{});this.room.onMessage('travel-error',(message:string)=>{clearTimeout(this.travelTimer);this.traveling=false;notice(message);});this.room.onMessage('save-error',(message:string)=>{this.accounts?.status(message);notice(message);document.querySelector('#save-status')!.textContent='Save failed · Reconnect before continuing';});this.room.onLeave(()=>{if(this.switchingAccount||this.room!==room)return;clearTimeout(this.travelTimer);this.traveling=false;this.online=false;this.pending=[];this.entryReady=false;this.input.keyboard!.enabled=false;this.accounts?.failed('Connection lost. Retry to continue your adventure.');document.querySelector('#connection')!.textContent='Disconnected · Retry from login';notice('Connection lost.');});}catch(error){if(generation!==this.connectionGeneration||(this.accounts?.current()?.user.id??null)!==expectedUser)return;if(session){this.online=false;this.preview=false;const message=error instanceof Error?error.message:'Unable to load your saved character.';document.querySelector('#connection')!.textContent='Account offline · Reconnect to play';this.accounts?.failed(message);notice(message);}else this.startPreview('Game server unavailable · Local exploration enabled. Reload after configuring the server to join multiplayer.');}}finally{this.connectBusy=false;this.accounts?.connecting(this.online&&!this.entryReady);if(this.pendingEntry){this.pendingEntry=false;if(this.accounts?.mode())void this.reconnectAccount();}}}
 interact(){const box=depotBoxes.find(b=>atDepot({...this.local,region:this.region},b.id));if(box){this.openDepot(box.id);return;}const stair=stairsFor(this.region).find(s=>availableStair(this.local,this.region,s.id));if(stair){this.useStairs(stair.id);return;}if(this.region==='elderwood'&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<=merchant.range&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)){this.openInventory(true);return;}if(Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)<=portalFor(this.region).radius){this.openPortal();return;}const b=landmarks.find(b=>Math.hypot(this.local.x-(b.x+b.w/2),this.local.y-(b.y+b.h))<3.5);notice(this.region==='elderwood'&&b?`${b.name} — ${b.description}`:'Walk close to the portal or a village entrance, then interact.');}
 update(_time:number,delta:number){if(!this.keys||!this.entryReady)return;let x=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown),y=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown);if(x||y){this.route=[];this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;if(this.selected){this.selected='';this.cast('stop');}}else {x=this.touch.x;y=this.touch.y;}
 if(this.autoAttack&&this.selected&&!x&&!y&&combatRegion(this.region)&&!this.traveling&&!document.querySelector('dialog[open]')){
 const target=(this.preview?this.sim.wolves:this.room?.state?.wolves)?.get(this.selected),weaponRange=weapons[this.bag?.weapon??this.fighter.weapon].range;
 // Stay inside the encounter leash so ranged approaches can actually engage.
 const range=target?Math.min(weaponRange,monsters[monsterKind(target.kind)].leash-.5):weaponRange;
 if(!target||monsterRegion(target)!==this.region||target.hp<=0||target.mode==='return'){this.route=[];this.selected='';this.cast('stop');}
 else if(inAttackRange(this.local,target,range)&&Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)>C.portalSafeRadius&&sight(this.local,target,this.region))this.route=[];
 else if(this.time.now>=this.chaseAt){this.chaseAt=this.time.now+400;this.route=attackPath(this.local,target,range,this.region,this.occupied());}
 }
 if((this.pendingResource||this.pendingWorkbench)&&!document.querySelector('dialog[open]')){
 const target=this.pendingWorkbench?craftingBench:resourceTarget(this.pendingResource??''),actor=this.online?this.room?.state.players.get(this.room.sessionId):this.local;
 if(!target||('region'in target&&target.region!==this.region)||this.fighter.hp<=0||this.traveling){this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];}
 else if(actor&&Math.hypot(actor.x-target.x,actor.y-target.y)<=professionRules.range&&('water'in target&&target.water?fishingCastClear(actor,target,this.region)&&Math.hypot((actor.stepX??actor.x)-actor.x,(actor.stepY??actor.y)-actor.y)<.0001:sight(actor,{x:target.x,y:target.y},this.region))){const id=this.pendingResource,bench=this.pendingWorkbench;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];if(bench){this.openInventory(false);document.querySelector<HTMLDetailsElement>('#professions-panel')!.open=true;}else if(id)this.economyAction({kind:'gather',item:id});}
 else if(this.time.now>=this.resourceRouteAt){this.resourceRouteAt=this.time.now+500;this.route='water'in target&&target.water?fishingShores({...target,region:this.region}).sort((a,b)=>Math.hypot(a.x-this.local.x,a.y-this.local.y)-Math.hypot(b.x-this.local.x,b.y-this.local.y)).map(p=>pathfind(this.local,p,this.region,this.occupied())).find(r=>r.length)??[]:this.lootPath(target);const localReady=Math.hypot(this.local.x-target.x,this.local.y-target.y)<=professionRules.range&&('water'in target&&target.water?fishingCastClear(this.local,target,this.region):sight(this.local,{x:target.x,y:target.y},this.region));if(!this.route.length&&!localReady){this.pendingResource=undefined;this.pendingWorkbench=false;notice('No clear path to that resource.');}}
 }
 if(this.pendingLoot&&!document.querySelector('dialog[open]')){
 const drop=this.bag?.drops.find(d=>d.id===this.pendingLoot&&(d.region??'woods')===this.region);
 if(!drop||this.fighter.hp<=0||this.traveling){this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];}
 else{const actor=this.online?this.room?.state.players.get(this.room.sessionId):this.local;
 if(actor&&Math.hypot(actor.x-drop.x,actor.y-drop.y)<=rewards.pickupRange&&sight(actor,drop,this.region)){
 const id=this.pendingLoot;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];this.economyAction({kind:'pickup',drop:id});
 }else if(this.time.now>=this.lootRouteAt){this.lootRouteAt=this.time.now+500;this.route=this.lootPath(drop);if(!this.route.length&&!(Math.hypot(this.local.x-drop.x,this.local.y-drop.y)<=rewards.pickupRange&&sight(this.local,drop,this.region))){this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;notice('No clear route to that loot.');}}
 }
 }
 const followingRoute=!x&&!y&&this.route.length>0;
 if(this.fighter.hp<=0||document.querySelector('dialog[open]')!==null||this.traveling){x=0;y=0;this.route=[];}
 if(this.portalGlow)this.portalGlow.alpha=.85+Math.sin(_time/450)*.15;
 const previous={...this.local};
 const simulated=this.acc+Math.min(delta,100)>=50;
 this.acc+=Math.min(delta,100);while(this.acc>=50){this.acc-=50;
 // Re-evaluate waypoints on every fixed tick, including frames that simulate
 // two ticks. This prevents overshooting a narrow path on slower devices.
 if(followingRoute){const tolerance=(this.region==='elderwood'||combatRegion(this.region))?.11:.22;while(this.route.length&&Math.hypot(this.route[0].x-this.local.x,this.route[0].y-this.local.y)<tolerance)this.route.shift();const waypoint=this.route[0];if(waypoint){const dx=waypoint.x-this.local.x,dy=waypoint.y-this.local.y,divisor=Math.max(Math.abs(dx),Math.abs(dy));x=dx/divisor;y=dy/divisor;}else{x=0;y=0;}}
 const next=this.route[0];const sprint=(this.keys.SHIFT.isDown||this.sprinting)&&!(this.region==='elderwood'&&next&&Math.hypot(next.x-this.local.x,next.y-this.local.y)<.35);if(this.preview&&this.fighter.hp>0){this.local=move(this.local,{x,y,sprint,seq:0},.05,this.region,this.occupied());}else if(this.online&&!this.traveling){const input={x,y,sprint,seq:++this.seq};if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region,this.occupied());this.pending.push(input);if(this.pending.length>40){this.online=false;document.querySelector('#connection')!.textContent='Disconnected · Reload to reconnect';notice('Server stopped responding. Reload to reconnect.');break;}this.room?.send('input',input);}}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,stepX:this.local.stepX,stepY:this.local.stepY,region:this.region});this.sim.tick(Math.min(delta,100)/1000,[['local',this.fighter]]);this.economy.sync('local',this.fighter);this.economy.process(this.sim.kills.splice(0),new Map([['local',this.fighter]]),this.sim.time);const professionResults=this.economy.professions.results.splice(0);for(const result of professionResults){if(result.id==='local'){notice(result.message);document.querySelector('#inventory-feedback')!.textContent=result.message;}}this.bag=this.economy.snapshot('local',this.sim.time);if(professionResults.length&&document.querySelector<HTMLDialogElement>('#inventory-dialog')!.open)this.renderInventory();if(this.fighter.region!==this.region)this.applyTravel(this.fighter.region,{x:this.fighter.x,y:this.fighter.y,stamina:100});for(const event of this.sim.events.splice(0))this.effect(event);}
 if(this.pendingDepot&&atDepot({...this.local,region:this.region},this.pendingDepot))this.openDepot(this.pendingDepot);
 if(document.querySelector<HTMLDialogElement>('#depot-dialog')!.open)this.drawDepot();
 for(const object of this.worldObjects)if(object.getData('depotFront'))(object as Phaser.GameObjects.Image).setAlpha(this.region==='elderwood'&&this.local.x>5&&this.local.x<14&&this.local.y>2&&this.local.y<9?.35:1);
 if(this.pendingStair&&availableStair(this.local,this.region,this.pendingStair))this.useStairs(this.pendingStair);
 if(this.pendingInteraction){const kind=this.pendingInteraction,target=kind==='portal'?portalFor(this.region):merchant,range=kind==='portal'?portalFor(this.region).radius:merchant.range;if(Math.hypot(this.local.x-target.x,this.local.y-target.y)<=range){this.pendingInteraction=undefined;this.pendingStair=undefined;this.pendingDepot=undefined;this.pendingLoot=undefined;this.pendingResource=undefined;this.pendingWorkbench=false;this.route=[];if(kind==='portal')this.openPortal();else this.openInventory(true);}}
 this.renderCombat(delta);this.renderRewards();
 const blend=1-Math.exp(-delta/55);this.avatar.x+=(this.local.x*64-this.avatar.x)*blend;this.avatar.y+=(this.local.y*64-this.avatar.y)*blend;this.avatar.setDepth(this.avatar.y);
 const finishingStep=Math.hypot((previous.stepX??previous.x)-previous.x,(previous.stepY??previous.y)-previous.y)>.0001;
 if(simulated)this.walking=(this.online||this.preview)&&!!(x||y||finishingStep)&&Math.hypot(this.local.x-previous.x,this.local.y-previous.y)>.00001;
 const stepping=Math.hypot((this.local.stepX??this.local.x)-this.local.x,(this.local.stepY??this.local.y)-this.local.y)>.0001;
 const moving=this.walking&&(this.online||this.preview)&&this.fighter.hp>0&&!this.traveling&&!!(x||y||stepping);
 if(moving&&(x||y))this.facing=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
 const skin=this.avatar.getData('skinAvatar') as SkinAvatar|undefined;if(skin&&this.bag)skin.pose(cosmeticLook(this.bag.cosmetics,this.bag.classId),this.facing,moving,_time);
 const portraitKey=JSON.stringify([this.bag?.classId,this.bag?.cosmetics]);if(portraitKey!==this.portraitKey)this.drawPortraits();if(this.bag)renderWardrobe(this.bag);
 for(const obj of this.peers.values()){const p=obj.getData('target');if(!p)continue;const dx=p.x-obj.x,dy=p.y-obj.y,moving=p.moving===true,facing=p.facing??obj.getData('facing')??'down';obj.setData('facing',facing);const peerSkin=obj.getData('skinAvatar') as SkinAvatar|undefined;if(peerSkin)peerSkin.pose(obj.getData('look')??{skin:'citizen',wings:'none',aura:'none'},facing,moving,_time);obj.x+=dx*blend;obj.y+=dy*blend;obj.setDepth(obj.y);}
 (document.querySelector('#stamina') as HTMLMeterElement).value=this.local.stamina;
 }
}
export const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#233c38',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,...displaySize()},scene:Elderwood,render:{antialias:true,roundPixels:true},input:{activePointers:3}});
window.addEventListener('resize',()=>{const {width,height}=displaySize();game.scale.setGameSize(width,height);const scene=game.scene.getScenes(true)[0] as Elderwood|undefined;if(scene)scene.cameras.main.setZoom(scene.viewZoom*displayDensity());});
