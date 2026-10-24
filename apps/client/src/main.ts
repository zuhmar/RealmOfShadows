import Phaser from 'phaser';
import {setupAccounts,type AccountUI} from './accounts';
import {Client,type Room} from 'colyseus.js';
import {WORLD,equipmentItems,equipmentSlots,type EquipmentSlot,elderwoodMap,elderwoodObjects,landmarks,characterSprite,regions,PORTAL,canTravel,combat as C,items,merchant,rewards,weapons,classes,classRules,skillRequirement,spells,canLearnSpell,isSpell,type RegionId,type Facing} from '@realm/game-data';
import {move,pathfind,CombatSimulation,newFighter,Economy,type EconomySnapshot,type Fighter,type Wolf,type CombatEvent,type Point,type Motion,type Input} from '@realm/shared';
import './style.css';
import {wolfAssets} from './wolf-assets';
import {characterAssets,characterFrameSize,characterStyle} from './character-assets';
import {maraAsset} from './mara-assets';
import {elderwoodTerrain,elderwoodGround,woodsTerrain,woodsGround,terrainAssets,terrainVariant} from './terrain-assets';
import {itemSprite} from './item-assets';
import {elderwoodMapAssets} from './elderwood-map';
let noticeTimer:ReturnType<typeof setTimeout>;
const notice=(s:string)=>{const element=document.querySelector('#notice')!;element.textContent=s;element.classList.remove('is-quiet');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>element.classList.add('is-quiet'),5500);};
class Elderwood extends Phaser.Scene {
 region:RegionId='elderwood';worldObjects:Phaser.GameObjects.GameObject[]=[];portalGlow?:Phaser.GameObjects.Graphics;traveling=false;travelTimer?:ReturnType<typeof setTimeout>;
 inventoryRenderKey='';economy=new Economy();bag?:EconomySnapshot;dropViews=new Map<string,Phaser.GameObjects.Container>();shopOpen=false;lastXp=0;
 fxObjects=new Set<Phaser.GameObjects.GameObject>();sim=new CombatSimulation();fighter:Fighter=newFighter();wolfViews=new Map<string,Phaser.GameObjects.Container>();selected='';autoAttack=false;
 entryReady=false;connectionGeneration=0;pendingEntry=false;
 accounts?:AccountUI;switchingAccount=false;accountLoaded=false;connectBusy=false;
 room?:Room; avatar!:Phaser.GameObjects.Container; bodySprite?:Phaser.GameObjects.Sprite;
 local:Motion={...WORLD.spawn,stamina:100}; keys!:Record<string,Phaser.Input.Keyboard.Key>;
 peers=new Map<string,Phaser.GameObjects.Container>();route:Point[]=[];seq=0;acc=0;online=false;preview=false;touch={x:0,y:0};sprinting=false;pending:Input[]=[];facing:Facing='down';walking=false;animationStyle=new Map<string,{scale:number;origin:number}>();
 preload(){this.load.image(maraAsset.key,maraAsset.url);for(const asset of elderwoodMapAssets)this.load.image(asset.key,asset.url);for(const asset of terrainAssets)this.load.image(asset.key,asset.url);for(const asset of wolfAssets)this.load.image(asset.key,asset.url);for(const asset of characterAssets)this.load.image(asset.key,asset.url);if(characterSprite)this.load.spritesheet(characterSprite.key,characterSprite.url,{frameWidth:characterSprite.frameWidth,frameHeight:characterSprite.frameHeight});}
 create(){
 const drawers=Array.from(document.querySelectorAll<HTMLDetailsElement>('nav details'));for(const drawer of drawers)drawer.addEventListener('toggle',()=>{if(drawer.open)for(const other of drawers)if(other!==drawer)other.open=false;});
 if(this.textures.exists(maraAsset.key)){const texture=this.textures.get(maraAsset.key);for(const animation of maraAsset.animations){const frames=animation.frames.map(([x,y,w,h],i)=>{const name=`${animation.key}-${i}`;texture.add(name,0,x,y,w,h)?.setTrim(maraAsset.frameWidth,maraAsset.frameHeight,(maraAsset.frameWidth-w)/2,maraAsset.frameHeight-h,w,h);return {key:maraAsset.key,frame:name};});this.anims.create({key:`mara-${animation.key}`,frames,frameRate:animation.fps,repeat:-1});}}
 document.querySelector('#character-panel')!.addEventListener('click',()=>this.openCharacter());document.querySelector('#close-character')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#character-dialog')!.close());
 this.economy.join('local');this.bag=this.economy.snapshot('local',0);
 for(const asset of wolfAssets){if(!this.textures.exists(asset.key))continue;const texture=this.textures.get(asset.key);asset.rows.forEach((row,d)=>{const direction=['down','left','right','up'][d];const frames=row.map(([x,y,w,h],i)=>{const name=`${direction}-${i}`;texture.add(name,0,x,y,w,h);return {key:asset.key,frame:name};});this.anims.create({key:`${asset.key}-${direction}`,frames,frameRate:asset.fps,repeat:-1});});}
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
 for(const asset of terrainAssets){if(!this.textures.exists(asset.key))continue;const texture=this.textures.get(asset.key);for(const [kind,y] of Object.entries(asset.rows))asset.columns.forEach((x,i)=>texture.add(`${kind}-${i}`,0,x,y,asset.size,asset.size));}
 this.drawMap();
 this.drawPortraits();
 this.avatar=this.makeAvatar(0xf0cc80,'You');this.bodySprite=this.avatar.getData('sprite');this.avatar.setPosition(this.local.x*64,this.local.y*64);
 if(characterSprite&&this.textures.exists(characterSprite.key)){this.avatar.removeAll(true);this.bodySprite=this.add.sprite(0,0,characterSprite.key).setOrigin(characterSprite.anchor.x,characterSprite.anchor.y).setScale(characterSprite.scale);this.avatar.add(this.bodySprite);for(const [action,directions] of Object.entries(characterSprite.animations))for(const [direction,a] of Object.entries(directions!)){this.anims.create({key:`${action}-${direction}`,frames:a.frames.map(frame=>({key:characterSprite!.key,frame})),frameRate:a.fps,repeat:-1});}}
 this.cameras.main.setBounds(0,0,WORLD.width*64,WORLD.height*64).startFollow(this.avatar,true,.12,.12).setZoom(.85);
// Track game keys without global preventDefault: disabling the scene keyboard
 // alone does not stop Phaser from swallowing letters typed into DOM forms.
 this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SHIFT,SPACE,ONE,TWO,THREE,I,E,ESC',false) as typeof this.keys;
 this.input.mouse?.disableContextMenu();this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target!==this.game.canvas)return;if(!p.rightButtonDown()&&Array.from(this.dropViews.values()).some(v=>Phaser.Math.Distance.Between(p.worldX,p.worldY,v.x,v.y)<32))return;if(this.region==='woods'&&!p.rightButtonDown()&&Array.from(this.wolfViews.values()).some(v=>Phaser.Math.Distance.Between(p.worldX,p.worldY,v.x,v.y-24)<48))return;if(p.rightButtonDown()||p.wasTouch){this.route=pathfind(this.local,{x:p.worldX/64,y:p.worldY/64},this.region);if(!this.route.length)notice('Choose a clear path through town.');}});
 this.input.keyboard!.removeCapture([Phaser.Input.Keyboard.KeyCodes.SPACE,Phaser.Input.Keyboard.KeyCodes.ESC]);
 const accountForm=document.querySelector<HTMLFormElement>('#account-form')!;accountForm.addEventListener('focusin',()=>{this.input.keyboard!.enabled=false;this.input.keyboard!.resetKeys();});accountForm.addEventListener('focusout',()=>{this.input.keyboard!.enabled=this.entryReady;});
 this.keys.SPACE.on('down',()=>{if(document.activeElement?.matches('button,summary'))return;if(this.selected&&this.region==='woods')this.cast('bolt');else this.interact();});
 document.querySelector('#choose-class')!.addEventListener('click',()=>this.openClasses());document.querySelector('#close-class')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#class-dialog')!.close());document.querySelector('#weapon-select')!.addEventListener('change',event=>this.economyAction({kind:'equip',weapon:(event.target as HTMLSelectElement).value}));
 this.keys.I.on('down',()=>this.openInventory(false));this.keys.E.on('down',()=>this.pickupNearest());this.keys.THREE.on('down',()=>this.economyAction({kind:'potion'}));
 document.querySelector('#inventory-button')!.addEventListener('click',()=>this.openInventory(false));document.querySelector('#potion')!.addEventListener('click',()=>this.economyAction({kind:'potion'}));document.querySelector('#loot')!.addEventListener('click',()=>this.pickupNearest());
 document.querySelector('#close-inventory')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#inventory-dialog')!.close());document.querySelector('#buy-potion')!.addEventListener('click',()=>this.economyAction({kind:'buy'}));document.querySelector('#sell-pelts')!.addEventListener('click',()=>this.economyAction({kind:'sell'}));
 this.keys.ONE.on('down',()=>this.cast('bolt'));this.keys.TWO.on('down',()=>this.cast('nova'));this.keys.ESC.on('down',()=>{this.selected='';this.cast('stop');});
 document.querySelector('#attack')!.addEventListener('click',()=>this.cast('bolt'));
 document.querySelector('#nova')!.addEventListener('click',()=>this.cast('nova'));
 document.querySelector('#stop-attack')!.addEventListener('click',()=>{this.selected='';this.cast('stop');});
 document.querySelector('#close-portal')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#portal-dialog')!.close());
 document.querySelector('#interact')!.addEventListener('click',()=>this.interact());
 const sprint=document.querySelector('#sprint')!;sprint.addEventListener('pointerdown',()=>{this.sprinting=true;});window.addEventListener('pointerup',()=>{this.sprinting=false;});
 for(const [id,delta] of [['zoom-in',.1],['zoom-out',-.1]] as const)document.querySelector(`#${id}`)!.addEventListener('click',()=>this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom+delta,.5,1.5)));
 const joy=document.querySelector<HTMLElement>('#joystick')!,stick=document.querySelector<HTMLElement>('#stick')!;let active:number|undefined;
 joy.addEventListener('pointerdown',e=>{active=e.pointerId;joy.setPointerCapture(e.pointerId);this.route=[];});
 joy.addEventListener('pointermove',e=>{if(active!==e.pointerId)return;const r=joy.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/40,y=(e.clientY-r.top-r.height/2)/40,l=Math.max(1,Math.hypot(x,y));this.touch={x:x/l,y:y/l};stick.style.transform=`translate(${this.touch.x*36}px,${this.touch.y*36}px)`;});
 const release=()=>{active=undefined;this.touch={x:0,y:0};stick.style.transform='';};joy.addEventListener('pointerup',release);joy.addEventListener('pointercancel',release);
 window.addEventListener('blur',()=>{release();this.sprinting=false;this.route=[];this.input.keyboard?.resetKeys();});
 this.input.keyboard!.enabled=false;this.accounts=setupAccounts(()=>this.reconnectAccount(),()=>this.leaveAccount());
 }
 drawPortraits(){
 const frame=this.textures.getFrame('citizen-down','frame-0');if(!frame)return;
 for(const id of ['profile-portrait','character-portrait']){const canvas=document.querySelector<HTMLCanvasElement>(`#${id}`)!,context=canvas.getContext('2d');if(!context)continue;const scale=Math.min(canvas.width/frame.cutWidth,canvas.height/frame.cutHeight);const w=frame.cutWidth*scale,h=frame.cutHeight*scale;context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(frame.source.image as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,(canvas.width-w)/2,canvas.height-h,w,h);}
 }
 openCharacter(){
 if(this.traveling||!this.entryReady)return;for(const dialog of Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')))dialog.close();this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();document.querySelector<HTMLDialogElement>('#character-dialog')!.showModal();
 }
 openClasses(){
 const bag=this.bag;if(!bag||bag.classId!=='citizen'||bag.level<classRules.unlockLevel||this.fighter.hp<=0)return;
 const list=document.querySelector('#class-options')!;list.replaceChildren();for(const [id,definition] of Object.entries(classes)){const button=document.createElement('button');button.type='button';const name=document.createElement('strong');name.textContent=definition.name;const text=document.createElement('span');text.textContent=definition.description;button.append(name,text);button.addEventListener('click',()=>this.economyAction({kind:'class',classId:id}));list.append(button);}
 document.querySelector<HTMLDialogElement>('#character-dialog')!.close();document.querySelector<HTMLDialogElement>('#class-dialog')!.showModal();this.route=[];this.input.keyboard?.resetKeys();
 }
 economyAction(request:{kind:string;drop?:string;weapon?:string;classId?:string;spell?:string;item?:string;slot?:string}){
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});const message=this.economy.act('local',this.fighter,request,this.sim.time);this.bag=this.economy.snapshot('local',this.sim.time);document.querySelector<HTMLSelectElement>('#weapon-select')!.value=this.bag.weapon;notice(message);document.querySelector('#inventory-feedback')!.textContent=message;this.renderInventory();}
 else if(this.online)this.room?.send('economy',request);
 }
 pickupNearest(){const nearest=this.bag?.drops.filter(d=>this.region==='woods').sort((a,b)=>Math.hypot(a.x-this.local.x,a.y-this.local.y)-Math.hypot(b.x-this.local.x,b.y-this.local.y))[0];if(nearest)this.economyAction({kind:'pickup',drop:nearest.id});else notice('No loot nearby. Defeat a wolf to earn EXP and leave a bundle.');}
 openInventory(shop:boolean){
 if(shop&&(this.region!=='elderwood'||Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)>merchant.range)){notice('Walk closer to Mara the Trader.');return;}
 if(this.fighter.hp<=0)return;const dialog=document.querySelector<HTMLDialogElement>('#inventory-dialog')!;document.querySelector<HTMLDialogElement>('#portal-dialog')!.close();document.querySelector<HTMLDialogElement>('#character-dialog')!.close();this.shopOpen=shop;this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();document.querySelector('#inventory-title')!.textContent=shop?merchant.name:'Your inventory';document.querySelector<HTMLElement>('#shop-controls')!.hidden=!shop;document.querySelector('#inventory-feedback')!.textContent='';this.renderInventory();if(!dialog.open)dialog.showModal();
 }
 renderInventory(){
 const bag=this.bag;if(!bag)return;document.querySelector('#inventory-summary')!.textContent=`${bag.gold} gold · ${bag.inventory.length} / ${bag.capacity} supply slots · Level ${bag.level}`;
 const key=JSON.stringify([bag.inventory,bag.weapon,bag.equipment,bag.ownedWeapons,bag.ownedEquipment]);if(key===this.inventoryRenderKey)return;this.inventoryRenderKey=key;
 const equipped=document.querySelector('#equipment-slots')!,owned=document.querySelector('#equipment-items')!;equipped.replaceChildren();owned.replaceChildren();
 document.querySelector('#equipment-stats')!.textContent=`${bag.armor} armor · ${weapons[bag.weapon].name}`;
 const makeItem=(id:string,name:string,detail:string,action?:()=>void)=>{const element=document.createElement(action?'button':'div');if(element instanceof HTMLButtonElement){element.type='button';element.addEventListener('click',action!);}element.className='equipment-item';element.append(itemSprite(id,name));const title=document.createElement('strong');title.textContent=name;const text=document.createElement('span');text.textContent=detail;element.append(title,text);return element;};
 equipped.append(makeItem(bag.weapon,weapons[bag.weapon].name,'Weapon'));
 for(const [slot,label] of Object.entries(equipmentSlots)){
 const id=bag.equipment[slot as EquipmentSlot];const name=id?equipmentItems[id].name:'Empty';const element=makeItem(id??'',name,id?`${label} · Tap to unequip`:label,id?()=>this.economyAction({kind:'unequip-item',slot}):undefined);element.setAttribute('aria-label',`${label}: ${name}${id?', unequip':''}`);element.dataset.slot=slot;equipped.append(element);
 }
 for(const id of bag.ownedWeapons){const active=bag.weapon===id;const element=makeItem(id,weapons[id].name,active?'Equipped':`${weapons[id].attack} base attack · Equip`,()=>this.economyAction({kind:'equip',weapon:id}));(element as HTMLButtonElement).disabled=active;element.dataset.item=id;element.classList.toggle('is-equipped',active);owned.append(element);}
 for(const id of bag.ownedEquipment){const definition=equipmentItems[id],active=bag.equipment[definition.slot]===id;const element=makeItem(id,definition.name,`${definition.armor} armor · ${active?'Unequip':'Equip'}`,()=>this.economyAction(active?{kind:'unequip-item',slot:definition.slot}:{kind:'equip-item',item:id}));element.dataset.item=id;element.classList.toggle('is-equipped',active);owned.append(element);}
 const grid=document.querySelector('#inventory-grid')!;grid.replaceChildren();for(let i=0;i<bag.capacity;i++){const slot=document.createElement('div');slot.className='inventory-slot';const stack=bag.inventory[i];if(stack){slot.append(itemSprite(stack.item,items[stack.item].name));const name=document.createElement('strong');name.textContent=items[stack.item].name;const count=document.createElement('span');count.textContent=`×${stack.quantity}`;slot.append(name,count);if(stack.item==='potion'){const use=document.createElement('button');use.type='button';use.textContent='Use';use.addEventListener('click',()=>this.economyAction({kind:'potion'}));slot.append(use);}}else slot.textContent='Empty';grid.append(slot);}
 }
 renderRewards(){
 const bag=this.bag;if(!bag)return;
 document.querySelector('#level-label')!.textContent=`Level ${bag.level} · ${bag.classId==='citizen'?'Citizen':classes[bag.classId].name}`;document.querySelector('#gold-label')!.textContent=`${bag.gold} gold`;document.querySelector('#profile-level')!.textContent=`Level ${bag.level} · ${bag.classId==='citizen'?'Citizen':classes[bag.classId].name}`;
 const weapon=weapons[bag.weapon];document.querySelector('#attack-name')!.textContent=weapon.kind==='melee'?'Melee attack':weapon.kind==='arrow'?'Shoot arrow':'Arc Bolt';const spellSelect=document.querySelector<HTMLSelectElement>('#spell-select')!;if(spellSelect.dataset.known!==bag.learnedSpells.join(',')){const previous=spellSelect.value;spellSelect.replaceChildren();for(const id of bag.learnedSpells){const option=document.createElement('option');option.value=id;option.textContent=`${spells[id].name} · ${spells[id].cost} mana`;spellSelect.append(option);}if(bag.learnedSpells.includes(previous as typeof bag.learnedSpells[number]))spellSelect.value=previous;spellSelect.dataset.known=bag.learnedSpells.join(',');}spellSelect.hidden=bag.learnedSpells.length===0;document.querySelector<HTMLElement>('#nova')!.hidden=spellSelect.hidden;document.querySelector<HTMLElement>('#no-spells')!.hidden=!spellSelect.hidden;
 for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('#spell-shop button'))){const id=button.dataset.spell;if(!isSpell(id))continue;const s=spells[id],known=bag.learnedSpells.includes(id);button.hidden=s.classId!=='shared'&&s.classId!==bag.classId;button.disabled=known||!canLearnSpell(id,bag)||bag.gold<s.price;button.textContent=`${s.name} · ${known?'Learned':`${s.price} gold · Level ${s.level} · ${s.cost} mana · ${s.cooldown}s cooldown`}`;}
 const selector=document.querySelector<HTMLSelectElement>('#weapon-select')!;if(selector.dataset.weapons!==bag.ownedWeapons.join(',')){selector.replaceChildren();for(const id of bag.ownedWeapons){const option=document.createElement('option');option.value=id;option.textContent=weapons[id].name;selector.append(option);}selector.dataset.weapons=bag.ownedWeapons.join(',');}if(document.activeElement!==selector)selector.value=bag.weapon;
 const choose=document.querySelector<HTMLButtonElement>('#choose-class')!;choose.hidden=bag.classId!=='citizen';choose.disabled=bag.level<classRules.unlockLevel;choose.textContent=bag.level>=classRules.unlockLevel?'Choose your class':'Choose class at level 5';
 for(const skill of ['melee','distance','magic'] as const){const level=bag.skills[skill];document.querySelector(`#skill-${skill}`)!.textContent=`${skill[0].toUpperCase()+skill.slice(1)} ${level} · ${level>=100?'Max':`${bag.skillXp[skill]-skillRequirement(level)} / ${skillRequirement(level+1)-skillRequirement(level)} EXP`}`;}
 if(bag.classId!=='citizen')document.querySelector<HTMLDialogElement>('#class-dialog')!.close();
 const exp=document.querySelector<HTMLProgressElement>('#experience')!;exp.max=Math.max(1,bag.nextXp-bag.levelXp);exp.value=bag.level>=rewards.levelCap?exp.max:bag.xp-bag.levelXp;exp.title=`${bag.xp} total EXP`;document.querySelector('#xp-label')!.textContent=bag.level>=rewards.levelCap?'Level cap':`${bag.xp-bag.levelXp} / ${bag.nextXp-bag.levelXp} EXP`;
 if(bag.xp>this.lastXp){notice(`+${bag.xp-this.lastXp} EXP · Level ${bag.level} · Collect your wolf spoils.`);this.lastXp=bag.xp;}
 const visible=new Set<string>();if(this.region==='woods')for(const drop of bag.drops){visible.add(drop.id);if(this.dropViews.has(drop.id))continue;const glyph=this.add.graphics();glyph.fillStyle(0x352f20,.8);glyph.fillEllipse(0,6,34,14);glyph.fillStyle(0xe2bd65);glyph.fillRoundedRect(-12,-13,24,24,6);glyph.lineStyle(2,0xffe3a0);glyph.strokeRoundedRect(-12,-13,24,24,6);const label=this.add.text(0,-28,'Wolf spoils',{fontSize:'11px',color:'#ffe5ad',backgroundColor:'#24392d'}).setOrigin(.5);const zone=this.add.zone(0,0,56,56).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.economyAction({kind:'pickup',drop:drop.id});});const view=this.add.container(drop.x*64,drop.y*64,[glyph,label,zone]).setDepth(drop.y*64+1);this.dropViews.set(drop.id,view);}
 for(const [id,view] of this.dropViews)if(!visible.has(id)){view.destroy();this.dropViews.delete(id);}
 }
 cast(kind:'bolt'|'nova'|'stop'){
 if(document.querySelector('dialog[open]')!==null||this.traveling||this.fighter.hp<=0)return;
 const spell=document.querySelector<HTMLSelectElement>('#spell-select')!.value;if(kind==='nova'&&!isSpell(spell)){notice('Learn a spell from Mara first.');return;}
 if(kind!=='stop'&&!(kind==='nova'&&spell==='mend')&&!this.selected){notice('Click or tap a wolf to select it.');return;}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});if(!(kind==='nova'?this.sim.castSpell('local',this.fighter,spell,this.selected,this.economy.profiles.get('local')):this.sim.action('local',this.fighter,kind,this.selected))&&kind!=='stop')notice('Spell unavailable. Check learned spells, target range, mana, cooldown and sanctuary.');}
 else if(this.online)this.room?.send('combat',{kind:kind==='nova'?'spell':kind,spell,target:this.selected});
 this.autoAttack=kind==='bolt';if(kind==='stop')this.autoAttack=false;
 }
 effect(event:CombatEvent){
 if(event.region!==this.region)return;
 if(event.kind==='bolt'||event.kind==='arrow'){const orb=this.add.circle(event.x*64,event.y*64-25,event.kind==='arrow'?4:6,event.kind==='arrow'?0xe0c18a:0x91deff).setDepth(9999);this.fxObjects.add(orb);this.tweens.add({targets:orb,x:(event.toX??event.x)*64,y:(event.toY??event.y)*64-25,duration:Math.hypot((event.toX??event.x)-event.x,(event.toY??event.y)-event.y)/(event.speed??C.bolt.speed)*1000,onComplete:()=>{this.fxObjects.delete(orb);orb.destroy();}});}
 if(event.kind==='melee'){const slash=this.add.circle(event.x*64,event.y*64-20,22,0xf1ddac,.2).setStrokeStyle(3,0xf6e8bf).setDepth(9999);this.fxObjects.add(slash);this.tweens.add({targets:slash,alpha:0,scale:1.5,duration:200,onComplete:()=>{this.fxObjects.delete(slash);slash.destroy();}});}
 if(event.kind==='nova'){const ring=this.add.circle(event.x*64,event.y*64,(event.radius??C.nova.radius)*64,0x9f95ff,.22).setStrokeStyle(4,0xd1beff).setDepth(9998);this.fxObjects.add(ring);this.tweens.add({targets:ring,alpha:0,scale:1.15,duration:650,onComplete:()=>{this.fxObjects.delete(ring);ring.destroy();}});}
 if(event.kind==='hit'||event.kind==='heal'){const number=this.add.text(event.x*64,event.y*64-65,`${event.kind==='heal'?'+':'−'}${event.damage}`,{fontSize:'20px',color:event.kind==='heal'?'#a9edaa':'#ffd19c',stroke:'#1b292b',strokeThickness:3}).setDepth(10000);this.fxObjects.add(number);this.tweens.add({targets:number,y:number.y-30,alpha:0,duration:800,onComplete:()=>{this.fxObjects.delete(number);number.destroy();}});}
 }
 renderCombat(delta:number){
 const wolves=this.preview?this.sim.wolves:this.room?.state?.wolves;
 const visible=new Set<string>();
 if(this.region==='woods'&&wolves)wolves.forEach((w:Wolf,id:string)=>{
 if(w.hp<=0)return;visible.add(id);let view=this.wolfViews.get(id);
 if(!view){const sprite=this.add.sprite(0,0,'wolf-idle','down-0').setOrigin(.5,.95).setScale(.2);const health=this.add.graphics();const label=this.add.text(0,-82,'Forest Wolf',{fontSize:'12px',color:'#f5dfbd',backgroundColor:'#203a31'}).setOrigin(.5);view=this.add.container(w.x*64,w.y*64,[sprite,health,label]).setData('sprite',sprite).setData('health',health);const zone=this.add.zone(0,-30,110,100).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target!==this.game.canvas||pointer.rightButtonDown())return;this.selected=id;this.route=[];document.querySelector<HTMLDetailsElement>('#combat-panel')!.open=true;this.cast('bolt');notice('Auto-attack enabled · Fires in range · Esc: Stop');});view.add(zone);this.wolfViews.set(id,view);}
 const moving=w.mode==='chase'||w.mode==='return',sprite=view.getData('sprite') as Phaser.GameObjects.Sprite;sprite.play(`wolf-${moving?'walk':'idle'}-${w.facing}`,true);view.x+=(w.x*64-view.x)*(1-Math.exp(-delta/70));view.y+=(w.y*64-view.y)*(1-Math.exp(-delta/70));view.setDepth(view.y);sprite.setTint(this.selected===id?0xffe4aa:0xffffff);const bar=view.getData('health') as Phaser.GameObjects.Graphics;bar.clear();bar.fillStyle(0x162727);bar.fillRoundedRect(-30,-73,60,6,3);bar.fillStyle(0xbacb85);bar.fillRoundedRect(-30,-73,60*w.hp/C.wolf.hp,6,3);
 });
 for(const [id,view] of this.wolfViews)if(!visible.has(id)){view.destroy();this.wolfViews.delete(id);if(this.selected===id)this.selected='';}
 const target=wolves?.get(this.selected);document.querySelector('#combat-target')!.textContent=target&&target.hp>0?`Forest Wolf · ${Math.ceil(target.hp)} / ${C.wolf.hp}`:'Select a wolf in Whispering Woods';
 (document.querySelector('#health') as HTMLMeterElement).value=this.fighter.hp;(document.querySelector('#mana') as HTMLMeterElement).value=this.fighter.mana;document.querySelector('#character-health')!.textContent=`${Math.ceil(this.fighter.hp)} / ${C.playerHp} HP`;document.querySelector('#character-mana')!.textContent=`${Math.floor(this.fighter.mana)} / ${C.mana} MP`;
 document.querySelector('#death-notice')!.textContent=this.fighter.hp<=0?'Defeated · Returning to Elderwood…':'';
 this.avatar?.setAlpha(this.fighter.hp<=0?.35:1);
 }
 drawMap(){
 for(const obj of this.worldObjects)obj.destroy();
 const existing=new Set(this.children.list),config=regions[this.region];
 this.cameras.main.setBackgroundColor('#233c38');const g=this.add.graphics();const terrain=this.region==='elderwood'?elderwoodTerrain:this.region==='woods'?woodsTerrain:undefined;const ground=this.region==='woods'?woodsGround:elderwoodGround;
 const illustratedMap=this.region==='elderwood'&&this.textures.exists('elderwood-base');
 if(illustratedMap){
 this.add.image(0,elderwoodMap.offsetY*64,'elderwood-base').setOrigin(0).setDisplaySize(elderwoodMap.worldWidth*64,elderwoodMap.worldHeight*64).setDepth(-2);
 for(const object of elderwoodObjects){const sx=elderwoodMap.worldWidth*64/elderwoodMap.width,sy=elderwoodMap.worldHeight*64/elderwoodMap.height;
 this.add.image(object.x*sx,object.y*sy+elderwoodMap.offsetY*64,object.key).setOrigin(0).setDisplaySize(object.w*sx,object.h*sy).setDepth(object.footY*sy+elderwoodMap.offsetY*64);}
 }else{
 for(let y=0;y<WORLD.height;y++)for(let x=0;x<WORLD.width;x++){if(terrain&&this.textures.exists(terrain.key)){this.add.image(x*64+1,y*64+1,terrain.key,`${ground(x,y)}-${terrainVariant(x,y)}`).setOrigin(0).setDisplaySize(62,62).setDepth(-1);continue;}const road=Math.abs(x-16)<2||Math.abs(y-13)<2;const palette=road?config.road:config.ground;g.fillStyle(palette[(x+y)%2]);g.fillRoundedRect(x*64+1,y*64+1,62,62,8);if(!road&&(x*7+y*11)%9===0){g.fillStyle(0x749462,.6);g.fillCircle(x*64+22,y*64+25,4);}}
 for(let x=0;x<WORLD.width;x++)for(const y of [0,23])this.tree(x*64+32,y*64+32);
 for(let y=1;y<23;y++)for(const x of [0,31])this.tree(x*64+32,y*64+32);
 }
 if(this.region!=='elderwood')this.add.text(16.5*64,12.2*64,config.name.toUpperCase(),{fontFamily:'Georgia',fontSize:'18px',color:'#535d42',letterSpacing:3}).setOrigin(.5);
 for(const b of config.obstacles){const rock=this.add.graphics();rock.fillStyle(config.accent,.45);rock.fillRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.lineStyle(3,config.accent,.6);rock.strokeRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.setDepth((b.y+b.h)*64);}
 const x=PORTAL.x*64,y=PORTAL.y*64;
 const illustratedPortal=this.region==='elderwood'&&this.textures.exists('elderwood-portal');
 const portal=this.add.graphics();
 if(illustratedPortal){portal.fillStyle(0xc576ff,.12);portal.fillEllipse(x,y,160,48);portal.setDepth(-1);}
 else{portal.fillStyle(0x182f3c,.8);portal.fillEllipse(x,y,128,50);portal.lineStyle(5,0xd9c591);portal.strokeEllipse(x,y,128,50);portal.fillStyle(config.accent,.25);portal.fillEllipse(x,y-48,80,104);portal.lineStyle(5,config.accent);portal.strokeEllipse(x,y-48,80,104);portal.lineStyle(2,0xf0f6ff,.8);portal.strokeEllipse(x,y-48,60,86);portal.setDepth(y);}this.portalGlow=portal;
 const portalArt=elderwoodObjects.find(object=>object.key==='elderwood-portal')!;
 const portalScale=elderwoodMap.worldWidth*64/elderwoodMap.width;
 const portalCenterX=illustratedPortal?(portalArt.x+portalArt.w/2)*portalScale:x;
 const portalTop=illustratedPortal?portalArt.y*portalScale+elderwoodMap.offsetY*64:y-120;
 this.add.text(portalCenterX,portalTop-(illustratedPortal?18:0),'WAYFARER PORTAL',{fontFamily:'Georgia',fontSize:'14px',color:'#e9e4cb',backgroundColor:'#193b36'}).setOrigin(.5).setDepth(y+1);
 const target=this.add.zone(portalCenterX,illustratedPortal?portalTop+portalArt.h*portalScale/2:y-45,illustratedPortal?portalArt.w*portalScale:140,illustratedPortal?portalArt.h*portalScale:140).setInteractive({useHandCursor:true}).setDepth(y+2);
 target.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target!==this.game.canvas)return;this.route=[];this.openPortal();});
 if(this.region==='elderwood'){const trader=this.makeAvatar(0xddc79b,merchant.name);trader.setPosition(merchant.x*64,merchant.y*64).setDepth(merchant.y*64);const sprite=trader.getData('sprite') as Phaser.GameObjects.Sprite|undefined;if(sprite&&this.textures.exists(maraAsset.key))sprite.setTexture(maraAsset.key,'idle-down-0').setOrigin(.5,maraAsset.origin).setScale(maraAsset.scale).play('mara-idle-down');const tradeZone=this.add.zone(merchant.x*64,merchant.y*64-30,100,110).setInteractive({useHandCursor:true}).setDepth(merchant.y*64+1);tradeZone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.openInventory(true);});}
 this.worldObjects=this.children.list.filter(obj=>!existing.has(obj));
 document.querySelector('h1')!.textContent=config.name;
 }
 openPortal(){
 if(this.fighter.hp<=0)return;
 if(this.traveling)return;
 if(Math.hypot(this.local.x-PORTAL.x,this.local.y-PORTAL.y)>PORTAL.radius){notice('Walk closer to the glowing portal, then interact.');return;}
 this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();
 const dialog=document.querySelector<HTMLDialogElement>('#portal-dialog')!,list=document.querySelector('#destinations')!;list.replaceChildren();
 for(const [id,destination] of Object.entries(regions)){if(id===this.region)continue;const button=document.createElement('button');button.type='button';const name=document.createElement('strong');name.textContent=destination.name;const description=document.createElement('span');description.textContent=destination.description;button.append(name,description);button.addEventListener('click',()=>this.travel(id as RegionId));list.append(button);}
 if(!dialog.open)dialog.showModal();
 }
 travel(destination:RegionId){
 if(!canTravel(this.local,this.region,destination)){notice('Walk closer to the portal to travel.');return;}
 document.querySelector<HTMLDialogElement>('#portal-dialog')!.close();this.route=[];this.input.keyboard?.resetKeys();
 if(this.preview){this.applyTravel(destination,{...PORTAL.arrival,stamina:this.local.stamina});return;}
 if(!this.online){notice('Connect to the server before traveling.');return;}
 this.traveling=true;this.pending=[];this.room!.send('travel',destination);notice('Traveling…');
 this.travelTimer=setTimeout(()=>{this.traveling=false;notice('Travel request timed out. Try the portal again.');},5000);
 }
 applyTravel(region:RegionId,position:Motion){
 clearTimeout(this.travelTimer);document.querySelectorAll<HTMLDetailsElement>('nav details').forEach(drawer=>drawer.open=false);document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog=>{if(dialog.id!=='login-dialog')dialog.close();});for(const view of this.dropViews.values())view.destroy();this.dropViews.clear();for(const obj of this.fxObjects){this.tweens.killTweensOf(obj);obj.destroy();}this.fxObjects.clear();this.traveling=false;this.region=region;this.selected='';this.autoAttack=false;this.fighter.target='';this.fighter.auto=false;this.fighter.region=region;this.fighter.x=position.x;this.fighter.y=position.y;for(const view of this.wolfViews.values())view.destroy();this.wolfViews.clear();this.local={x:position.x,y:position.y,stamina:position.stamina};this.pending=[];this.route=[];this.walking=false;this.touch={x:0,y:0};this.input.keyboard?.resetKeys();this.drawMap();
 for(const obj of this.peers.values())obj.destroy();this.peers.clear();
 this.avatar.setPosition(this.local.x*64,this.local.y*64);this.cameras.main.centerOn(this.avatar.x,this.avatar.y);notice(`Arrived in ${regions[region].name}. Use the portal to return or explore another destination.`);
 }
 tree(x:number,y:number){const g=this.add.graphics();g.fillStyle(0x675a40);g.fillRoundedRect(x-9,y-20,18,30,5);g.fillStyle(0x284f3b);g.fillCircle(x,y-32,34);g.fillStyle(0x5a8555);g.fillEllipse(x-6,y-42,46,30);g.setDepth(y);}
 makeAvatar(color:number,label:string){const g=this.add.graphics();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);g.fillStyle(0x446d82);g.fillRoundedRect(-13,-32,26,30,8);g.fillStyle(color);g.fillCircle(0,-40,13);g.fillStyle(0xffffff,.35);g.fillEllipse(-4,-44,12,7);const text=this.add.text(0,-65,label,{fontFamily:'sans-serif',fontSize:'12px',color:'#fff5d7',backgroundColor:'#203b36'}).setOrigin(.5);if(this.textures.exists('citizen-down')){g.clear();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);const sprite=this.add.sprite(0,0,'citizen-down','frame-0').setOrigin(.5,characterStyle.origin).setScale(characterStyle.scale);sprite.play('idle-down');return this.add.container(0,0,[g,sprite,text]).setData('sprite',sprite);}return this.add.container(0,0,[g,text]);}
 enterWorld(){this.entryReady=true;this.input.keyboard!.enabled=true;this.input.keyboard!.resetKeys();this.accounts?.entered();}
 startPreview(message:string){this.enterWorld();this.online=false;this.preview=true;this.pending=[];document.querySelector('#connection')!.textContent='Local preview · No multiplayer';notice(message);}
 async leaveAccount(){this.connectionGeneration++;this.entryReady=false;this.preview=false;this.input.keyboard!.enabled=false;this.switchingAccount=true;this.online=false;this.route=[];this.pending=[];if(this.room){const room=this.room;this.room=undefined;if(room.connection.isOpen)await room.leave(true);}this.switchingAccount=false;}
 async reconnectAccount(){if(this.connectBusy){this.pendingEntry=true;return;}if(this.switchingAccount)return;try{await this.leaveAccount();this.accountLoaded=false;this.lastXp=0;this.economy.leave('local');this.economy.join('local');this.bag=this.economy.snapshot('local',0);this.preview=false;this.fighter=newFighter();this.seq=0;this.applyTravel('elderwood',{...WORLD.spawn,stamina:100});await this.connect();}catch{this.accounts?.failed('Could not switch accounts. Reload to reconnect.');}}
 async connect(){
 if(this.connectBusy)return;this.connectBusy=true;const generation=this.connectionGeneration;this.accounts?.connecting(true);let expectedUser:string|null=null;try{const session=await this.accounts?.session();expectedUser=session?.user.id??null;if(this.accounts?.mode()==='account'&&!session){this.accounts?.failed('Please sign in again to load your character.');return;}
 const configured=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_SERVER_URL;
 const localHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 if(!configured&&!localHost){if(session){document.querySelector('#connection')!.textContent='Account offline · Configure the game server';this.accounts?.failed('Your character cannot load without the multiplayer server.');return;}this.startPreview('Explore Elderwood locally. Multiplayer requires a configured game server.');return;}
 try{const joinedRoom=await new Client(configured||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:2567`).joinOrCreate('elderwood',session?{accessToken:session.access_token}:{});if(generation!==this.connectionGeneration||(this.accounts?.current()?.user.id??null)!==expectedUser){if(joinedRoom.connection.isOpen)await joinedRoom.leave(true);return;}this.room=joinedRoom;this.online=true;this.preview=false;this.accounts?.status(session?'Loading saved character…':'');document.querySelector('#connection')!.textContent='● Connected to Elderwood';const room=this.room;this.room.onStateChange((state:any)=>{if(this.room!==room)return;const p=state.players.get(this.room!.sessionId);if(p){Object.assign(this.fighter,{armor:p.armor,hp:p.hp,mana:p.mana,deadUntil:p.deadUntil,shotAt:p.shotAt,spellAt:p.spellAt,auto:p.auto,weapon:p.weapon,meleeXp:p.meleeXp,distanceXp:p.distanceXp,magicXp:p.magicXp});if(p.region!==this.region)this.applyTravel(p.region,p);this.pending=this.pending.filter(i=>i.seq>p.seq);this.local={x:p.x,y:p.y,stamina:p.stamina};for(const input of this.pending)if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region);}const present=new Set<string>();state.players.forEach((other:any,id:string)=>{if(id===this.room!.sessionId||other.region!==this.region)return;present.add(id);if(!this.peers.has(id))this.peers.set(id,this.makeAvatar(0xc5b1e1,'Adventurer').setPosition(other.x*64,other.y*64));this.peers.get(id)!.setData('target',{x:other.x*64,y:other.y*64});});for(const [id,obj] of this.peers)if(!present.has(id)){obj.destroy();this.peers.delete(id);}});this.room.onMessage('economy-state',(state:EconomySnapshot)=>{if(this.room!==room)return;if(!this.accountLoaded){if(state.account)this.lastXp=state.xp;this.accountLoaded=true;}this.bag=state;if(!this.entryReady)this.enterWorld();document.querySelector('#save-status')!.textContent=state.account?(state.account.state==='error'?'Save failed · Reconnect before continuing':state.account.state==='saving'?'Saving…':state.account.savedAt?`Saved at ${new Date(state.account.savedAt).toLocaleTimeString()}`:'Character loaded · Autosave enabled'):'Guest progress is not saved';if(state.account?.state==='ready')this.accounts?.status('');document.querySelector<HTMLSelectElement>('#weapon-select')!.value=state.weapon;if(document.querySelector<HTMLDialogElement>('#inventory-dialog')!.open)this.renderInventory();});this.room.onMessage('economy-result',(message:string)=>{notice(message);document.querySelector('#inventory-feedback')!.textContent=message;});this.room.onMessage('combat-error',(message:string)=>notice(message));this.room.onMessage('combat-event',(event:CombatEvent)=>this.effect(event));this.room.onMessage('travel-complete',()=>{});this.room.onMessage('travel-error',(message:string)=>{clearTimeout(this.travelTimer);this.traveling=false;notice(message);});this.room.onMessage('save-error',(message:string)=>{this.accounts?.status(message);notice(message);document.querySelector('#save-status')!.textContent='Save failed · Reconnect before continuing';});this.room.onLeave(()=>{if(this.switchingAccount||this.room!==room)return;clearTimeout(this.travelTimer);this.traveling=false;this.online=false;this.pending=[];this.entryReady=false;this.input.keyboard!.enabled=false;this.accounts?.failed('Connection lost. Retry to continue your adventure.');document.querySelector('#connection')!.textContent='Disconnected · Retry from login';notice('Connection lost.');});}catch(error){if(generation!==this.connectionGeneration||(this.accounts?.current()?.user.id??null)!==expectedUser)return;if(session){this.online=false;this.preview=false;const message=error instanceof Error?error.message:'Unable to load your saved character.';document.querySelector('#connection')!.textContent='Account offline · Reconnect to play';this.accounts?.failed(message);notice(message);}else this.startPreview('Game server unavailable · Local exploration enabled. Reload after configuring the server to join multiplayer.');}}finally{this.connectBusy=false;this.accounts?.connecting(this.online&&!this.entryReady);if(this.pendingEntry){this.pendingEntry=false;if(this.accounts?.mode())void this.reconnectAccount();}}}
 interact(){if(this.region==='elderwood'&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<=merchant.range&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<Math.hypot(this.local.x-PORTAL.x,this.local.y-PORTAL.y)){this.openInventory(true);return;}if(Math.hypot(this.local.x-PORTAL.x,this.local.y-PORTAL.y)<=PORTAL.radius){this.openPortal();return;}const b=landmarks.find(b=>Math.hypot(this.local.x-(b.x+b.w/2),this.local.y-(b.y+b.h))<3.5);notice(this.region==='elderwood'&&b?`${b.name} — ${b.description}`:'Walk close to the portal or a village entrance, then interact.');}
 update(_time:number,delta:number){if(!this.keys||!this.entryReady)return;let x=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown),y=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown);if(x||y)this.route=[];else {x=this.touch.x;y=this.touch.y;}
 if(!x&&!y&&this.route.length){const p=this.route[0],dx=p.x-this.local.x,dy=p.y-this.local.y;if(Math.hypot(dx,dy)<(this.region==='elderwood'?.11:.22))this.route.shift();else{x=dx/Math.max(Math.abs(dx),Math.abs(dy));y=dy/Math.max(Math.abs(dx),Math.abs(dy));}}
 if(this.fighter.hp<=0||document.querySelector('dialog[open]')!==null||this.traveling){x=0;y=0;this.route=[];}
 if(this.portalGlow)this.portalGlow.alpha=.85+Math.sin(_time/450)*.15;
 const previous={x:this.local.x,y:this.local.y};
 const simulated=this.acc+Math.min(delta,100)>=50;
 this.acc+=Math.min(delta,100);while(this.acc>=50){this.acc-=50;const next=this.route[0];const sprint=(this.keys.SHIFT.isDown||this.sprinting)&&!(this.region==='elderwood'&&next&&Math.hypot(next.x-this.local.x,next.y-this.local.y)<.35);if(this.preview&&this.fighter.hp>0){this.local=move(this.local,{x,y,sprint,seq:0},.05,this.region);}else if(this.online&&!this.traveling){const input={x,y,sprint,seq:++this.seq};if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region);this.pending.push(input);if(this.pending.length>40){this.online=false;document.querySelector('#connection')!.textContent='Disconnected · Reload to reconnect';notice('Server stopped responding. Reload to reconnect.');break;}this.room?.send('input',input);}}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});this.sim.tick(Math.min(delta,100)/1000,[['local',this.fighter]]);this.economy.sync('local',this.fighter);this.economy.process(this.sim.kills.splice(0),new Map([['local',this.fighter]]),this.sim.time);this.bag=this.economy.snapshot('local',this.sim.time);if(this.fighter.region!==this.region)this.applyTravel(this.fighter.region,{x:this.fighter.x,y:this.fighter.y,stamina:100});for(const event of this.sim.events.splice(0))this.effect(event);}
 this.renderCombat(delta);this.renderRewards();
 const blend=1-Math.exp(-delta/55);this.avatar.x+=(this.local.x*64-this.avatar.x)*blend;this.avatar.y+=(this.local.y*64-this.avatar.y)*blend;this.avatar.setDepth(this.avatar.y);
 if(simulated)this.walking=(this.online||this.preview)&&Math.hypot(this.local.x-previous.x,this.local.y-previous.y)>.00001;
 const moving=this.walking&&(this.online||this.preview);
 if(moving&&(x||y))this.facing=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');if(this.bodySprite){const action=moving?'walk':'idle',key=`${action}-${this.facing}`;const selected=this.anims.exists(key)?key:`idle-${this.facing}`;if(this.anims.exists(selected)){const style=this.animationStyle.get(selected);if(style)this.bodySprite.setScale(style.scale).setOrigin(.5,style.origin);this.bodySprite.play(selected,true);}}
 for(const obj of this.peers.values()){const p=obj.getData('target');if(p){const dx=p.x-obj.x,dy=p.y-obj.y;const moving=Math.hypot(dx,dy)>1;const facing=moving?(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')):(obj.getData('facing')??'down');obj.setData('facing',facing);const sprite=obj.getData('sprite') as Phaser.GameObjects.Sprite|undefined;if(sprite){const key=`${moving?'walk':'idle'}-${facing}`,style=this.animationStyle.get(key);if(style)sprite.setScale(style.scale).setOrigin(.5,style.origin);if(this.anims.exists(key))sprite.play(key,true);}obj.x+=dx*blend;obj.y+=dy*blend;obj.setDepth(obj.y);}}
 (document.querySelector('#stamina') as HTMLMeterElement).value=this.local.stamina;
 }
}
export const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#233c38',scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},scene:Elderwood,render:{antialias:true},input:{activePointers:3}});
