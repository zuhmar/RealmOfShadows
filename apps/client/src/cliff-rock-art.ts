/** Shared stone material for cliff faces, finished corners and recessed stair cheeks. */
export const cliffStone={dark:'#343c3b',shadow:'#505957',base:'#737c78',face:'#929a92',light:'#b2b8aa',rim:'#626f61'};
const noise=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
export function paintCliffBoulder(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,seed:number,palette?:Readonly<Record<string,string>>){
 const colors=palette??cliffStone,ink=(key:keyof typeof cliffStone)=>colors[key]??cliffStone[key];
 const q=(noise(seed+8)-.5)*.16;
 const points=[[x+w*(.2+q),y],[x+w*(.72-q),y-h*(.04+Math.abs(q))],[x+w,y+h*(.24+q)],[x+w*.96,y+h*.7],[x+w*(.72+q),y+h],[x+w*(.22-q),y+h*.94],[x,y+h*.65],[x+w*.02,y+h*.26]];
 const path=(scale=1,ox=0,oy=0)=>{const p=points.map(([px,py])=>[x+(px-x)*scale+ox,y+(py-y)*scale+oy]);c.beginPath();c.moveTo((p[7][0]+p[0][0])/2,(p[7][1]+p[0][1])/2);for(let i=0;i<p.length;i++){const next=p[(i+1)%p.length];c.quadraticCurveTo(p[i][0],p[i][1],(p[i][0]+next[0])/2,(p[i][1]+next[1])/2)}c.closePath()};
 path();c.fillStyle=ink('dark');c.fill();c.save();c.clip();
 c.fillStyle=noise(seed)>.45?ink('base'):ink('shadow');c.fillRect(x,y,w,h);
 path(.84,w*.04,h*.015);c.fillStyle=ink('face');c.fill();
 c.beginPath();c.moveTo(x+w*.28,y+h*.07);c.lineTo(x+w*.7,y+h*.06);c.lineTo(x+w*.85,y+h*.28);c.lineTo(x+w*.62,y+h*.4);c.lineTo(x+w*.18,y+h*.32);c.closePath();c.fillStyle=noise(seed+3)>.5?ink('light'):ink('base');c.fill();
 c.beginPath();c.moveTo(x+w*.8,y+h*.26);c.lineTo(x+w*.92,y+h*.42);c.lineTo(x+w*.85,y+h*.74);c.lineTo(x+w*.64,y+h*.88);c.lineTo(x+w*.6,y+h*.65);c.closePath();c.fillStyle=ink('shadow');c.fill();
 if(noise(seed+5)>.55){c.strokeStyle=ink('shadow');c.lineWidth=.7;c.beginPath();c.moveTo(x+w*.59,y+h*.4);c.lineTo(x+w*.46,y+h*.61);c.lineTo(x+w*.49,y+h*.78);c.stroke();}
 c.strokeStyle=ink('light');c.lineWidth=.8;c.beginPath();c.moveTo(x+w*.13,y+h*.3);c.quadraticCurveTo(x+w*.26,y+h*.08,x+w*.57,y+h*.1);c.stroke();c.restore();
}
