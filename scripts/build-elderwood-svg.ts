import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {islandPrefabs,composeIslandSvg} from './island-svg';
import {elderwoodObjects,elderwoodTerrainGeometry as geometry} from '../packages/game-data/src/elderwood';
const destination=new URL('../assets/maps/elderwood/svg/',import.meta.url);
const points=(polygon:readonly (readonly number[])[])=>polygon.map(p=>p.join(',')).join(' ');
const polygon=(p:readonly (readonly number[])[],attributes:string)=>`<polygon points="${points(p)}" ${attributes}/>`;
const defs=`<defs>
 <linearGradient id="grass" x2=".8" y2="1"><stop stop-color="#6ba949"/><stop offset="1" stop-color="#477c3c"/></linearGradient>
 <linearGradient id="water" x2=".7" y2="1"><stop stop-color="#32bfd0"/><stop offset=".5" stop-color="#208ba8"/><stop offset="1" stop-color="#256184"/></linearGradient>
 <linearGradient id="cliff" x2="0" y2="1"><stop stop-color="#b8b294"/><stop offset=".3" stop-color="#9c9078"/><stop offset="1" stop-color="#625d58"/></linearGradient>
 <linearGradient id="wood" x2=".8" y2="1"><stop stop-color="#c48b4e"/><stop offset="1" stop-color="#845438"/></linearGradient>
 <pattern id="meadow" width="91" height="73" patternUnits="userSpaceOnUse"><path d="M12 28l-2-6m2 6 4-4M64 57l-3-5m3 5 4-5" fill="none" stroke="#b9d077" stroke-width="2" opacity=".5"/><circle cx="42" cy="14" r="1.8" fill="#d6dba0" opacity=".65"/><circle cx="73" cy="33" r="1" fill="#3c713e" opacity=".5"/></pattern>
 <pattern id="waves" width="93" height="59" patternUnits="userSpaceOnUse"><path d="M8 18q9-5 18 0t18 0M55 46q10-4 20 0" fill="none" stroke="#b2edf0" stroke-width="2" opacity=".5"/><path d="M25 38h14" stroke="#176684" stroke-width="2" opacity=".35"/></pattern>
 <pattern id="pavers" width="64" height="48" patternUnits="userSpaceOnUse"><rect width="64" height="48" fill="#8e9b98"/><path d="M0 0h32v24H0zm32 0h32v24H32zM-16 24h32v24H-16zm32 0h32v24H16zm32 0h32v24H48z" fill="#acb5ab" stroke="#7f8c88" stroke-width="2"/><path d="M3 3h25M35 3h24M20 27h24" stroke="#d6d8bd" opacity=".6" stroke-width="2"/></pattern>
</defs>`;
function base(){
 const pieces=[`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">`,defs];
 pieces.push(`<defs><mask id="dry-ground"><rect width="1536" height="1024" fill="white"/>${[...geometry.rivers,...geometry.cliffs].map(p=>polygon(p,'fill="black"')).join('')}</mask>`);
 geometry.rivers.forEach((p,i)=>pieces.push(`<clipPath id="river-${i}">${polygon(p,'')}</clipPath>`));
 geometry.cliffs.forEach((p,i)=>pieces.push(`<clipPath id="cliff-${i}">${polygon(p,'')}</clipPath>`));
 geometry.bridges.forEach((p,i)=>pieces.push(`<clipPath id="bridge-${i}">${polygon(p,'')}</clipPath>`));pieces.push('</defs>');
 pieces.push('<rect width="1536" height="1024" fill="url(#grass)"/><rect width="1536" height="1024" fill="url(#meadow)"/>');
 const roads=['M765 0V1024','M0 500H1536','M245 350H600M930 350H1350','M245 350V610H555V350','M970 350V810H1345V350','M275 610V810H610','M435 290V350','M1090 280V350','M970 600H1345','M65 214H175V350','M1465 680H1420V500','M275 935V870','M1182 945V865'];
 pieces.push(`<g mask="url(#dry-ground)" fill="none" stroke-linejoin="round" stroke-linecap="round"><g stroke="#9b874e" stroke-width="53" opacity=".65">${roads.map(d=>`<path d="${d}"/>`).join('')}</g><g stroke="#d7b875" stroke-width="46">${roads.map(d=>`<path d="${d}"/>`).join('')}</g><g stroke="#efd59c" stroke-width="3" opacity=".45">${roads.map(d=>`<path d="${d}"/>`).join('')}</g></g>`);
 const plaza='M710 290H825V310H950V695H825V740H710V695H585V310H710Z';
 pieces.push(`<path d="${plaza}" fill="#536b63" stroke="#4d665c" stroke-width="10"/><path d="${plaza}" fill="url(#pavers)" stroke="#ccd0af" stroke-width="4" stroke-linejoin="round"/><ellipse cx="768" cy="503" rx="82" ry="54" fill="#88969a" stroke="#546972" stroke-width="5"/><ellipse cx="768" cy="503" rx="66" ry="43" fill="url(#pavers)" stroke="#d2d2b9" stroke-width="4"/>`);
 for(const [x,y,w,h] of [[630,365,68,100],[840,365,62,100],[630,545,67,86],[840,545,62,86]]){
 pieces.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="17" fill="#62964b" stroke="#94b166" stroke-width="2"/>`);
 for(let i=0;i<6;i++){const cx=x+13+(i*17)%(w-22),cy=y+14+(i*23)%(h-24);pieces.push(`<path d="M${cx-4} ${cy+5}q4-7 8 0" fill="none" stroke="#a2c075" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="${i%2?'#e8d68b':'#e3c4ca'}"/>`);}
 }
 geometry.rivers.forEach((p,i)=>{pieces.push(`<g clip-path="url(#river-${i})" data-river="${i}">${polygon(p,'fill="url(#water)"')}${polygon(p,'fill="url(#waves)"')}${polygon(p,'fill="none" stroke="#52615d" stroke-width="44" stroke-linejoin="round"')}${polygon(p,'fill="none" stroke="#9caa91" stroke-width="29" stroke-linejoin="round"')}`);
 for(let n=0;n<p.length;n++){const a=p[n],b=p[(n+1)%p.length],length=Math.hypot(a[0]-b[0],a[1]-b[1]),count=Math.max(1,Math.floor(length/30));for(let j=0;j<count;j++){const x=a[0]+(b[0]-a[0])*(j+.5)/count,y=a[1]+(b[1]-a[1])*(j+.5)/count;pieces.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="14" ry="10" fill="#a1a58c" stroke="#68766c" stroke-width="2"/>`);}}
 pieces.push('</g>');});
 // Waterfalls stay clipped to the same river collision regions.
 for(const [river,x,y,height] of [[0,55,50,94],[2,132,920,90],[4,1495,135,105]]){
 pieces.push(`<g clip-path="url(#river-${river})"><path d="M${x-15} ${y}q9 ${height/2} 0 ${height}h30q-9 -${height/2} 0 -${height}z" fill="#9edee0"/><path d="M${x-7} ${y}v${height}M${x+4} ${y+3}v${height-3}" fill="none" stroke="#e4f5e9" stroke-width="4"/><ellipse cx="${x}" cy="${y+height}" rx="24" ry="8" fill="#d4f0e5" opacity=".8"/></g>`);
 }
 for(const [river,x,y] of [[0,55,285],[0,92,335],[2,120,970],[2,500,990],[3,1020,981],[4,1500,720]])pieces.push(`<g clip-path="url(#river-${river})"><path d="M${x} ${y}l-9-6a11 8 0 1 0 11-1z" fill="#88b76d" stroke="#56835d" stroke-width="1.5"/><path d="M${x-7} ${y+1}l10 1" stroke="#bdd188" stroke-width="1"/></g>`);
 geometry.cliffs.forEach((p,i)=>{pieces.push(`<g clip-path="url(#cliff-${i})" data-cliff="${i}">${polygon(p,'fill="url(#cliff)" stroke="#536452" stroke-width="5"')}`);for(let x=20;x<1536;x+=35)pieces.push(`<path d="M${x} 0l5 1024" fill="none" stroke="#5d6658" stroke-width="2" opacity=".45"/>`);pieces.push(`<polyline points="${points(p.slice(0,Math.ceil(p.length/2)))}" fill="none" stroke="#a9be7c" stroke-width="15" stroke-linejoin="round"/></g>`);});
 geometry.bridges.forEach((p,i)=>{const x=Math.min(...p.map(v=>v[0])),y=Math.min(...p.map(v=>v[1])),w=Math.max(...p.map(v=>v[0]))-x,h=Math.max(...p.map(v=>v[1]))-y;
 pieces.push(`<g clip-path="url(#bridge-${i})" data-bridge="${i}">${polygon(p,'fill="url(#wood)" stroke="#593f30" stroke-width="6"')}`);for(let px=x+10;px<x+w;px+=12)pieces.push(`<path d="M${px} ${y}v${h}" stroke="#774e32" stroke-width="2"/><path d="M${px+3} ${y+7}v${h-14}" stroke="#e0b675" stroke-width="2" opacity=".6"/>`);pieces.push(`<path d="M${x} ${y+3}h${w}M${x} ${y+h-3}h${w}" stroke="#563c2d" stroke-width="6"/><path d="M${x} ${y+4}h${w}M${x} ${y+h-5}h${w}" stroke="#d6ac6a" stroke-width="2"/></g>`);});
 // Small water highlights and flowers are surface marks, never new obstacles.
 pieces.push('<g fill="none" stroke="#d0efdf" stroke-width="3" opacity=".6"><path d="M105 75q20 11 42 0M68 282q21 9 42 0M68 825q22 10 45 0M1410 847q18 9 40 0"/></g>');
 for(let i=0;i<92;i++){const x=315+(i*137)%890,y=150+(i*97)%680;if(x>570&&x<960&&y>200&&y<800)continue;if((x>305&&x<600&&y<225)||(x>930&&x<1225&&y<225))continue;pieces.push(`<g mask="url(#dry-ground)"><circle cx="${x}" cy="${y}" r="2.4" fill="${i%3===0?'#ead4d1':'#e2d58d'}"/><path d="M${x-3} ${y+5}l3-2 3 2" fill="none" stroke="#b6c982" stroke-width="1.5"/></g>`);}
 pieces.push('</svg>');return pieces.join('\n')+'\n';
}
function portal(){return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="179" viewBox="0 0 200 179"><defs><linearGradient id="stone" x2=".7" y2="1"><stop stop-color="#a9b2ac"/><stop offset="1" stop-color="#5a6572"/></linearGradient><radialGradient id="vortex"><stop stop-color="#f0c2ff"/><stop offset=".2" stop-color="#c089ed"/><stop offset=".65" stop-color="#754caf"/><stop offset="1" stop-color="#3b3c6b"/></radialGradient></defs><g stroke="#3e4853" stroke-width="2.5" stroke-linejoin="round"><ellipse cx="100" cy="146" rx="85" ry="28" fill="#637282"/><ellipse cx="100" cy="138" rx="83" ry="27" fill="url(#stone)"/><path d="M49 135V68q0-51 51-51t51 51v67h-19V70q0-32-32-32T68 70v65z" fill="url(#stone)"/><path d="M100 4l14 17-14 16-14-16zM50 41l14 13-13 20-13-16zM150 41l12 17-13 16-13-20z" fill="#768495"/><ellipse cx="100" cy="88" rx="31" ry="46" fill="url(#vortex)" stroke="#bba1db" stroke-width="3"/><path d="M79 81q14-37 33-16 21 31-6 49-25 7-25-15-1-26 18-25 18 6 8 22-10 8-15-1" fill="none" stroke="#e2b8f3" stroke-width="3"/><circle cx="99" cy="89" r="5" fill="#f8ddff"/><path d="M52 67h15M48 89h18M49 113h18M133 67h15M134 89h18M134 113h17M83 24l5 16M118 24l-5 16" stroke="#3f4c5a"/><path d="M26 133l9-30 10 30-10 13zM155 133l10-30 10 30-10 13z" fill="#b88cde"/><path d="M63 145h74v8H63zM57 154h86v9H57zM50 164h100v11H50z" fill="url(#stone)"/><path d="M28 148l15 3M157 151l15-3" stroke="#74a560" stroke-width="7"/></g></svg>\n`;}
export function elderwoodSvgFiles(){const files:Record<string,string>={'base.svg':base(),...islandPrefabs(),'portal.svg':portal()};files['full-map.svg']=composeIslandSvg(files['base.svg'],elderwoodObjects,files,'elderwood-');return files;}
if(process.argv[1]===fileURLToPath(import.meta.url)){await mkdir(destination,{recursive:true});for(const [name,svg] of Object.entries(elderwoodSvgFiles()))await writeFile(new URL(name,destination),svg);console.log('Built full reference-driven Elderwood island, depth-sorted props and standalone SVG map.');}
