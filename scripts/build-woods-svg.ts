import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {woodsObjects,woodsGeometry} from '../packages/game-data/src/woods';
import {woodsPrefabs} from './woods-prefabs';
import {islandPrefabs,composeIslandSvg} from './island-svg';
export function woodsSvgFiles(){const common=islandPrefabs();const files:Record<string,string>={};for(const name of ['oak','pine','boulder','lamp','gate-pier'])files[name+'.svg']=common[name+'.svg'];
 const svg=(w:number,h:number,body:string)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g stroke="#2d3939" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
 files['stump.svg']=svg(42,40,'<path d="M7 12h27l4 24-12-4-7 5-15-3z" fill="#795331"/><ellipse cx="21" cy="12" rx="15" ry="9" fill="#c39d61"/><ellipse cx="21" cy="12" rx="9" ry="5" fill="none" stroke="#8d683d"/><path d="M11 20l-1 10M30 20v8" stroke="#b58a4e"/>');
 files['bones.svg']=svg(50,35,'<path d="M10 9l27 17M10 26L38 9" stroke="#d5cdb0" stroke-width="6"/><g fill="#eee4c5" stroke="#afa88d"><circle cx="9" cy="8" r="4"/><circle cx="38" cy="27" r="4"/><circle cx="9" cy="27" r="4"/><circle cx="39" cy="8" r="4"/></g>');
 files['mushrooms.svg']=svg(30,32,'<path d="M11 15v12h7V15M22 19v10h4V19" fill="#e8d7a9"/><path d="M2 16q12-26 23 0z" fill="#bc6552"/><path d="M17 22q8-16 13 0z" fill="#a386b6"/><path d="M7 12l3-2M17 12h2" stroke="#fae5b7" stroke-width="3"/>');
 files['fern.svg']=svg(30,32,'<path d="M15 29V5M15 27Q-4 23 2 13q10 1 13 14M15 24Q2 12 9 5q7 4 6 19M15 24Q32 15 26 8q-10 1-11 16M15 28q18-4 13-12-11 1-13 12" fill="#6e9d4e" stroke="#3a6542" stroke-width="2"/>');
 files['web.svg']=svg(100,95,'<path d="M8 80L50 5l43 75zM50 5v78M8 80l63-43M93 80L28 42M30 77l20-40 23 40zM20 78l30-58 33 58z" fill="none" stroke="#e0ded6" opacity=".8"/>');
 files['log.svg']=svg(100,45,'<path d="M12 8l75 10-2 22-76-9z" fill="#79502e"/><path d="M16 14l65 11M16 24l61 8" stroke="#ba8b4b"/><ellipse cx="86" cy="29" rx="11" ry="14" fill="#d6ad72"/><ellipse cx="86" cy="29" rx="6" ry="9" fill="none" stroke="#9d713f"/>');
 files['ruin.svg']=svg(48,95,'<path d="M7 92V23l7-4V7l14-5 13 8v82z" fill="#7d8590"/><path d="M9 31h30M9 55h30M9 75h30M22 32v21M26 57v17M17 76v15" fill="none" stroke="#4b535f"/><path d="M9 22l10-6v-8M12 27v19" fill="none" stroke="#b5b8b3"/><path d="M6 87q9-20 20-7l-3 12z" fill="#5c8541"/>');
 Object.assign(files,woodsPrefabs());
 const polygon=(points:readonly (readonly number[])[])=>points.map(p=>p.join(',')).join(' ');
 let body=`<defs><radialGradient id="grass"><stop stop-color="#759d4a"/><stop offset="1" stop-color="#234e36"/></radialGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="#28c1df"/><stop offset="1" stop-color="#1769a6"/></linearGradient><pattern id="ripples" width="55" height="39" patternUnits="userSpaceOnUse"><path d="M5 12q10 5 20 0M30 31h14" fill="none" stroke="#9be5e6" stroke-width="2" opacity=".45"/></pattern></defs><rect width="1536" height="1024" fill="url(#grass)"/>`;
 for(const points of woodsGeometry.rivers)body+=`<polygon points="${polygon(points)}" fill="url(#water)" stroke="#58675c" stroke-width="22"/><polygon points="${polygon(points)}" fill="url(#ripples)"/>`;
 for(const points of woodsGeometry.cliffs)body+=`<polygon points="${polygon(points)}" fill="#646d75" stroke="#3e4b52" stroke-width="9"/>`;
 for(let x=30;x<1536;x+=66){body+=`<path d="M${x-35} 45l7-30 21-24 22 16 21 38z" fill="#778179" stroke="#40554e" stroke-width="2"/><path d="M${x-28} 15l21 9V-9M${x-7} 24l43 21M${x-7} 24l22-18" fill="none" stroke="#a1ac98" stroke-width="2"/><path d="M${x-29} 37l10-9 11 6 15-3 6 11z" fill="#567846"/>`;}
 // Broad curved tracks and irregular forest floors replace the geometric clearings.
 const north='M790 70C835 170 738 275 790 405L790 475';
 const south='M790 600C825 680 740 745 790 940';
 const cross='M100 510C230 460 360 545 490 510S680 485 790 535C960 590 1060 460 1205 505S1360 535 1430 510';
 for(const d of [north,south,cross])body+=`<path d="${d}" fill="none" stroke="#45683c" stroke-width="112" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#8c7848" stroke-width="94" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#b89a5e" stroke-width="79" stroke-linecap="round"/>`;
 const clearing=(cx:number,cy:number,rx:number,ry:number,seed:number)=>{
 const points=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12,r=1+Math.sin(i*1.7+seed)*.035+Math.cos(i*.9)*.035;return [cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r];});
 let d=`M${points[0][0]} ${points[0][1]}`;for(let i=0;i<points.length;i++){const n=points.length,a=points[(i+n-1)%n],b=points[i],c=points[(i+1)%n],e=points[(i+2)%n];d+=`C${b[0]+(c[0]-a[0])/6} ${b[1]+(c[1]-a[1])/6} ${c[0]-(e[0]-b[0])/6} ${c[1]-(e[1]-b[1])/6} ${c[0]} ${c[1]}`;}return d+'Z';};
 for(const [x,y,rx,ry,seed]of [[768,215,170,165,1],[340,485,195,145,2],[1210,485,165,145,3],[790,815,175,115,4]]){
 const d=clearing(x,y,rx,ry,seed);body+=`<path d="${d}" fill="#a48b55" stroke="#547543" stroke-width="15"/><path d="${d}" fill="#ad925a" stroke="#b39a60" stroke-width="3"/>`;
 for(let i=0;i<90;i++){const a=i*2.399,r=Math.sqrt((i+.5)/90),px=x+Math.cos(a)*rx*r*.93,py=y+Math.sin(a)*ry*r*.93;body+=`<ellipse cx="${px}" cy="${py}" rx="${3+i%7}" ry="${1+i%3}" fill="${['#bca068','#8e8051','#c6ac74'][i%3]}" opacity=".6"/>`;}
 }
 // Cracked, mossy stone boss arena, with individual radial blocks.
 body+='<ellipse cx="790" cy="820" rx="155" ry="102" fill="#555f58" stroke="#40583b" stroke-width="12"/>';
 for(let row=0;row<5;row++)for(let col=0;col<9;col++){const x=647+col*33+(row%2)*12,y=740+row*33;if(((x+15-790)/145)**2+((y+13-820)/90)**2>1)continue;body+=`<path d="M${x+2} ${y}l27 1 3 22-9 6-22-3-1-17z" fill="${['#95917c','#838573','#a19a82'][col%3]}" stroke="#586459" stroke-width="2"/><path d="M${x+5} ${y+3}h18M${x+9} ${y+11}l7 3-3 8" fill="none" stroke="#b4ad91" stroke-width="1.2"/>`;}
 for(let i=0;i<24;i++){const a=i*Math.PI/12,x=790+Math.cos(a)*150,y=820+Math.sin(a)*98;body+=`<path d="M${x-9} ${y-5}l19 1 2 10-18 2z" fill="#96967d" stroke="#576451" stroke-width="2"/>`;}
 body+='<path d="M751 823l38-26 39 26-38 27zM769 823l20-13 21 13-20 15z" fill="none" stroke="#a7ac83" stroke-width="3"/>';
 for(let i=0;i<130;i++){const x=150+(i*167)%1230,y=120+(i*107)%790;if(Math.abs(x-790)<145&&y>420&&y<640)continue;const habitat=[[768,215,160,150],[340,485,180,130],[1210,485,155,125],[790,815,160,100]].some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1);if(habitat||Math.abs(x-790)<35||Math.abs(y-510)<35)body+=`<ellipse cx="${x}" cy="${y}" rx="${2+i%4}" ry="${1+i%2}" fill="${i%2?'#d1b278':'#9b8659'}"/>`;}
 body+='<path d="M672 458l226 5 36 32-4 110-32 39-232-5-28-37 2-113z" fill="#7e8a70" stroke="#4d6452" stroke-width="8"/>';
 for(let y=475;y<635;y+=24)for(let x=650;x<920;x+=30){const j=((x+y)%7)-3;body+=`<path d="M${x+2} ${y}l25 ${j} 2 20-27 2z" fill="${(x+y)%4?'#ada78c':'#999e80'}" stroke="#7f8b72" stroke-width="1.4"/><path d="M${x+4} ${y+3}h18" stroke="#c4b99b" stroke-width="1"/>`;}
 body+='<ellipse cx="792" cy="557" rx="94" ry="57" fill="none" stroke="#bdad88" stroke-width="4"/><ellipse cx="792" cy="557" rx="107" ry="67" fill="none" stroke="#6b7b63" stroke-width="2"/>';
 for(let i=0;i<260;i++){const x=120+(i*173)%1290,y=70+(i*97)%850;if(Math.abs(x-790)<75||Math.abs(y-510)<65)continue;body+=`<path d="M${x} ${y}l-3-8 7 5 4-7 1 10" fill="none" stroke="#8ca959" stroke-width="2"/>`;}
 // Pebbled banks, reeds, lily pads and three foaming cascades follow the river edge.
 for(let i=0;i<62;i++){const y=i*16+10;for(const right of [false,true]){const x=right?1434+Math.sin(y/64*.95)*19:104+Math.sin(y/64*1.15)*19;const sign=right?1:-1;body+=`<path d="M${x-10} ${y+7}l-3-14 10-8 13 5 4 14-11 9z" fill="${i%3?'#657870':'#869382'}" stroke="#3d5550" stroke-width="2"/><path d="M${x-6} ${y-7}l8-3 5 4" fill="none" stroke="#a7b3a1"/>`;
 if(i%3===0)body+=`<path d="M${x+sign*24} ${y+8}q-7-15-5-23m5 23q9-18 7-27m-7 27v-29" fill="none" stroke="#88a454" stroke-width="2"/><ellipse cx="${x+sign*47}" cy="${y+5}" rx="11" ry="6" fill="#80ad48" stroke="#3d7544"/><path d="M${x+sign*47} ${y+5}l8-4" stroke="#d3cf6b"/>`;}}
 for(const [x,y,w]of [[42,160,42],[1465,245,40],[50,695,40]]){body+=`<path d="M${x-4} ${y-35}h${w+8}v39h-${w+8}z" fill="#626d76" stroke="#3a5058" stroke-width="3"/><path d="M${x} ${y-27}q${w/2} 8 ${w} 0v65q-${w/2} 10-${w} 0z" fill="#4bcce1"/>`;for(let i=0;i<5;i++)body+=`<path d="M${x+4+i*7} ${y-22}v${48+i%2*8}" stroke="#c0f0e4" stroke-width="3"/>`;body+=`<ellipse cx="${x+w/2}" cy="${y+42}" rx="${w*.7}" ry="10" fill="#bbf1df" opacity=".8"/><ellipse cx="${x+w/2}" cy="${y+45}" rx="${w*.95}" ry="15" fill="none" stroke="#8de8e1" stroke-width="2"/>`;}
 for(const points of woodsGeometry.bridges){const [x,y]=points[0],w=points[1][0]-x,h=points[2][1]-y;body+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#725132" stroke="#503f2c" stroke-width="5"/>`;for(let dx=4;dx<w;dx+=12)body+=`<path d="M${x+dx} ${y+2}h10v${h-4}h-10z" fill="#b18a4b" stroke="#705334"/><path d="M${x+dx+3} ${y+6}v${h-14}" stroke="#d3ac65"/>`;for(const by of [y-4,y+h+4])body+=`<path d="M${x+4} ${by}q${w/2} 12 ${w-8} 0" fill="none" stroke="#d8be7a" stroke-width="3"/>`;}
 // Weathered wooden thresholds connect each habitat without obstructing its entrance.
 for(const [x,y,w,h]of [[725,313,130,43],[727,665,130,43],[495,487,90,38],[995,487,90,38]]){
 body+=`<path d="M${x-4} ${y+8}h${w+8}v${h}h-${w+8}z" fill="#3d4c35" opacity=".35"/>`;
 for(let i=0;i<w;i+=13)body+=`<path d="M${x+i} ${y}l11 1-1 ${h-3}-11 2z" fill="${i%2?'#a7804b':'#ba945a'}" stroke="#725338" stroke-width="1.5"/><path d="M${x+i+3} ${y+6}v${h-15}" stroke="#d4ae6d" stroke-width="1"/>`;
 }
 files['base.svg']=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">${body}</svg>`;
 files['full-map.svg']=composeIslandSvg(files['base.svg'],woodsObjects,files,'woods-');return files;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
const folder=fileURLToPath(new URL('../assets/maps/whispering-woods/svg/',import.meta.url));mkdirSync(folder,{recursive:true});for(const [name,svg]of Object.entries(woodsSvgFiles()))writeFileSync(folder+name,svg);

}
