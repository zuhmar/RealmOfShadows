import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {woodsObjects,woodsGeometry} from '../packages/game-data/src/woods';
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
 // Shared portal artwork retains exactly the same interaction point as every island.
  const elder=fileURLToPath(new URL('../assets/maps/elderwood/svg/portal.svg',import.meta.url));
 files['portal.svg']=readFileSync(elder,'utf8');
 const polygon=(points:readonly (readonly number[])[])=>points.map(p=>p.join(',')).join(' ');
 let body=`<defs><radialGradient id="grass"><stop stop-color="#72964b"/><stop offset="1" stop-color="#284b37"/></radialGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="#28c1df"/><stop offset="1" stop-color="#1769a6"/></linearGradient><pattern id="ripples" width="55" height="39" patternUnits="userSpaceOnUse"><path d="M5 12q10 5 20 0M30 31h14" fill="none" stroke="#9be5e6" stroke-width="2" opacity=".45"/></pattern></defs><rect width="1536" height="1024" fill="url(#grass)"/>`;
 for(const points of woodsGeometry.rivers)body+=`<polygon points="${polygon(points)}" fill="url(#water)" stroke="#58675c" stroke-width="22"/><polygon points="${polygon(points)}" fill="url(#ripples)"/>`;
 for(const points of woodsGeometry.cliffs)body+=`<polygon points="${polygon(points)}" fill="#646d75" stroke="#3e4b52" stroke-width="9"/>`;
 body+='<g fill="none" stroke-linecap="round"><path d="M790 85V930M105 510H1430" stroke="#947449" stroke-width="100"/><path d="M790 85V930M105 510H1430" stroke="#c5a366" stroke-width="86"/></g>';
 for(const [x,y,rx,ry] of [[768,215,170,165],[340,485,195,145],[1210,485,165,145],[790,815,175,115]])body+=`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#b79a5d" stroke="#8c8050" stroke-width="10"/>`;
 body+='<ellipse cx="790" cy="820" rx="150" ry="99" fill="#7c7e76" stroke="#a9a794" stroke-width="12"/>';
 for(let i=0;i<36;i++){const a=i*Math.PI/18;body+=`<path d="M${790+Math.cos(a)*130} ${820+Math.sin(a)*84}l8 2-3 7-9-2z" fill="#a8a595"/>`;}
 for(let i=0;i<130;i++){const x=150+(i*167)%1230,y=120+(i*107)%790;if(Math.abs(x-790)<145&&y>420&&y<640)continue;const habitat=[[768,215,160,150],[340,485,180,130],[1210,485,155,125],[790,815,160,100]].some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1);if(habitat||Math.abs(x-790)<35||Math.abs(y-510)<35)body+=`<ellipse cx="${x}" cy="${y}" rx="${2+i%4}" ry="${1+i%2}" fill="${i%2?'#d1b278':'#9b8659'}"/>`;}
 body+='<rect x="650" y="470" width="280" height="170" rx="24" fill="#a5a48a" stroke="#666e65" stroke-width="8"/>';
 for(let y=480;y<630;y+=24)for(let x=660;x<920;x+=32)body+=`<rect x="${x}" y="${y}" width="30" height="22" rx="3" fill="#b9b29a" stroke="#8f9685"/>`;
 for(let i=0;i<260;i++){const x=120+(i*173)%1290,y=70+(i*97)%850;if(Math.abs(x-790)<75||Math.abs(y-510)<65)continue;body+=`<path d="M${x} ${y}l-3-8 7 5 4-7 1 10" fill="none" stroke="#8ca959" stroke-width="2"/>`;}
 for(const points of woodsGeometry.bridges){const [x,y]=points[0],w=points[1][0]-x,h=points[2][1]-y;body+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#aa7c43" stroke="#604b31" stroke-width="5"/>`;for(let dx=8;dx<w;dx+=12)body+=`<path d="M${x+dx} ${y+2}v${h-4}" stroke="#654b31" stroke-width="2"/>`;}
 files['base.svg']=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">${body}</svg>`;
 files['full-map.svg']=composeIslandSvg(files['base.svg'],woodsObjects,files,'woods-');return files;
}
import {readFileSync} from 'node:fs';
if(process.argv[1]===fileURLToPath(import.meta.url)){
const folder=fileURLToPath(new URL('../assets/maps/whispering-woods/svg/',import.meta.url));mkdirSync(folder,{recursive:true});for(const [name,svg]of Object.entries(woodsSvgFiles()))writeFileSync(folder+name,svg);

}
