import Phaser from 'phaser';
import {Client,type Room} from 'colyseus.js';
import {WORLD,landmarks,characterSprite,type Facing} from '@realm/game-data';
import {move,pathfind,type Point,type Motion,type Input} from '@realm/shared';
import './style.css';
import {characterAssets} from './character-assets';
const notice=(s:string)=>{document.querySelector('#notice')!.textContent=s;};
class Elderwood extends Phaser.Scene {
 room?:Room; avatar!:Phaser.GameObjects.Container; bodySprite?:Phaser.GameObjects.Sprite;
 local:Motion={...WORLD.spawn,stamina:100}; keys!:Record<string,Phaser.Input.Keyboard.Key>;
 peers=new Map<string,Phaser.GameObjects.Container>();route:Point[]=[];seq=0;acc=0;online=false;preview=false;touch={x:0,y:0};sprinting=false;pending:Input[]=[];facing:Facing='down';walking=false;animationStyle=new Map<string,{scale:number;origin:number}>();
 preload(){for(const asset of characterAssets)this.load.image(asset.key,asset.url);if(characterSprite)this.load.spritesheet(characterSprite.key,characterSprite.url,{frameWidth:characterSprite.frameWidth,frameHeight:characterSprite.frameHeight});}
 create(){
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
 this.cameras.main.setBackgroundColor('#233c38');const g=this.add.graphics();
 for(let y=0;y<WORLD.height;y++)for(let x=0;x<WORLD.width;x++){const road=Math.abs(x-16)<2||Math.abs(y-13)<2;g.fillStyle(road?((x+y)%2?0xb4aa84:0xbab18d):((x+y)%2?0x426a50:0x456e52));g.fillRoundedRect(x*64+1,y*64+1,62,62,8);if(!road&&(x*7+y*11)%9===0){g.fillStyle(0x749462,.6);g.fillCircle(x*64+22,y*64+25,4);}}
 for(let x=0;x<WORLD.width;x++)for(const y of [0,23])this.tree(x*64+32,y*64+32);
 for(let y=1;y<23;y++)for(const x of [0,31])this.tree(x*64+32,y*64+32);
 for(const b of landmarks){const x=b.x*64,y=b.y*64,w=b.w*64,h=b.h*64;const panel=this.add.graphics();panel.fillStyle(0x172f2d,.35);panel.fillRoundedRect(x+8,y+12,w,h,18);panel.fillStyle(b.color);panel.fillRoundedRect(x,y,w,h,18);panel.fillStyle(0xffffff,.12);panel.fillRoundedRect(x+8,y+8,w-16,26,10);panel.fillStyle(0x374b45);panel.fillRoundedRect(x+w/2-22,y+h-55,44,55,10);panel.setDepth((b.y+b.h)*64);this.add.text(x+w/2,y+40,b.name,{fontFamily:'Georgia',fontSize:'20px',color:'#fff4d6'}).setOrigin(.5).setDepth(panel.depth+1);}
 const fountain=this.add.graphics();fountain.fillStyle(0x97b4aa);fountain.fillEllipse(16.5*64,10.5*64,64,40);fountain.fillStyle(0x76d6d3);fountain.fillEllipse(16.5*64,10.5*64-5,48,24);fountain.setDepth(10.5*64);
 this.add.text(16.5*64,12.2*64,'ELDERWOOD SQUARE',{fontFamily:'Georgia',fontSize:'18px',color:'#535d42',letterSpacing:3}).setOrigin(.5);
 this.avatar=this.makeAvatar(0xf0cc80,'You');this.bodySprite=this.avatar.getData('sprite');this.avatar.setPosition(this.local.x*64,this.local.y*64);
 if(characterSprite&&this.textures.exists(characterSprite.key)){this.avatar.removeAll(true);this.bodySprite=this.add.sprite(0,0,characterSprite.key).setOrigin(characterSprite.anchor.x,characterSprite.anchor.y).setScale(characterSprite.scale);this.avatar.add(this.bodySprite);for(const [action,directions] of Object.entries(characterSprite.animations))for(const [direction,a] of Object.entries(directions!)){this.anims.create({key:`${action}-${direction}`,frames:a.frames.map(frame=>({key:characterSprite!.key,frame})),frameRate:a.fps,repeat:-1});}}
 this.cameras.main.setBounds(0,0,WORLD.width*64,WORLD.height*64).startFollow(this.avatar,true,.12,.12).setZoom(.85);
 this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SHIFT,SPACE') as typeof this.keys;
 this.input.mouse?.disableContextMenu();this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.rightButtonDown()||p.wasTouch){this.route=pathfind(this.local,{x:p.worldX/64,y:p.worldY/64});if(!this.route.length)notice('Choose a clear path through town.');}});
 this.keys.SPACE.on('down',()=>this.interact());
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
 tree(x:number,y:number){const g=this.add.graphics();g.fillStyle(0x675a40);g.fillRoundedRect(x-9,y-20,18,30,5);g.fillStyle(0x284f3b);g.fillCircle(x,y-32,34);g.fillStyle(0x5a8555);g.fillEllipse(x-6,y-42,46,30);g.setDepth(y);}
 makeAvatar(color:number,label:string){const g=this.add.graphics();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);g.fillStyle(0x446d82);g.fillRoundedRect(-13,-32,26,30,8);g.fillStyle(color);g.fillCircle(0,-40,13);g.fillStyle(0xffffff,.35);g.fillEllipse(-4,-44,12,7);const text=this.add.text(0,-65,label,{fontFamily:'sans-serif',fontSize:'12px',color:'#fff5d7',backgroundColor:'#203b36'}).setOrigin(.5);if(this.textures.exists('citizen-idle')){g.clear();g.fillStyle(0x102823,.3);g.fillEllipse(0,0,30,13);const sprite=this.add.sprite(0,0,'citizen-idle','idle-down-0').setOrigin(.5,.97).setScale(.30);sprite.play('idle-down');return this.add.container(0,0,[g,sprite,text]).setData('sprite',sprite);}return this.add.container(0,0,[g,text]);}
 startPreview(message:string){this.online=false;this.preview=true;this.pending=[];document.querySelector('#connection')!.textContent='Local preview · No multiplayer';notice(message);}
 async connect(){
 const configured=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_SERVER_URL;
 const localHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 if(!configured&&!localHost){this.startPreview('Explore Elderwood locally. Multiplayer requires a configured game server.');return;}
 try{this.room=await new Client(configured||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:2567`).joinOrCreate('elderwood');this.online=true;document.querySelector('#connection')!.textContent='● Connected to Elderwood';this.room.onStateChange((state:any)=>{const p=state.players.get(this.room!.sessionId);if(p){this.pending=this.pending.filter(i=>i.seq>p.seq);this.local={x:p.x,y:p.y,stamina:p.stamina};for(const input of this.pending)this.local=move(this.local,input,.05);}const present=new Set<string>();state.players.forEach((other:any,id:string)=>{if(id===this.room!.sessionId)return;present.add(id);if(!this.peers.has(id))this.peers.set(id,this.makeAvatar(0xc5b1e1,'Adventurer').setPosition(other.x*64,other.y*64));this.peers.get(id)!.setData('target',{x:other.x*64,y:other.y*64});});for(const [id,obj] of this.peers)if(!present.has(id)){obj.destroy();this.peers.delete(id);}});this.room.onLeave(()=>{this.online=false;this.pending=[];document.querySelector('#connection')!.textContent='Disconnected · Reload to reconnect';notice('Connection lost. Reload to re-enter Elderwood.');});}catch{this.startPreview('Game server unavailable · Local exploration enabled. Reload after configuring the server to join multiplayer.');}}
 interact(){const b=landmarks.find(b=>Math.hypot(this.local.x-(b.x+b.w/2),this.local.y-(b.y+b.h))<3.5);notice(b?`${b.name} — ${b.description}`:'Walk close to a building entrance, then interact.');}
 update(_time:number,delta:number){if(!this.keys)return;let x=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown),y=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown);if(x||y)this.route=[];else {x=this.touch.x;y=this.touch.y;}
 if(!x&&!y&&this.route.length){const p=this.route[0],dx=p.x-this.local.x,dy=p.y-this.local.y;if(Math.hypot(dx,dy)<.22)this.route.shift();else{x=dx/Math.max(Math.abs(dx),Math.abs(dy));y=dy/Math.max(Math.abs(dx),Math.abs(dy));}}
 const previous={x:this.local.x,y:this.local.y};
 const simulated=this.acc+Math.min(delta,100)>=50;
 this.acc+=Math.min(delta,100);while(this.acc>=50){this.acc-=50;if(this.preview){this.local=move(this.local,{x,y,sprint:this.keys.SHIFT.isDown||this.sprinting,seq:0},.05);}else if(this.online){const input={x,y,sprint:this.keys.SHIFT.isDown||this.sprinting,seq:++this.seq};this.local=move(this.local,input,.05);this.pending.push(input);if(this.pending.length>40){this.online=false;document.querySelector('#connection')!.textContent='Disconnected · Reload to reconnect';notice('Server stopped responding. Reload to reconnect.');break;}this.room?.send('input',input);}}
 const blend=1-Math.exp(-delta/55);this.avatar.x+=(this.local.x*64-this.avatar.x)*blend;this.avatar.y+=(this.local.y*64-this.avatar.y)*blend;this.avatar.setDepth(this.avatar.y);
 if(simulated)this.walking=(this.online||this.preview)&&Math.hypot(this.local.x-previous.x,this.local.y-previous.y)>.00001;
 const moving=this.walking&&(this.online||this.preview);
 if(moving&&(x||y))this.facing=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');if(this.bodySprite){const action=moving?'walk':'idle',key=`${action}-${this.facing}`;const selected=this.anims.exists(key)?key:`idle-${this.facing}`;if(this.anims.exists(selected)){const style=this.animationStyle.get(selected);if(style)this.bodySprite.setScale(style.scale).setOrigin(.5,style.origin);this.bodySprite.play(selected,true);}}
 for(const obj of this.peers.values()){const p=obj.getData('target');if(p){const dx=p.x-obj.x,dy=p.y-obj.y;const moving=Math.hypot(dx,dy)>1;const facing=moving?(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')):(obj.getData('facing')??'down');obj.setData('facing',facing);const sprite=obj.getData('sprite') as Phaser.GameObjects.Sprite|undefined;if(sprite){const key=`${moving?'walk':'idle'}-${facing}`,style=this.animationStyle.get(key);if(style)sprite.setScale(style.scale).setOrigin(.5,style.origin);if(this.anims.exists(key))sprite.play(key,true);}obj.x+=dx*blend;obj.y+=dy*blend;obj.setDepth(obj.y);}}
 (document.querySelector('#stamina') as HTMLMeterElement).value=this.local.stamina;
 }
}
export const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#233c38',scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},scene:Elderwood,render:{antialias:true},input:{activePointers:3}});
