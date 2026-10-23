import Phaser from 'phaser';
import {Client,type Room} from 'colyseus.js';
import {WORLD,landmarks,characterSprite,regions,PORTAL,canTravel,combat as C,items,merchant,rewards,type RegionId,type Facing} from '@realm/game-data';
import {move,pathfind,CombatSimulation,newFighter,Economy,type EconomySnapshot,type Fighter,type Wolf,type CombatEvent,type Point,type Motion,type Input} from '@realm/shared';
import './style.css';
import {wolfAssets} from './wolf-assets';
import {characterAssets} from './character-assets';
let noticeTimer:ReturnType<typeof setTimeout>;
const notice=(s:string)=>{const element=document.querySelector('#notice')!;element.textContent=s;element.classList.remove('is-quiet');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>element.classList.add('is-quiet'),5500);};
class Elderwood extends Phaser.Scene {
 region:RegionId='elderwood';worldObjects:Phaser.GameObjects.GameObject[]=[];portalGlow?:Phaser.GameObjects.Graphics;traveling=false;travelTimer?:ReturnType<typeof setTimeout>;
 economy=new Economy();bag?:EconomySnapshot;dropViews=new Map<string,Phaser.GameObjects.Container>();shopOpen=false;lastXp=0;
 fxObjects=new Set<Phaser.GameObjects.GameObject>();sim=new CombatSimulation();fighter:Fighter=newFighter();wolfViews=new Map<string,Phaser.GameObjects.Container>();selected='';autoAttack=false;
 room?:Room; avatar!:Phaser.GameObjects.Container; bodySprite?:Phaser.GameObjects.Sprite;
 local:Motion={...WORLD.spawn,stamina:100}; keys!:Record<string,Phaser.Input.Keyboard.Key>;
 peers=new Map<string,Phaser.GameObjects.Container>();route:Point[]=[];seq=0;acc=0;online=false;preview=false;touch={x:0,y:0};sprinting=false;pending:Input[]=[];facing:Facing='down';walking=false;animationStyle=new Map<string,{scale:number;origin:number}>();
 preload(){for(const asset of wolfAssets)this.load.image(asset.key,asset.url);for(const asset of characterAssets)this.load.image(asset.key,asset.url);if(characterSprite)this.load.spritesheet(characterSprite.key,characterSprite.url,{frameWidth:characterSprite.frameWidth,frameHeight:characterSprite.frameHeight});}
 create(){
 const drawers=Array.from(document.querySelectorAll<HTMLDetailsElement>('nav details'));for(const drawer of drawers)drawer.addEventListener('toggle',()=>{if(drawer.open)for(const other of drawers)if(other!==drawer)other.open=false;});
 this.economy.join('local');this.bag=this.economy.snapshot('local',0);
 for(const asset of wolfAssets){if(!this.textures.exists(asset.key))continue;const texture=this.textures.get(asset.key);asset.rows.forEach((row,d)=>{const direction=['down','left','right','up'][d];const frames=row.map(([x,y,w,h],i)=>{const name=`${direction}-${i}`;texture.add(name,0,x,y,w,h);return {key:asset.key,frame:name};});this.anims.create({key:`${asset.key}-${direction}`,frames,frameRate:asset.fps,repeat:-1});});}
 for(const asset of characterAssets){
 if(!this.textures.exists(asset.key))continue;
 const texture=this.textures.get(asset.key);
 for(const row of asset.layout.rows)for(const group of asset.layout.groups){
 const frames=group.columns.map(([left,right],i)=>{const name=`${group.action}-${row.direction}-${i}`;texture.add(name,0,left+2,row.top+2,right-left-4,row.bottom-row.top-4);return {key:asset.key,frame:name};});
 const animation=`${group.action}-${row.direction}`;
 this.anims.create({key:animation,frames,frameRate:group.fps,repeat:-1});
 this.animationStyle.set(animation,{scale:asset.scale,origin:asset.origin});
 }
 }
 this.drawMap();
 this.avatar=this.makeAvatar(0xf0cc80,'You');this.bodySprite=this.avatar.getData('sprite');this.avatar.setPosition(this.local.x*64,this.local.y*64);
 if(characterSprite&&this.textures.exists(characterSprite.key)){this.avatar.removeAll(true);this.bodySprite=this.add.sprite(0,0,characterSprite.key).setOrigin(characterSprite.anchor.x,characterSprite.anchor.y).setScale(characterSprite.scale);this.avatar.add(this.bodySprite);for(const [action,directions] of Object.entries(characterSprite.animations))for(const [direction,a] of Object.entries(directions!)){this.anims.create({key:`${action}-${direction}`,frames:a.frames.map(frame=>({key:characterSprite!.key,frame})),frameRate:a.fps,repeat:-1});}}
 this.cameras.main.setBounds(0,0,WORLD.width*64,WORLD.height*64).startFollow(this.avatar,true,.12,.12).setZoom(.85);
 this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SHIFT,SPACE,ONE,TWO,THREE,I,E,ESC') as typeof this.keys;
 this.input.mouse?.disableContextMenu();this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.event.target!==this.game.canvas)return;if(!p.rightButtonDown()&&Array.from(this.dropViews.values()).some(v=>Phaser.Math.Distance.Between(p.worldX,p.worldY,v.x,v.y)<32))return;if(this.region==='woods'&&!p.rightButtonDown()&&Array.from(this.wolfViews.values()).some(v=>Phaser.Math.Distance.Between(p.worldX,p.worldY,v.x,v.y-24)<48))return;if(p.rightButtonDown()||p.wasTouch){this.route=pathfind(this.local,{x:p.worldX/64,y:p.worldY/64},this.region);if(!this.route.length)notice('Choose a clear path through town.');}});
 this.input.keyboard!.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
 this.keys.SPACE.on('down',()=>{if(document.activeElement?.matches('button,summary'))return;if(this.selected&&this.region==='woods')this.cast('bolt');else this.interact();});
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
 void this.connect();
 }
 economyAction(request:{kind:string;drop?:string}){
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});const message=this.economy.act('local',this.fighter,request,this.sim.time);this.bag=this.economy.snapshot('local',this.sim.time);notice(message);document.querySelector('#inventory-feedback')!.textContent=message;this.renderInventory();}
 else if(this.online)this.room?.send('economy',request);
 }
 pickupNearest(){const nearest=this.bag?.drops.filter(d=>this.region==='woods').sort((a,b)=>Math.hypot(a.x-this.local.x,a.y-this.local.y)-Math.hypot(b.x-this.local.x,b.y-this.local.y))[0];if(nearest)this.economyAction({kind:'pickup',drop:nearest.id});else notice('No loot nearby. Defeat a wolf to earn EXP and leave a bundle.');}
 openInventory(shop:boolean){
 if(shop&&(this.region!=='elderwood'||Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)>merchant.range)){notice('Walk closer to Mara the Trader.');return;}
 if(this.fighter.hp<=0)return;const dialog=document.querySelector<HTMLDialogElement>('#inventory-dialog')!;document.querySelector<HTMLDialogElement>('#portal-dialog')!.close();this.shopOpen=shop;this.route=[];this.touch={x:0,y:0};this.input.keyboard?.resetKeys();document.querySelector('#inventory-title')!.textContent=shop?merchant.name:'Your inventory';document.querySelector<HTMLElement>('#shop-controls')!.hidden=!shop;document.querySelector('#inventory-feedback')!.textContent='';this.renderInventory();if(!dialog.open)dialog.showModal();
 }
 renderInventory(){
 const bag=this.bag;if(!bag)return;document.querySelector('#inventory-summary')!.textContent=`${bag.gold} gold · ${bag.inventory.length} / ${bag.capacity} slots · Level ${bag.level}`;
 const grid=document.querySelector('#inventory-grid')!;grid.replaceChildren();for(let i=0;i<bag.capacity;i++){const slot=document.createElement('div');slot.className='inventory-slot';const stack=bag.inventory[i];if(stack){const name=document.createElement('strong');name.textContent=items[stack.item].name;const count=document.createElement('span');count.textContent=`×${stack.quantity}`;slot.append(name,count);}else slot.textContent='Empty';grid.append(slot);}
 }
 renderRewards(){
 const bag=this.bag;if(!bag)return;
 document.querySelector('#level-label')!.textContent=`Level ${bag.level} · Adventurer`;document.querySelector('#gold-label')!.textContent=`${bag.gold} gold`;
 const exp=document.querySelector<HTMLProgressElement>('#experience')!;exp.max=Math.max(1,bag.nextXp-bag.levelXp);exp.value=bag.level>=rewards.levelCap?exp.max:bag.xp-bag.levelXp;exp.title=`${bag.xp} total EXP`;document.querySelector('#xp-label')!.textContent=bag.level>=rewards.levelCap?'Level cap':`${bag.xp-bag.levelXp} / ${bag.nextXp-bag.levelXp} EXP`;
 if(bag.xp>this.lastXp){notice(`+${bag.xp-this.lastXp} EXP · Level ${bag.level} · Collect your wolf spoils.`);this.lastXp=bag.xp;}
 const visible=new Set<string>();if(this.region==='woods')for(const drop of bag.drops){visible.add(drop.id);if(this.dropViews.has(drop.id))continue;const glyph=this.add.graphics();glyph.fillStyle(0x352f20,.8);glyph.fillEllipse(0,6,34,14);glyph.fillStyle(0xe2bd65);glyph.fillRoundedRect(-12,-13,24,24,6);glyph.lineStyle(2,0xffe3a0);glyph.strokeRoundedRect(-12,-13,24,24,6);const label=this.add.text(0,-28,'Wolf spoils',{fontSize:'11px',color:'#ffe5ad',backgroundColor:'#24392d'}).setOrigin(.5);const zone=this.add.zone(0,0,56,56).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.economyAction({kind:'pickup',drop:drop.id});});const view=this.add.container(drop.x*64,drop.y*64,[glyph,label,zone]).setDepth(drop.y*64+1);this.dropViews.set(drop.id,view);}
 for(const [id,view] of this.dropViews)if(!visible.has(id)){view.destroy();this.dropViews.delete(id);}
 }
 cast(kind:'bolt'|'nova'|'stop'){
 if(document.querySelector('dialog[open]')!==null||this.traveling||this.fighter.hp<=0)return;
 if(kind!=='stop'&&!this.selected){notice('Click or tap a wolf to select it.');return;}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});if(!this.sim.action('local',this.fighter,kind,this.selected)&&kind!=='stop')notice('Move out of the portal sanctuary and into range. Check mana and cooldown.');}
 else if(this.online)this.room?.send('combat',{kind,target:this.selected});
 this.autoAttack=kind==='bolt';if(kind==='stop')this.autoAttack=false;
 }
 effect(event:CombatEvent){
 if(event.region!==this.region)return;
 if(event.kind==='bolt'){const orb=this.add.circle(event.x*64,event.y*64-25,6,0x91deff).setDepth(9999);this.fxObjects.add(orb);this.tweens.add({targets:orb,x:(event.toX??event.x)*64,y:(event.toY??event.y)*64-25,duration:Math.hypot((event.toX??event.x)-event.x,(event.toY??event.y)-event.y)/C.bolt.speed*1000,onComplete:()=>{this.fxObjects.delete(orb);orb.destroy();}});}
 if(event.kind==='nova'){const ring=this.add.circle(event.x*64,event.y*64,C.nova.radius*64,0x9f95ff,.22).setStrokeStyle(4,0xd1beff).setDepth(9998);this.fxObjects.add(ring);this.tweens.add({targets:ring,alpha:0,scale:1.15,duration:650,onComplete:()=>{this.fxObjects.delete(ring);ring.destroy();}});}
 if(event.kind==='hit'){const number=this.add.text(event.x*64,event.y*64-65,`−${event.damage}`,{fontSize:'20px',color:'#ffd19c',stroke:'#1b292b',strokeThickness:3}).setDepth(10000);this.fxObjects.add(number);this.tweens.add({targets:number,y:number.y-30,alpha:0,duration:800,onComplete:()=>{this.fxObjects.delete(number);number.destroy();}});}
 }
 renderCombat(delta:number){
 const wolves=this.preview?this.sim.wolves:this.room?.state?.wolves;
 const visible=new Set<string>();
 if(this.region==='woods'&&wolves)wolves.forEach((w:Wolf,id:string)=>{
 if(w.hp<=0)return;visible.add(id);let view=this.wolfViews.get(id);
 if(!view){const sprite=this.add.sprite(0,0,'wolf-idle','down-0').setOrigin(.5,.95).setScale(.2);const health=this.add.graphics();const label=this.add.text(0,-82,'Forest Wolf',{fontSize:'12px',color:'#f5dfbd',backgroundColor:'#203a31'}).setOrigin(.5);view=this.add.container(w.x*64,w.y*64,[sprite,health,label]).setData('sprite',sprite).setData('health',health);const zone=this.add.zone(0,-30,110,100).setInteractive({useHandCursor:true});zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target!==this.game.canvas||pointer.rightButtonDown())return;this.selected=id;this.route=[];document.querySelector<HTMLDetailsElement>('#combat-panel')!.open=true;notice('Forest Wolf selected · 1 / Attack: Arc Bolt · 2: Moon Nova · Esc: Stop');});view.add(zone);this.wolfViews.set(id,view);}
 const moving=w.mode==='chase'||w.mode==='return',sprite=view.getData('sprite') as Phaser.GameObjects.Sprite;sprite.play(`wolf-${moving?'walk':'idle'}-${w.facing}`,true);view.x+=(w.x*64-view.x)*(1-Math.exp(-delta/70));view.y+=(w.y*64-view.y)*(1-Math.exp(-delta/70));view.setDepth(view.y);sprite.setTint(this.selected===id?0xffe4aa:0xffffff);const bar=view.getData('health') as Phaser.GameObjects.Graphics;bar.clear();bar.fillStyle(0x162727);bar.fillRoundedRect(-30,-73,60,6,3);bar.fillStyle(0xbacb85);bar.fillRoundedRect(-30,-73,60*w.hp/C.wolf.hp,6,3);
 });
 for(const [id,view] of this.wolfViews)if(!visible.has(id)){view.destroy();this.wolfViews.delete(id);if(this.selected===id)this.selected='';}
 const target=wolves?.get(this.selected);document.querySelector('#combat-target')!.textContent=target&&target.hp>0?`Forest Wolf · ${Math.ceil(target.hp)} / ${C.wolf.hp}`:'Select a wolf in Whispering Woods';
 (document.querySelector('#health') as HTMLMeterElement).value=this.fighter.hp;(document.querySelector('#mana') as HTMLMeterElement).value=this.fighter.mana;
 document.querySelector('#death-notice')!.textContent=this.fighter.hp<=0?'Defeated · Returning to Elderwood…':'';
 this.avatar?.setAlpha(this.fighter.hp<=0?.35:1);
 }
 drawMap(){
 for(const obj of this.worldObjects)obj.destroy();
 const existing=new Set(this.children.list),config=regions[this.region];
 this.cameras.main.setBackgroundColor('#233c38');const g=this.add.graphics();
 for(let y=0;y<WORLD.height;y++)for(let x=0;x<WORLD.width;x++){const road=Math.abs(x-16)<2||Math.abs(y-13)<2;const palette=road?config.road:config.ground;g.fillStyle(palette[(x+y)%2]);g.fillRoundedRect(x*64+1,y*64+1,62,62,8);if(!road&&(x*7+y*11)%9===0){g.fillStyle(0x749462,.6);g.fillCircle(x*64+22,y*64+25,4);}}
 for(let x=0;x<WORLD.width;x++)for(const y of [0,23])this.tree(x*64+32,y*64+32);
 for(let y=1;y<23;y++)for(const x of [0,31])this.tree(x*64+32,y*64+32);
 for(const b of this.region==='elderwood'?landmarks:[]){const x=b.x*64,y=b.y*64,w=b.w*64,h=b.h*64;const panel=this.add.graphics();panel.fillStyle(0x172f2d,.35);panel.fillRoundedRect(x+8,y+12,w,h,18);panel.fillStyle(b.color);panel.fillRoundedRect(x,y,w,h,18);panel.fillStyle(0xffffff,.12);panel.fillRoundedRect(x+8,y+8,w-16,26,10);panel.fillStyle(0x374b45);panel.fillRoundedRect(x+w/2-22,y+h-55,44,55,10);panel.setDepth((b.y+b.h)*64);this.add.text(x+w/2,y+40,b.name,{fontFamily:'Georgia',fontSize:'20px',color:'#fff4d6'}).setOrigin(.5).setDepth(panel.depth+1);}
 if(this.region==='elderwood'){const fountain=this.add.graphics();fountain.fillStyle(0x97b4aa);fountain.fillEllipse(16.5*64,10.5*64,64,40);fountain.fillStyle(0x76d6d3);fountain.fillEllipse(16.5*64,10.5*64-5,48,24);fountain.setDepth(10.5*64);}
 this.add.text(16.5*64,12.2*64,config.name.toUpperCase(),{fontFamily:'Georgia',fontSize:'18px',color:'#535d42',letterSpacing:3}).setOrigin(.5);

 for(const b of config.obstacles){const rock=this.add.graphics();rock.fillStyle(config.accent,.45);rock.fillRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.lineStyle(3,config.accent,.6);rock.strokeRoundedRect(b.x*64,b.y*64,b.w*64,b.h*64,24);rock.setDepth((b.y+b.h)*64);}
 const x=PORTAL.x*64,y=PORTAL.y*64;
 const portal=this.add.graphics();portal.fillStyle(0x182f3c,.8);portal.fillEllipse(x,y,128,50);portal.lineStyle(5,0xd9c591);portal.strokeEllipse(x,y,128,50);portal.fillStyle(config.accent,.25);portal.fillEllipse(x,y-48,80,104);portal.lineStyle(5,config.accent);portal.strokeEllipse(x,y-48,80,104);portal.lineStyle(2,0xf0f6ff,.8);portal.strokeEllipse(x,y-48,60,86);portal.setDepth(y);this.portalGlow=portal;
 const label=this.add.text(x,y-120,'WAYFARER PORTAL',{fontFamily:'Georgia',fontSize:'14px',color:'#e9e4cb',backgroundColor:'#193b36'}).setOrigin(.5).setDepth(y+1);
 const target=this.add.zone(x,y-45,140,140).setInteractive({useHandCursor:true}).setDepth(y+2);
 target.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target!==this.game.canvas)return;this.route=[];this.openPortal();});
 if(this.region==='elderwood'){const trader=this.makeAvatar(0xddc79b,merchant.name);trader.setPosition(merchant.x*64,merchant.y*64).setDepth(merchant.y*64);const sprite=trader.getData('sprite') as Phaser.GameObjects.Sprite|undefined;sprite?.setTint(0xc5dfad);const tradeZone=this.add.zone(merchant.x*64,merchant.y*64-30,100,110).setInteractive({useHandCursor:true}).setDepth(merchant.y*64+1);tradeZone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!pointer.rightButtonDown())this.openInventory(true);});}
 this.worldObjects=this.children.list.filter(obj=>!existing.has(obj));
 document.querySelector('h1')!.textContent=config.name;
 document.querySelector('footer')!.firstChild!.textContent=config.name.toUpperCase()+' ';
 document.querySelector('#welcome h2')!.textContent=this.region==='elderwood'?'Every journey begins beneath these branches.':config.name;
 document.querySelector('#welcome p')!.textContent=this.region==='elderwood'?'Visit the portal in the square to explore new places.':config.description;
 document.querySelector('.badge')!.textContent=this.region==='elderwood'?'SAFE HAVEN':'EXPLORATION';
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
 clearTimeout(this.travelTimer);document.querySelectorAll<HTMLDetailsElement>('nav details').forEach(drawer=>drawer.open=false);document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog=>dialog.close());for(const view of this.dropViews.values())view.destroy();this.dropViews.clear();for(const obj of this.fxObjects){this.tweens.killTweensOf(obj);obj.destroy();}this.fxObjects.clear();this.traveling=false;this.region=region;this.selected='';this.autoAttack=false;this.fighter.target='';this.fighter.auto=false;this.fighter.region=region;this.fighter.x=position.x;this.fighter.y=position.y;for(const view of this.wolfViews.values())view.destroy();this.wolfViews.clear();this.local={x:position.x,y:position.y,stamina:position.stamina};this.pending=[];this.route=[];this.walking=false;this.touch={x:0,y:0};this.input.keyboard?.resetKeys();this.drawMap();
 for(const obj of this.peers.values())obj.destroy();this.peers.clear();
 this.avatar.setPosition(this.local.x*64,this.local.y*64);this.cameras.main.centerOn(this.avatar.x,this.avatar.y);notice(`Arrived in ${regions[region].name}. Use the portal to return or explore another destination.`);
 }
 tree(x:number,y:number){const g=this.add.graphics();g.fillStyle(0x675a40);g.fillRoundedRect(x-9,y-20,18,30,5);g.fillStyle(0x284f3b);g.fillCircle(x,y-32,34);g.fillStyle(0x5a8555);g.fillEllipse(x-6,y-42,46,30);g.setDepth(y);}
 makeAvatar(color:number,label:string){const g=this.add.graphics();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);g.fillStyle(0x446d82);g.fillRoundedRect(-13,-32,26,30,8);g.fillStyle(color);g.fillCircle(0,-40,13);g.fillStyle(0xffffff,.35);g.fillEllipse(-4,-44,12,7);const text=this.add.text(0,-65,label,{fontFamily:'sans-serif',fontSize:'12px',color:'#fff5d7',backgroundColor:'#203b36'}).setOrigin(.5);if(this.textures.exists('citizen-idle')){g.clear();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);const sprite=this.add.sprite(0,0,'citizen-idle','idle-down-0').setOrigin(.5,.97).setScale(.30);sprite.play('idle-down');return this.add.container(0,0,[g,sprite,text]).setData('sprite',sprite);}return this.add.container(0,0,[g,text]);}
 startPreview(message:string){this.online=false;this.preview=true;this.pending=[];document.querySelector('#connection')!.textContent='Local preview · No multiplayer';notice(message);}
 async connect(){
 const configured=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_SERVER_URL;
 const localHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 if(!configured&&!localHost){this.startPreview('Explore Elderwood locally. Multiplayer requires a configured game server.');return;}
 try{this.room=await new Client(configured||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:2567`).joinOrCreate('elderwood');this.online=true;document.querySelector('#connection')!.textContent='● Connected to Elderwood';this.room.onStateChange((state:any)=>{const p=state.players.get(this.room!.sessionId);if(p){Object.assign(this.fighter,{hp:p.hp,mana:p.mana,deadUntil:p.deadUntil,shotAt:p.shotAt,spellAt:p.spellAt,auto:p.auto});if(p.region!==this.region)this.applyTravel(p.region,p);this.pending=this.pending.filter(i=>i.seq>p.seq);this.local={x:p.x,y:p.y,stamina:p.stamina};for(const input of this.pending)if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region);}const present=new Set<string>();state.players.forEach((other:any,id:string)=>{if(id===this.room!.sessionId||other.region!==this.region)return;present.add(id);if(!this.peers.has(id))this.peers.set(id,this.makeAvatar(0xc5b1e1,'Adventurer').setPosition(other.x*64,other.y*64));this.peers.get(id)!.setData('target',{x:other.x*64,y:other.y*64});});for(const [id,obj] of this.peers)if(!present.has(id)){obj.destroy();this.peers.delete(id);}});this.room.onMessage('economy-state',(state:EconomySnapshot)=>{this.bag=state;if(document.querySelector<HTMLDialogElement>('#inventory-dialog')!.open)this.renderInventory();});this.room.onMessage('economy-result',(message:string)=>{notice(message);document.querySelector('#inventory-feedback')!.textContent=message;});this.room.onMessage('combat-error',(message:string)=>notice(message));this.room.onMessage('combat-event',(event:CombatEvent)=>this.effect(event));this.room.onMessage('travel-complete',()=>{});this.room.onMessage('travel-error',(message:string)=>{clearTimeout(this.travelTimer);this.traveling=false;notice(message);});this.room.onLeave(()=>{clearTimeout(this.travelTimer);this.traveling=false;this.online=false;this.pending=[];document.querySelector('#connection')!.textContent='Disconnected · Reload to reconnect';notice('Connection lost. Reload to re-enter Elderwood.');});}catch{this.startPreview('Game server unavailable · Local exploration enabled. Reload after configuring the server to join multiplayer.');}}
 interact(){if(this.region==='elderwood'&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<=merchant.range&&Math.hypot(this.local.x-merchant.x,this.local.y-merchant.y)<Math.hypot(this.local.x-PORTAL.x,this.local.y-PORTAL.y)){this.openInventory(true);return;}if(Math.hypot(this.local.x-PORTAL.x,this.local.y-PORTAL.y)<=PORTAL.radius){this.openPortal();return;}const b=landmarks.find(b=>Math.hypot(this.local.x-(b.x+b.w/2),this.local.y-(b.y+b.h))<3.5);notice(this.region==='elderwood'&&b?`${b.name} — ${b.description}`:'Walk close to the portal or a village entrance, then interact.');}
 update(_time:number,delta:number){if(!this.keys)return;let x=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown),y=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown);if(x||y)this.route=[];else {x=this.touch.x;y=this.touch.y;}
 if(!x&&!y&&this.route.length){const p=this.route[0],dx=p.x-this.local.x,dy=p.y-this.local.y;if(Math.hypot(dx,dy)<.22)this.route.shift();else{x=dx/Math.max(Math.abs(dx),Math.abs(dy));y=dy/Math.max(Math.abs(dx),Math.abs(dy));}}
 if(this.fighter.hp<=0||document.querySelector('dialog[open]')!==null||this.traveling){x=0;y=0;this.route=[];}
 if(this.portalGlow)this.portalGlow.alpha=.85+Math.sin(_time/450)*.15;
 const previous={x:this.local.x,y:this.local.y};
 const simulated=this.acc+Math.min(delta,100)>=50;
 this.acc+=Math.min(delta,100);while(this.acc>=50){this.acc-=50;if(this.preview&&this.fighter.hp>0){this.local=move(this.local,{x,y,sprint:this.keys.SHIFT.isDown||this.sprinting,seq:0},.05,this.region);}else if(this.online&&!this.traveling){const input={x,y,sprint:this.keys.SHIFT.isDown||this.sprinting,seq:++this.seq};if(this.fighter.hp>0)this.local=move(this.local,input,.05,this.region);this.pending.push(input);if(this.pending.length>40){this.online=false;document.querySelector('#connection')!.textContent='Disconnected · Reload to reconnect';notice('Server stopped responding. Reload to reconnect.');break;}this.room?.send('input',input);}}
 if(this.preview){Object.assign(this.fighter,{x:this.local.x,y:this.local.y,region:this.region});this.sim.tick(Math.min(delta,100)/1000,[['local',this.fighter]]);this.economy.process(this.sim.kills.splice(0),new Map([['local',this.fighter]]),this.sim.time);this.bag=this.economy.snapshot('local',this.sim.time);if(this.fighter.region!==this.region)this.applyTravel(this.fighter.region,{x:this.fighter.x,y:this.fighter.y,stamina:100});for(const event of this.sim.events.splice(0))this.effect(event);}
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
