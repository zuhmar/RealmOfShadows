import bagIconUrl from '../../../assets/generated/bag-icon.png?url';
import {generatedSourceSheets,installGeneratedArt} from './generated-art';
import {mapObjectTileAssets} from './map-object-tiles';
import {terrainTileAsset,drawTiledTerrain} from './tiled-terrain';
import {generatedMonsters} from './monster-assets';
import Phaser from 'phaser';
import {displayDensity,displaySize} from './display';
import {PaperDoll} from './paper-doll';
import {setupAccounts,type AccountUI} from './accounts';
import {Client,type Room} from 'colyseus.js';
import {gearDefinition,gearStats,gearName,gearSlot,rarityDefinitions,type GearSlot,attributeDefinitions,attributeRules,maxHealth,maxMana,type AttributeId,regionSize,monsters,monsterKind,monsterRegion,combatRegion,cavernsMap,cavernsObjects,woodsMap,woodsObjects,WORLD,equipmentTiers,readAppearance,equipmentItems,equipmentSlots,type EquipmentSlot,elderwoodMap,elderwoodObjects,landmarks,characterSprite,regions,portalFor,canTravel,combat as C,items,merchant,rewards,weapons,classes,classRules,skillRequirement,spells,canLearnSpell,isSpell,type RegionId,type Facing} from '@realm/game-data';
import {attackPath,sight,move,pathfind,CombatSimulation,newFighter,Economy,type EconomySnapshot,type Fighter,type Wolf,type CombatEvent,type Point,type Motion,type Input} from '@realm/shared';
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
 usePaperDoll=true;portraitKey='';inventoryRenderKey='';economy=new Economy();bag?:EconomySnapshot;dropViews=new Map<string,Phaser.GameObjects.Container>();shopOpen=false;lastXp=0;
 fxObjects=new Set<Phaser.GameObjects.GameObject>();sim=new CombatSimulation();fighter:Fighter=newFighter();wolfViews=new Map<string,Phaser.GameObjects.Container>();selected='';autoAttack=false;chaseAt=0;
 entryReady=false;connectionGeneration=0;pendingEntry=false;
 accounts?:AccountUI;switchingAccount=false;accountLoaded=false;connectBusy=false;
 room?:Room; avatar!:Phaser.GameObjects.Container; bodySprite?:Phaser.GameObjects.Sprite;
 local:Motion={...WORLD.spawn,stamina:100}; keys!:Record<string,Phaser.Input.Keyboard.Key>;
 peers=new Map<string,Phaser.GameObjects.Container>();route:Point[]=[];seq=0;acc=0;online=false;preview=false;touch={x:0,y:0};pendingInteraction:'portal'|'trader'|undefined;sprinting=false;pending:Input[]=[];facing:Facing='down';walking=false;animationStyle=new Map<string,{scale:number;origin:number}>();
 preload(){for(const sheet of generatedSourceSheets)this.load.image(sheet.key,sheet.url);for(const asset of mapObjectTileAssets)this.load.image(asset.key,asset.url);this.load.image(terrainTileAsset.key,terrainTileAsset.url);this.load.image(generatedMonsters.key,generatedMonsters.url);this.load.image(maraAsset.key,maraAsset.url);for(const asset of animatedMonsters)this.load.image(asset.key,asset.url);for(const asset of characterAssets)this.load.image(asset.key,asset.url);if(characterSprite)this.load.spritesheet(characterSprite.key,characterSprite.url,{frameWidth:characterSprite.frameWidth,frameHeight:characterSprite.frameHeight});}
 create(){
 installGeneratedArt(this);
 if(this.textures.exists(generatedMonsters.key)){const texture=this.textures.get(generatedMonsters.key);for(const [kind,f]of Object.entries(generatedMonsters.frames))texture.add(kind,0,f.x,f.y,f.w,f.h);}
 try{this.usePaperDoll=localStorage.getItem('realm-appearance')!=='original';}catch{}
 const appearance=document.querySelector<HTMLSelectElement>('#appearance-style')!;appearance.value=this.usePaperDoll?'paper':'original';appearance.addEventListener('change',()=>{this.usePaperDoll=appearance.value==='paper';try{localStorage.setItem('realm-appearance',this.usePaperDoll?'paper':'original');}catch{}this.drawPortraits();});
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
 for(const [id,s] of Object.entries(spells)){const button=document.createElement('button');button.dataset.spell=id;button.addEventListener('click',()=>this.economyAction({kind:'learn',spell:id}));document.querySelector('#spell-shop')!.append(button);}
 this.drawMap();
 this.drawPortraits();
 this.avatar=this.makeAvatar(0xf0cc80,'You');this.bodySprite=this.avatar.getData('sprite');this.avatar.setPosition(this.local.x*64,this.local.y*64);
 if(characterSprite&&this.textures.exists(characterSprite.key)){this.avatar.removeAll(true);this.bodySprite=this.add.sprite(0,0,characterSprite.key).setOrigin(characterSprite.anchor.x,characterSprite.anchor.y).setScale(characterSprite.scale);this.avatar.add(this.bodySprite);for(const [action,directions] of Object.entries(characterSprite.animations))for(const [direction,a] of Object.entries(directions!)){this.anims.create({key:`${action}-${direction}`,frames:a.frames.map(frame=>({key:characterSprite!.key,frame})),frameRate:a.fps,repeat:-1});}}
 this.cameras.main.setBounds(0,0,WORLD.width*64,WORLD.height*64).startFollow(this.avatar,true,.12,.12).setZoom(this.viewZoom*displayDensity());
// Track game keys without global preventDefault: disabling the scene keyboard
 // alone does not stop Phaser from swallowing letters typed into DOM forms.
 this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SHIFT,SPACE,ONE,TWO,THREE,I,E,ESC',false) as typeof this.keys;
 this.input.mouse?.disableContextMenu();this.input.on('pointerdown',(p:Phaser.Input.Pointer,objects:Phaser.GameObjects.GameObject[])=>{if(p.event.target!==this.game.canvas||!this.entryReady||document.querySelector('dialog[open]')||objects.length)return;if(!p.rightButtonDown()&&Array.from(this.dropViews.values()).some(v=>Phaser.Math.Distance.Between(p.worldX,p.worldY,v.x,v.y)<32))return;if(combatRegion(this.region)&&!p.rightButtonDown()&&Array.from(this.wolfViews.values()).some(v=>Math.abs(p.worldX-v.x)<(v.getData('hitWidth')??110)/2&&p.worldY>=v.y-(v.getData('hitHeight')??100)&&p.worldY<=v.y+12))return;if(!p.middleButtonDown()){this.pendingInteraction=undefined;this.selected='';this.cast('stop');this.route=pathfind(this.local,{x:p.worldX/64,y:p.worldY/64},this.region);if(!this.route.length)notice('Choose a clear path through town.');}});
 this.input.keyboard!.removeCapture([Phaser.Input.Keyboard.KeyCodes.SPACE,Phaser.Input.Keyboard.KeyCodes.ESC]);
 const accountForm=document.querySelector<HTMLFormElement>('#account-form')!;accountForm.addEventListener('focusin',()=>{this.input.keyboard!.enabled=false;this.input.keyboard!.resetKeys();});accountForm.addEventListener('focusout',()=>{this.input.keyboard!.enabled=this.entryReady;});
 this.keys.SPACE.on('down',()=>{if(document.activeElement?.matches('button,summary'))return;if(this.selected&&combatRegion(this.region))this.cast('bolt');else this.interact();});
 for(const [id,definition]of Object.entries(attributeDefinitions)){const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');row.className='attribute-row';label.id=`attribute-${id}`;button.type='button';button.dataset.attribute=id;button.disabled=true;button.textContent='+';button.setAttribute('aria-label',`Increase ${definition.name}`);button.title=definition.description;button.addEventListener('click',()=>this.economyAction({kind:'attribute',attribute:id}));row.append(label,button);document.querySelector('#attribute-list')!.append(row);}
 document.querySelector('#choose-class')!.addEventListener('click',()=>this.openClasses());document.querySelector('#close-class')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#class-dialog')!.close());document.querySelector('#weapon-select')!.addEventListener('change',event=>{const value=(event.target as HTMLSelectElement).value;this.economyAction(value.startsWith('gear:')?{kind:'equip-gear',item:value.slice(5)}:{kind:'equip',weapon:value});});
 this.keys.I.on('down',()=>this.openInventory(false));this.keys.E.on('down',()=>this.pickupNearest());this.keys.THREE.on('down',()=>this.economyAction({kind:'potion'}));
 document.querySelector('#inventory-button')!.addEventListener('click',()=>this.openInventory(false));document.querySelector('#potion')!.addEventListener('click',()=>this.economyAction({kind:'potion'}));document.querySelector('#loot')!.addEventListener('click',()=>this.pickupNearest());
 document.querySelector('#close-inventory')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#inventory-dialog')!.close());document.querySelector('#buy-potion')!.addEventListener('click',()=>this.economyAction({kind:'buy'}));document.querySelector('#sell-pelts')!.addEventListener('click',()=>this.economyAction({kind:'sell'}));
 this.keys.ONE.on('down',()=>this.cast('bolt'));this.keys.TWO.on('down',()=>this.cast('nova'));this.keys.ESC.on('down',()=>{this.selected='';this.cast('stop');});

 document.querySelector('#close-portal')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#portal-dialog')!.close());
 document.querySelector<HTMLImageElement>('#bag-icon')!.src=bagIconUrl;
 for(const tab of ['profile','settings'])document.querySelector(`#${tab}-tab`)!.addEventListener('click',()=>{for(const name of ['profile','settings']){document.querySelector<HTMLElement>(`#${name}-content`)!.hidden=name!==tab;document.querySelector(`#${name}-tab`)!.setAttribute('aria-selected',String(name===tab));}});
 const sprint=document.querySelector('#sprint')!;sprint.addEventListener('click',()=>{this.sprinting=!this.sprinting;sprint.setAttribute('aria-pressed',String(this.sprinting));sprint.textContent=`Sprint: ${this.sprinting?'on':'off'}`;});
 for(const [id,delta] of [['zoom-in',.1],['zoom-out',-.1]] as const)document.querySelector(`#${id}`)!.addEventListener('click',()=>{this.viewZoom=Phaser.Math.Clamp(this.viewZoom+delta,.5,1.5);this.cameras.main.setZoom(this.viewZoom*displayDensity());});
 window.addEventListener('blur',()=>{this.touch={x:0,y:0};this.pendingInteraction=undefined;this.route=[];this.input.keyboard?.resetKeys();});
 this.input.keyboard!.enabled=false;this.accounts=setupAccounts(()=>this.reconnectAccount(),()=>this.leaveAccount());
 }
 drawPortraits(){
 this.portraitKey=JSON.stringify([this.usePaperDoll,this.bag?.weapon,this.bag?.equipment]);
 if(this.usePaperDoll&&this.bag){const doll=new PaperDoll(this);doll.outfit(this.bag.weapon,this.bag.equipment);doll.pose('down',false,0);for(const id of ['profile-portrait','character-portrait'])doll.portrait(document.querySelector<HTMLCanvasElement>(`#${id}`)!);doll.destroy();return;}
 const frame=this.textures.getFrame('citizen-down','frame-0');if(!frame)return;
 for(const id of ['profile-portrait','character-portrait']){const canvas=document.querySelector<HTMLCanvasElement>(`#${id}`)!,context=canvas.getContext('2d');if(!context)continue;const scale=Math.min(canvas.width/frame.cutWidth,canvas.height/frame.cutHeight);const w=frame.cutWidth*scale,h=frame.cutHeight*scale;context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(frame.source.image as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,(canvas.width-w)/2,canvas.height-h,w,h);}
 }
 openCharacter(){
 this.pendingInteraction=undefined;
 if(this.traveling||!this.entryReady)return;for(const dialog of Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')))dialog.close();this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();document.querySelector<HTMLDialogElement>('#character-dialog')!.showModal();
 }
 openClasses(){
 const bag=this.bag;if(!bag||bag.classId!=='citizen'||bag.level<classRules.unlockLevel||this.fighter.hp<=0)return;
 const list=document.querySelector('#class-options')!;list.replaceChildren();for(const [id,definition] of Object.entries(classes)){const button=document.createElement('button');button.type='button';const name=document.createElement('strong');name.textContent=definition.name;const text=document.createElement('span');text.textContent=definition.description;button.append(name,text);button.addEventListener('click',()=>this.economyAction({kind:'class',classId:id}));list.append(button);}
 document.querySelector<HTMLDialogElement>('#character-dialog')!.close();document.querySelector<HTMLDialogElement>('#class-dialog')!.showModal();this.route=[];this.input.keyboard?.resetKeys();
 }
 economyAction(request:{kind:string;drop?:string;weapon?:string;classId?:string;spell?:string;item?:string;slot?:string;attribute?:string}){
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});const message=this.economy.act('local',this.fighter,request,this.sim.time);this.bag=this.economy.snapshot('local',this.sim.time);document.querySelector<HTMLSelectElement>('#weapon-select')!.value=this.bag.equippedGear.weapon?`gear:${this.bag.equippedGear.weapon}`:this.bag.weapon;notice(message);document.querySelector('#inventory-feedback')!.textContent=message;this.renderInventory();}
 else if(this.online)this.room?.send('economy',request);
 }
 pickupNearest(){const nearest=this.bag?.drops.filter(d=>(d.region??'woods')===this.region).sort((a,b)=>Math.hypot(a.x-this.local.x,a.y-this.local.y)-Math.hypot(b.x-this.local.x,b.y-this.local.y))[0];if(nearest)this.economyAction({kind:'pickup',drop:nearest.id});else notice('No loot nearby. Defeat a monster to earn EXP and leave a bundle.');}
 openInventory(shop:boolean){
 this.pendingInteraction=undefined;
 if(shop&&(this.region!=='elderwood'||Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)>merchant.range)){notice('Walk closer to Mara the Trader.');return;}
 if(this.fighter.hp<=0)return;const dialog=document.querySelector<HTMLDialogElement>('#inventory-dialog')!;document.querySelector<HTMLDialogElement>('#portal-dialog')!.close();document.querySelector<HTMLDialogElement>('#character-dialog')!.close();this.shopOpen=shop;this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();document.querySelector('#inventory-title')!.textContent=shop?merchant.name:'Your inventory';document.querySelector<HTMLElement>('#shop-controls')!.hidden=!shop;document.querySelector('#inventory-feedback')!.textContent='';this.renderInventory();if(!dialog.open)dialog.showModal();
 }
 renderInventory(){
 const bag=this.bag;if(!bag)return;document.querySelector('#inventory-summary')!.textContent=`${bag.gold} gold · ${bag.inventory.length} / ${bag.capacity} supply slots · Level ${bag.level}`;
 const key=JSON.stringify([bag.inventory,bag.weapon,bag.equipment,bag.ownedWeapons,bag.ownedEquipment,bag.gold,bag.level,bag.gear,bag.equippedGear]);if(key===this.inventoryRenderKey)return;this.inventoryRenderKey=key;
 const equipped=document.querySelector('#equipment-slots')!,owned=document.querySelector('#equipment-items')!;equipped.replaceChildren();owned.replaceChildren();
 document.querySelector('#equipment-stats')!.textContent=`${bag.armor} armor · ${bag.weaponAttack} attack · ${weapons[bag.weapon].name}`;
 const makeItem=(id:string,name:string,detail:string,action?:()=>void)=>{const element=document.createElement(action?'button':'div');if(element instanceof HTMLButtonElement){element.type='button';element.addEventListener('click',action!);}element.className='equipment-item';element.append(itemSprite(id,name));const title=document.createElement('strong');title.textContent=name;const text=document.createElement('span');text.textContent=detail;element.append(title,text);return element;};
 const weaponGear=bag.gear.find(g=>g.id===bag.equippedGear.weapon);equipped.append(makeItem(bag.weapon,weaponGear?gearName(weaponGear):weapons[bag.weapon].name,'Weapon',weaponGear?()=>this.economyAction({kind:'unequip-gear',item:weaponGear.id}):undefined));
 for(const [slot,label] of Object.entries(equipmentSlots)){
 const id=bag.equipment[slot as EquipmentSlot];const rolled=bag.gear.find(g=>g.id===bag.equippedGear[slot as GearSlot]);const name=rolled?gearName(rolled):id?equipmentItems[id].name:'Empty';const element=makeItem(id??'',name,id?`${label} · Tap to unequip`:label,id?()=>this.economyAction({kind:'unequip-item',slot}):undefined);element.setAttribute('aria-label',`${label}: ${name}${id?', unequip':''}`);element.dataset.slot=slot;equipped.append(element);
 }
 for(const id of bag.ownedWeapons){const active=bag.weapon===id&&!bag.equippedGear.weapon;const element=makeItem(id,weapons[id].name,active?'Equipped':`${weapons[id].attack} base attack · Equip`,()=>this.economyAction({kind:'equip',weapon:id}));(element as HTMLButtonElement).disabled=active;element.dataset.item=id;element.classList.toggle('is-equipped',active);owned.append(element);}
 for(const id of bag.ownedEquipment){const definition=equipmentItems[id],active=bag.equipment[definition.slot]===id&&!bag.equippedGear[definition.slot];const element=makeItem(id,definition.name,`${definition.armor} armor · ${active?'Unequip':'Equip'}`,()=>this.economyAction(active?{kind:'unequip-item',slot:definition.slot}:{kind:'equip-item',item:id}));element.dataset.item=id;element.classList.toggle('is-equipped',active);owned.append(element);}
 const loot=document.querySelector('#loot-equipment-items')!;loot.replaceChildren();document.querySelector('#loot-equipment-summary')!.textContent=`Monster equipment · ${bag.gear.length} / ${bag.gearCapacity}`;
 for(const gear of bag.gear){const definition=gearDefinition(gear.base),stats=gearStats(gear),slot=gearSlot(gear.base),active=bag.equippedGear[slot]===gear.id,rarity=gear.rarity?rarityDefinitions[gear.rarity]:null,card=makeItem(gear.base,gearName(gear),gear.rarity?`${stats.attack?`${stats.attack} attack`:`${stats.armor} armor`} · Level ${definition.level} · ${active?'Equipped':'In bag'}`:'Identify to reveal rarity and bonuses');card.classList.add('loot-gear');card.classList.toggle('unidentified',!gear.rarity);card.dataset.gear=gear.id;if(rarity)card.style.setProperty('--rarity-color',rarity.color);
 const bonus=document.createElement('span');bonus.textContent=gear.rarity?Object.entries(stats.bonuses).filter(([,amount])=>amount>0).map(([id,amount])=>`+${amount} ${attributeDefinitions[id as AttributeId].name}`).join(' · '):'?';card.append(bonus);
 const action=document.createElement('button');action.type='button';action.dataset.gearAction=gear.rarity?active?'unequip':'equip':'identify';action.textContent=gear.rarity?active?'Unequip':`Equip${bag.level<definition.level?` · Level ${definition.level}`:''}`:'Identify';action.disabled=!!gear.rarity&&!active&&bag.level<definition.level;action.addEventListener('click',()=>this.economyAction({kind:gear.rarity?active?'unequip-gear':'equip-gear':'identify',item:gear.id}));card.append(action);
 const discard=document.createElement('button');discard.type='button';discard.className='quiet-button';discard.textContent='Discard';discard.disabled=active;discard.dataset.gearAction='discard';discard.addEventListener('click',()=>this.economyAction({kind:'discard-gear',item:gear.id}));card.append(discard);loot.append(card);
 }
 const catalogue=document.querySelector('#equipment-catalogue')!,openTiers=new Set(Array.from(catalogue.querySelectorAll<HTMLDetailsElement>('details[open]')).map(d=>d.dataset.tier));catalogue.replaceChildren();
 for(const [tier,definition]of Object.entries(equipmentTiers)){
 const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');details.dataset.tier=tier;details.open=openTiers.has(tier);summary.textContent=`${definition.name} set · Level ${definition.level}`;list.className='equipment-catalogue-grid';details.append(summary,list);
 for(const [id,item]of Object.entries({...equipmentItems,...weapons})){if(item.tier!==tier)continue;const ownedItem=[...bag.ownedEquipment,...bag.ownedWeapons].includes(id as never),stat='armor'in item?`${item.armor} armor`:`${item.attack} attack`;const card=makeItem(id,item.name,`${stat} · ${ownedItem?'Owned':`${item.price} gold`}`,()=>this.economyAction({kind:'buy-equipment',item:id}));card.dataset.buyItem=id;(card as HTMLButtonElement).disabled=ownedItem||bag.level<item.level||bag.gold<item.price;list.append(card);}
 catalogue.append(details);
 }
 const grid=document.querySelector('#inventory-grid')!;grid.replaceChildren();for(let i=0;i<bag.capacity;i++){const slot=document.createElement('div');slot.className='inventory-slot';const stack=bag.inventory[i];if(stack){slot.append(itemSprite(stack.item,items[stack.item].name));const name=document.createElement('strong');name.textContent=items[stack.item].name;const count=document.createElement('span');count.textContent=`×${stack.quantity}`;slot.append(name,count);if(stack.item==='potion'){const use=document.createElement('button');use.type='button';use.textContent='Use';use.addEventListener('click',()=>this.economyAction({kind:'potion'}));slot.append(use);}}else slot.textContent='Empty';grid.append(slot);}
 }
 renderRewards(){
 const bag=this.bag;if(!bag)return;
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
 const visible=new Set<string>();for(const drop of bag.drops.filter(d=>(d.region??'woods')===this.region)){visible.add(drop.id);if(this.dropViews.has(drop.id))continue;const glyph=this.add.graphics();glyph.fillStyle(0x352f20,.8);glyph.fillEllipse(0,6,34,14);glyph.fillStyle(0xe2bd65);glyph.fillRoundedRect(-12,-13,24,24,6);glyph.lineStyle(2,0xffe3a0);glyph.strokeRoundedRect(-12,-13,24,24,6);const label=this.add.text(0,-28,drop.gear?'Spoils · Unidentified gear':'Monster spoils',{fontSize:'11px',color:'#ffe5ad',backgroundColor:'#24392d'}).setOrigin(.5);const zone=this.add.zone(0,0,56,56).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.economyAction({kind:'pickup',drop:drop.id});});const view=this.add.container(drop.x*64,drop.y*64,[glyph,label,zone]).setDepth(drop.y*64+1);this.dropViews.set(drop.id,view);}
 for(const [id,view] of this.dropViews)if(!visible.has(id)){view.destroy();this.dropViews.delete(id);}
 }
 cast(kind:'bolt'|'nova'|'stop'){
 if(kind==='stop'){this.route=[];this.chaseAt=0;}
 if(document.querySelector('dialog[open]')!==null||this.traveling||this.fighter.hp<=0)return;
 const spell=document.querySelector<HTMLSelectElement>('#spell-select')!.value;if(kind==='nova'&&!isSpell(spell)){notice('Learn a spell from Mara first.');return;}
 if(kind!=='stop'&&!(kind==='nova'&&spell==='mend')&&!this.selected){notice('Click or tap a monster to select it.');return;}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});if(!(kind==='nova'?this.sim.castSpell('local',this.fighter,spell,this.selected,this.economy.profiles.get('local')):this.sim.action('local',this.fighter,kind,this.selected))&&kind!=='stop')notice('Spell unavailable. Check learned spells, target range, mana, cooldown and sanctuary.');}
 else if(this.online)this.room?.send('combat',{kind:kind==='nova'?'spell':kind,spell,target:this.selected});
 this.autoAttack=kind==='bolt';if(kind==='stop')this.autoAttack=false;
 }
 effect(event:CombatEvent){
 if(event.region!==this.region)return;
 if(event.kind==='bolt'||event.kind==='arrow'){const orb=this.add.circle(event.x*64,event.y*64-25,event.kind==='arrow'?4:6,event.kind==='arrow'?0xe0c18a:0x91deff).setDepth(9999);this.fxObjects.add(orb);this.tweens.add({targets:orb,x:(event.toX??event.x)*64,y:(event.toY??event.y)*64-25,duration:Math.hypot((event.toX??event.x)-event.x,(event.toY??event.y)-event.y)/(event.speed??C.bolt.speed)*1000,onComplete:()=>{this.fxObjects.delete(orb);orb.destroy();}});}
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
 if(event.kind==='hit'||event.kind==='heal'){const number=this.add.text(event.x*64,event.y*64-65,`${event.kind==='heal'?'+':'−'}${event.damage}`,{fontSize:'20px',color:event.kind==='heal'?'#a9edaa':'#ffd19c',stroke:'#1b292b',strokeThickness:3}).setDepth(10000);this.fxObjects.add(number);this.tweens.add({targets:number,y:number.y-30,alpha:0,duration:800,onComplete:()=>{this.fxObjects.delete(number);number.destroy();}});}
 }
 renderCombat(delta:number){
 const wolves=this.preview?this.sim.wolves:this.room?.state?.wolves;
 const visible=new Set<string>();
 if(combatRegion(this.region)&&wolves)wolves.forEach((w:Wolf,id:string)=>{if(monsterRegion(w)!==this.region)return;
 const kind=monsterKind(w.kind),stats=monsters[kind],animated=animatedMonster(kind);let view=this.wolfViews.get(id);
 if(w.hp<=0){if(view&&animated&&!view.getData('defeated')){view.setData('defeated',true);const original=view.getData('sprite') as Phaser.GameObjects.Sprite;
 const corpse=this.add.sprite(view.x,view.y,original.texture.key).setOrigin(.5,1).setScale(animated.scale).setDepth(view.y);playMonster(corpse,animated.kind,'death',w.facing);this.fxObjects.add(corpse);
 this.tweens.add({targets:corpse,alpha:0,delay:450,duration:450,onComplete:()=>{this.fxObjects.delete(corpse);corpse.destroy();}});}return;}
 visible.add(id);
 const painted=!animated&&this.textures.exists(generatedMonsters.key),paint=kind in generatedMonsters.frames?generatedMonsters.frames[kind as keyof typeof generatedMonsters.frames]:undefined;
 if(!view){const sprite=this.add.sprite(0,0,animated?`${animated.key}-down-0`:generatedMonsters.key,animated?undefined:kind).setOrigin(.5,.95).setScale(kind==='wolf'?.2:kind==='bear'?.95:.6);if(painted&&paint){sprite.setTexture(generatedMonsters.key,kind).setOrigin(.5,1).setScale(paint.width/paint.w);sprite.setData('paintScale',paint.width/paint.w);}if(animated)sprite.setOrigin(.5,1).setScale(animated.scale);const health=this.add.graphics();const ring=this.add.ellipse(0,-1,stats.boss?116:70,stats.boss?38:24,0xdeb96d,.12).setStrokeStyle(2,0xe7c77e,.85).setVisible(false);const label=this.add.text(0,animated?-animated.height-12:painted?(kind==='bear'?-198:kind==='boar'?-130:-96):kind==='bear'?-150:-92,`${stats.name} · Lv ${stats.level}${stats.boss?' · BOSS':''}`,{fontSize:'12px',color:'#f5dfbd',backgroundColor:'#203a31'}).setOrigin(.5);view=this.add.container(w.x*64,w.y*64,[ring,sprite,health,label]).setData('sprite',sprite).setData('health',health).setData('ring',ring).setData('hp',w.hp).setData('hitWidth',animated?animated.width:painted&&paint?paint.width+12:110).setData('hitHeight',animated?animated.height:painted&&paint?paint.h*paint.width/paint.w+12:100);const zone=this.add.zone(0,animated?-animated.height/2:painted&&paint?-paint.h*paint.width/paint.w/2:-30,view.getData('hitWidth'),view.getData('hitHeight')).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target!==this.game.canvas||pointer.rightButtonDown())return;this.selected=id;this.route=[];this.pendingInteraction=undefined;this.chaseAt=0;this.cast('bolt');notice('Approaching target · Auto-attack in weapon range');});view.add(zone);this.wolfViews.set(id,view);}
 const moving=w.mode==='chase'||w.mode==='return',sprite=view.getData('sprite') as Phaser.GameObjects.Sprite;if(view.getData('mode')==='windup'&&w.mode==='attack')view.setData('strikeUntil',this.time.now+220);view.setData('mode',w.mode);const striking=w.mode==='windup'||this.time.now<(view.getData('strikeUntil')??0);if(animated){
 const previousMode=view.getData('animationMode'),now=this.time.now;
 if(w.mode==='attack'&&(previousMode!=='attack'||now>=(view.getData('nextStrike')??0))){view.setData('nextStrike',now+stats.cooldown*1000);view.setData('attackUntil',now+330);}
 view.setData('animationMode',w.mode);sprite.setScale(animated.scale).setY(0).setFlipX(false);
 playMonster(sprite,animated.kind,now<(view.getData('attackUntil')??0)?'attack':moving?'walk':'idle',w.facing);
 }else if(painted&&paint){sprite.anims.stop();const scale=sprite.getData('paintScale') as number,phase=this.time.now/(moving?85:270),bob=moving?Math.abs(Math.sin(phase))*3:Math.sin(phase)*.8;const pulse=striking?Math.sin(this.time.now/75)*.025:0;sprite.setScale(scale*(1+pulse),scale*(1-pulse+(moving?Math.sin(phase)*.018:0))).setY(-bob).setFlipX(w.facing==='left');}const previous=view.getData('hp') as number;if(w.hp<previous)view.setData('flashUntil',this.time.now+150);view.setData('hp',w.hp);(view.getData('ring') as Phaser.GameObjects.Ellipse).setVisible(this.selected===id);sprite.setAngle(0);view.x+=(w.x*64-view.x)*(1-Math.exp(-delta/70));view.y+=(w.y*64-view.y)*(1-Math.exp(-delta/70));view.setDepth(view.y);sprite.setTint(this.time.now<(view.getData('flashUntil')??0)?0xff8c7e:w.mode==='windup'?0xffcb8d:this.selected===id?0xffe4aa:0xffffff);const bar=view.getData('health') as Phaser.GameObjects.Graphics;bar.y=animated?70-animated.height:painted?(kind==='bear'?-109:kind==='boar'?-44:-14):kind==='bear'?-52:-10;bar.clear();bar.fillStyle(0x162727);bar.fillRoundedRect(-30,-73,60,6,3);bar.fillStyle(0xbacb85);bar.fillRoundedRect(-30,-73,60*w.hp/stats.hp,6,3);
 });
 for(const [id,view] of this.wolfViews)if(!visible.has(id)){view.destroy();this.wolfViews.delete(id);if(this.selected===id)this.selected='';}
 const target=wolves?.get(this.selected);document.querySelector<HTMLElement>('#spell-bar')!.hidden=!combatRegion(this.region)||!target||monsterRegion(target)!==this.region||target.hp<=0||!this.bag?.learnedSpells.length;document.querySelector('#combat-target')!.textContent=target&&target.hp>0?`${monsters[monsterKind(target.kind)].name} · ${Math.ceil(target.hp)} / ${monsters[monsterKind(target.kind)].hp}`:'Select a monster';
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
 const mapConfig=this.region==='woods'?woodsMap:this.region==='caverns'?cavernsMap:elderwoodMap,mapObjects=this.region==='woods'?woodsObjects:this.region==='caverns'?cavernsObjects:elderwoodObjects,mapPrefix=this.region==='woods'?'woods':this.region==='caverns'?'caverns':'elderwood';
 const illustratedMap=this.region==='elderwood'||combatRegion(this.region);
 if(illustratedMap){
 for(const object of mapObjects){const sx=mapConfig.worldWidth*64/mapConfig.width,sy=mapConfig.worldHeight*64/mapConfig.height;
 if(this.region==='caverns'&&(object.key.includes('crystal')||object.key.includes('lantern')))this.add.ellipse((object.x+object.w/2)*sx,(object.y+object.h*.9)*sy+mapConfig.offsetY*64,object.w*sx*1.4,object.h*sy*.35,0x6ddcff,.09).setDepth(-2);
 this.add.image(object.x*sx,object.y*sy+mapConfig.offsetY*64,object.key).setOrigin(0).setDisplaySize(object.w*sx,object.h*sy).setDepth(object.footY*sy+mapConfig.offsetY*64);}
 }else{
 for(let x=0;x<WORLD.width;x++)for(const y of [0,23])this.tree(x*64+32,y*64+32);
 for(let y=1;y<23;y++)for(const x of [0,31])this.tree(x*64+32,y*64+32);
 }
 if(!illustratedMap)this.add.text(16.5*64,12.2*64,config.name.toUpperCase(),{fontFamily:'Georgia',fontSize:'18px',color:'#535d42',letterSpacing:3}).setOrigin(.5);
 for(const b of config.obstacles){const rock=this.add.graphics();rock.fillStyle(config.accent,.45);rock.fillRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.lineStyle(3,config.accent,.6);rock.strokeRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.setDepth((b.y+b.h)*64);}
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
 if(this.region==='elderwood'){const trader=this.makeAvatar(0xddc79b,merchant.name,false);trader.setPosition(merchant.x*64,merchant.y*64).setDepth(merchant.y*64);const sprite=trader.getData('sprite') as Phaser.GameObjects.Sprite|undefined;if(sprite&&this.textures.exists(maraAsset.key))sprite.setTexture(maraAsset.key,'idle-down-0').setOrigin(.5,maraAsset.origin).setScale(maraAsset.scale).play('mara-idle-down');const tradeZone=this.add.zone(merchant.x*64,merchant.y*64-30,100,110).setInteractive({useHandCursor:true}).setDepth(merchant.y*64+1);tradeZone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.approachInteraction('trader');});}
 this.worldObjects=this.children.list.filter(obj=>!existing.has(obj));
 document.querySelector('h1')!.textContent=config.name;
 }
 approachInteraction(kind:'portal'|'trader'){
 if(!this.entryReady||this.traveling||this.fighter.hp<=0||document.querySelector('dialog[open]'))return;
 this.selected='';this.cast('stop');this.pendingInteraction=kind;
 const center=kind==='portal'?portalFor(this.region):merchant,range=kind==='portal'?portalFor(this.region).radius:merchant.range;
 if(Math.hypot(this.local.x-center.x,this.local.y-center.y)<=range){this.pendingInteraction=undefined;this.route=[];if(kind==='portal')this.openPortal();else this.openInventory(true);return;}
 const targets=kind==='portal'?[portalFor(this.region).arrival]:Array.from({length:12},(_,i)=>({x:merchant.x+Math.cos(i*Math.PI/6)*1.4,y:merchant.y+Math.sin(i*Math.PI/6)*1.4}));
 this.route=targets.map(target=>pathfind(this.local,target,this.region)).filter(route=>route.length).sort((a,b)=>a.length-b.length)[0]??[];
 if(!this.route.length){this.pendingInteraction=undefined;notice('No clear route to that interaction.');}
 }
 openPortal(){
 if(this.fighter.hp<=0)return;
 if(this.traveling)return;
 if(Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)>portalFor(this.region).radius){notice('Walk closer to the glowing portal, then interact.');return;}
 this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();
 const dialog=document.querySelector<HTMLDialogElement>('#portal-dialog')!,list=document.querySelector('#destinations')!;list.replaceChildren();
 for(const [id,destination] of Object.entries(regions)){if(id===this.region)continue;const button=document.createElement('button');button.type='button';const name=document.createElement('strong');name.textContent=destination.name;const description=document.createElement('span');description.textContent=destination.description;button.append(name,description);button.addEventListener('click',()=>this.travel(id as RegionId));list.append(button);}
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
 clearTimeout(this.travelTimer);document.querySelectorAll<HTMLDetailsElement>('nav details').forEach(drawer=>drawer.open=false);document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog=>{if(dialog.id!=='login-dialog')dialog.close();});for(const view of this.dropViews.values())view.destroy();this.dropViews.clear();for(const obj of this.fxObjects){this.tweens.killTweensOf(obj);obj.destroy();}this.fxObjects.clear();this.pendingInteraction=undefined;this.traveling=false;this.region=region;this.selected='';this.autoAttack=false;this.fighter.target='';this.fighter.auto=false;this.fighter.region=region;this.fighter.x=position.x;this.fighter.y=position.y;for(const view of this.wolfViews.values())view.destroy();this.wolfViews.clear();this.local={x:position.x,y:position.y,stamina:position.stamina};this.pending=[];this.route=[];this.walking=false;this.touch={x:0,y:0};this.input.keyboard?.resetKeys();this.drawMap();
 for(const obj of this.peers.values())obj.destroy();this.peers.clear();
 this.avatar.setPosition(this.local.x*64,this.local.y*64);this.cameras.main.centerOn(this.avatar.x,this.avatar.y);notice(`Arrived in ${regions[region].name}. Use the portal to return or explore another destination.`);
 }
 tree(x:number,y:number){this.add.image(x,y,'elderwood-oak').setOrigin(.5,1).setDisplaySize(88,112).setDepth(y);}
 makeAvatar(color:number,label:string,paper=true){const g=this.add.graphics();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);g.fillStyle(0x446d82);g.fillRoundedRect(-13,-32,26,30,8);g.fillStyle(color);g.fillCircle(0,-40,13);g.fillStyle(0xffffff,.35);g.fillEllipse(-4,-44,12,7);const text=this.add.text(0,-88,label,{fontFamily:'sans-serif',fontSize:'12px',color:'#fff5d7',backgroundColor:'#203b36'}).setOrigin(.5);if(this.textures.exists('citizen-down')){g.clear();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);const sprite=this.add.sprite(0,0,'citizen-down','frame-0').setOrigin(.5,characterStyle.origin).setScale(characterStyle.scale);sprite.play('idle-down');const doll=paper?new PaperDoll(this):undefined;const avatar=this.add.container(0,0,doll?[g,sprite,doll,text]:[g,sprite,text]).setData('sprite',sprite);if(doll){avatar.setData('paperDoll',doll);doll.setVisible(this.usePaperDoll);sprite.setVisible(!this.usePaperDoll);}return avatar;}return this.add.container(0,0,[g,text]);}
 enterWorld(){this.entryReady=true;this.input.keyboard!.enabled=true;this.input.keyboard!.resetKeys();this.accounts?.entered();}
 startPreview(message:string){this.enterWorld();this.online=false;this.preview=true;this.pending=[];document.querySelector('#connection')!.textContent='Local preview · No multiplayer';notice(message);}
 async leaveAccount(){this.connectionGeneration++;this.entryReady=false;this.preview=false;this.input.keyboard!.enabled=false;this.switchingAccount=true;this.online=false;this.route=[];this.pending=[];if(this.room){const room=this.room;this.room=undefined;if(room.connection.isOpen)await room.leave(true);}this.switchingAccount=false;}
 async reconnectAccount(){if(this.connectBusy){this.pendingEntry=true;return;}if(this.switchingAccount)return;try{await this.leaveAccount();this.accountLoaded=false;this.lastXp=0;this.economy.leave('local');this.economy.join('local');this.bag=this.economy.snapshot('local',0);this.preview=false;this.fighter=newFighter();this.seq=0;this.applyTravel('elderwood',{...WORLD.spawn,stamina:100});await this.connect();}catch{this.accounts?.failed('Could not switch accounts. Reload to reconnect.');}}
 async connect(){
 if(this.connectBusy)return;this.connectBusy=true;const generation=this.connectionGeneration;this.accounts?.connecting(true);let expectedUser:string|null=null;try{const session=await this.accounts?.session();expectedUser=session?.user.id??null;if(this.accounts?.mode()==='account'&&!session){this.accounts?.failed('Please sign in again to load your character.');return;}
 const configured=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_SERVER_URL;
 const localHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 if(!configured&&!localHost){if(session){document.querySelector('#connection')!.textContent='Account offline · Configure the game server';this.accounts?.failed('Your character cannot load without the multiplayer server.');return;}this.startPreview('Explore Elderwood locally. Multiplayer requires a configured game server.');return;}
 try{const joinedRoom=await new Client(configured||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:2567`).joinOrCreate('elderwood',session?{accessToken:session.access_token}:{});if(generation!==this.connectionGeneration||(this.accounts?.current()?.user.id??null)!==expectedUser){if(joinedRoom.connection.isOpen)await joinedRoom.leave(true);return;}this.room=joinedRoom;this.online=true;this.preview=false;this.accounts?.status(session?'Loading saved character…':'');document.querySelector('#connection')!.textContent='● Connected to Elderwood';const room=this.room;this.room.onStateChange((state:any)=>{if(this.room!==room)return;const p=state.players.get(this.room!.sessionId);if(p){Object.assign(this.fighter,{armor:p.armor,hp:p.hp,mana:p.mana,deadUntil:p.deadUntil,shotAt:p.shotAt,spellAt:p.spellAt,auto:p.auto,weapon:p.weapon,meleeXp:p.meleeXp,distanceXp:p.distanceXp,magicXp:p.magicXp,shieldingXp:p.shieldingXp,shieldArmor:p.shieldArmor,weaponBonus:p.weaponBonus});if(p.region!==this.region)this.applyTravel(p.region,p);this.pending=this.pending.filter(i=>i.seq>p.seq);this.local={x:p.x,y:p.y,stamina:p.stamina};for(const input of this.pending)if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region);}const present=new Set<string>();state.players.forEach((other:any,id:string)=>{if(id===this.room!.sessionId||other.region!==this.region)return;present.add(id);if(!this.peers.has(id))this.peers.set(id,this.makeAvatar(0xc5b1e1,'Adventurer').setPosition(other.x*64,other.y*64));this.peers.get(id)!.setData('target',{x:other.x*64,y:other.y*64}).setData('outfit',{weapon:other.weapon,equipment:readAppearance(other.appearance)});});for(const [id,obj] of this.peers)if(!present.has(id)){obj.destroy();this.peers.delete(id);}});this.room.onMessage('economy-state',(state:EconomySnapshot)=>{if(this.room!==room)return;if(!this.accountLoaded){if(state.account)this.lastXp=state.xp;this.accountLoaded=true;}this.bag=state;this.fighter.attributes={...state.effectiveAttributes};if(!this.entryReady)this.enterWorld();document.querySelector('#save-status')!.textContent=state.account?(state.account.state==='error'?'Save failed · Reconnect before continuing':state.account.state==='saving'?'Saving…':state.account.savedAt?`Saved at ${new Date(state.account.savedAt).toLocaleTimeString()}`:'Character loaded · Autosave enabled'):'Guest progress is not saved';if(state.account?.state==='ready')this.accounts?.status('');document.querySelector<HTMLSelectElement>('#weapon-select')!.value=state.equippedGear.weapon?`gear:${state.equippedGear.weapon}`:state.weapon;if(document.querySelector<HTMLDialogElement>('#inventory-dialog')!.open)this.renderInventory();});this.room.onMessage('economy-result',(message:string)=>{notice(message);document.querySelector('#inventory-feedback')!.textContent=message;});this.room.onMessage('combat-error',(message:string)=>notice(message));this.room.onMessage('combat-event',(event:CombatEvent)=>this.effect(event));this.room.onMessage('travel-complete',()=>{});this.room.onMessage('travel-error',(message:string)=>{clearTimeout(this.travelTimer);this.traveling=false;notice(message);});this.room.onMessage('save-error',(message:string)=>{this.accounts?.status(message);notice(message);document.querySelector('#save-status')!.textContent='Save failed · Reconnect before continuing';});this.room.onLeave(()=>{if(this.switchingAccount||this.room!==room)return;clearTimeout(this.travelTimer);this.traveling=false;this.online=false;this.pending=[];this.entryReady=false;this.input.keyboard!.enabled=false;this.accounts?.failed('Connection lost. Retry to continue your adventure.');document.querySelector('#connection')!.textContent='Disconnected · Retry from login';notice('Connection lost.');});}catch(error){if(generation!==this.connectionGeneration||(this.accounts?.current()?.user.id??null)!==expectedUser)return;if(session){this.online=false;this.preview=false;const message=error instanceof Error?error.message:'Unable to load your saved character.';document.querySelector('#connection')!.textContent='Account offline · Reconnect to play';this.accounts?.failed(message);notice(message);}else this.startPreview('Game server unavailable · Local exploration enabled. Reload after configuring the server to join multiplayer.');}}finally{this.connectBusy=false;this.accounts?.connecting(this.online&&!this.entryReady);if(this.pendingEntry){this.pendingEntry=false;if(this.accounts?.mode())void this.reconnectAccount();}}}
 interact(){if(this.region==='elderwood'&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<=merchant.range&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)){this.openInventory(true);return;}if(Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)<=portalFor(this.region).radius){this.openPortal();return;}const b=landmarks.find(b=>Math.hypot(this.local.x-(b.x+b.w/2),this.local.y-(b.y+b.h))<3.5);notice(this.region==='elderwood'&&b?`${b.name} — ${b.description}`:'Walk close to the portal or a village entrance, then interact.');}
 update(_time:number,delta:number){if(!this.keys||!this.entryReady)return;let x=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown),y=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown);if(x||y){this.route=[];this.pendingInteraction=undefined;if(this.selected){this.selected='';this.cast('stop');}}else {x=this.touch.x;y=this.touch.y;}
 if(this.autoAttack&&this.selected&&!x&&!y&&combatRegion(this.region)&&!this.traveling&&!document.querySelector('dialog[open]')){
 const target=(this.preview?this.sim.wolves:this.room?.state?.wolves)?.get(this.selected),weaponRange=weapons[this.bag?.weapon??this.fighter.weapon].range;
 // Stay inside the encounter leash so ranged approaches can actually engage.
 const range=target?Math.min(weaponRange,monsters[monsterKind(target.kind)].leash-.5):weaponRange;
 if(!target||monsterRegion(target)!==this.region||target.hp<=0||target.mode==='return'){this.route=[];this.selected='';this.cast('stop');}
 else if(Math.hypot(target.x-this.local.x,target.y-this.local.y)<=range&&Math.hypot(this.local.x-portalFor(this.region).x,this.local.y-portalFor(this.region).y)>C.portalSafeRadius&&sight(this.local,target,this.region))this.route=[];
 else if(this.time.now>=this.chaseAt){this.chaseAt=this.time.now+400;this.route=attackPath(this.local,target,range,this.region);}
 }
 const followingRoute=!x&&!y&&this.route.length>0;
 if(this.fighter.hp<=0||document.querySelector('dialog[open]')!==null||this.traveling){x=0;y=0;this.route=[];}
 if(this.portalGlow)this.portalGlow.alpha=.85+Math.sin(_time/450)*.15;
 const previous={x:this.local.x,y:this.local.y};
 const simulated=this.acc+Math.min(delta,100)>=50;
 this.acc+=Math.min(delta,100);while(this.acc>=50){this.acc-=50;
 // Re-evaluate waypoints on every fixed tick, including frames that simulate
 // two ticks. This prevents overshooting a narrow path on slower devices.
 if(followingRoute){const tolerance=(this.region==='elderwood'||combatRegion(this.region))?.11:.22;while(this.route.length&&Math.hypot(this.route[0].x-this.local.x,this.route[0].y-this.local.y)<tolerance)this.route.shift();const waypoint=this.route[0];if(waypoint){const dx=waypoint.x-this.local.x,dy=waypoint.y-this.local.y,divisor=Math.max(Math.abs(dx),Math.abs(dy));x=dx/divisor;y=dy/divisor;}else{x=0;y=0;}}
 const next=this.route[0];const sprint=(this.keys.SHIFT.isDown||this.sprinting)&&!(this.region==='elderwood'&&next&&Math.hypot(next.x-this.local.x,next.y-this.local.y)<.35);if(this.preview&&this.fighter.hp>0){this.local=move(this.local,{x,y,sprint,seq:0},.05,this.region);}else if(this.online&&!this.traveling){const input={x,y,sprint,seq:++this.seq};if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region);this.pending.push(input);if(this.pending.length>40){this.online=false;document.querySelector('#connection')!.textContent='Disconnected · Reload to reconnect';notice('Server stopped responding. Reload to reconnect.');break;}this.room?.send('input',input);}}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});this.sim.tick(Math.min(delta,100)/1000,[['local',this.fighter]]);this.economy.sync('local',this.fighter);this.economy.process(this.sim.kills.splice(0),new Map([['local',this.fighter]]),this.sim.time);this.bag=this.economy.snapshot('local',this.sim.time);if(this.fighter.region!==this.region)this.applyTravel(this.fighter.region,{x:this.fighter.x,y:this.fighter.y,stamina:100});for(const event of this.sim.events.splice(0))this.effect(event);}
 if(this.pendingInteraction){const kind=this.pendingInteraction,target=kind==='portal'?portalFor(this.region):merchant,range=kind==='portal'?portalFor(this.region).radius:merchant.range;if(Math.hypot(this.local.x-target.x,this.local.y-target.y)<=range){this.pendingInteraction=undefined;this.route=[];if(kind==='portal')this.openPortal();else this.openInventory(true);}}
 this.renderCombat(delta);this.renderRewards();
 const blend=1-Math.exp(-delta/55);this.avatar.x+=(this.local.x*64-this.avatar.x)*blend;this.avatar.y+=(this.local.y*64-this.avatar.y)*blend;this.avatar.setDepth(this.avatar.y);
 if(simulated)this.walking=(this.online||this.preview)&&Math.hypot(this.local.x-previous.x,this.local.y-previous.y)>.00001;
 const moving=this.walking&&(this.online||this.preview);
 if(moving&&(x||y))this.facing=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');if(this.bodySprite){const action=moving?'walk':'idle',key=`${action}-${this.facing}`;const selected=this.anims.exists(key)?key:`idle-${this.facing}`;if(this.anims.exists(selected)){const style=this.animationStyle.get(selected);if(style)this.bodySprite.setScale(style.scale).setOrigin(.5,style.origin);this.bodySprite.play(selected,true);}}
 const doll=this.avatar.getData('paperDoll') as PaperDoll|undefined;if(doll&&this.bag){doll.setVisible(this.usePaperDoll);this.bodySprite?.setVisible(!this.usePaperDoll);doll.outfit(this.bag.weapon,this.bag.equipment);doll.pose(this.facing,moving,_time);}
 const portraitKey=JSON.stringify([this.usePaperDoll,this.bag?.weapon,this.bag?.equipment]);if(portraitKey!==this.portraitKey)this.drawPortraits();
 for(const obj of this.peers.values()){const p=obj.getData('target');if(p){const dx=p.x-obj.x,dy=p.y-obj.y;const moving=Math.hypot(dx,dy)>1;const facing=moving?(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')):(obj.getData('facing')??'down');obj.setData('facing',facing);const doll=obj.getData('paperDoll') as PaperDoll|undefined,outfit=obj.getData('outfit');if(doll&&outfit){doll.setVisible(this.usePaperDoll);doll.outfit(outfit.weapon,outfit.equipment);doll.pose(facing,moving,_time);}const sprite=obj.getData('sprite') as Phaser.GameObjects.Sprite|undefined;if(sprite){sprite.setVisible(!this.usePaperDoll);const key=`${moving?'walk':'idle'}-${facing}`,style=this.animationStyle.get(key);if(style)sprite.setScale(style.scale).setOrigin(.5,style.origin);if(this.anims.exists(key))sprite.play(key,true);}obj.x+=dx*blend;obj.y+=dy*blend;obj.setDepth(obj.y);}}
 (document.querySelector('#stamina') as HTMLMeterElement).value=this.local.stamina;
 }
}
export const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#233c38',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,...displaySize()},scene:Elderwood,render:{antialias:true,roundPixels:true},input:{activePointers:3}});
window.addEventListener('resize',()=>{const {width,height}=displaySize();game.scale.setGameSize(width,height);const scene=game.scene.getScenes(true)[0] as Elderwood|undefined;if(scene)scene.cameras.main.setZoom(scene.viewZoom*displayDensity());});
