import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {elderwoodTerrainGeometry as geometry} from '../packages/game-data/src/elderwood';
const destination=new URL('../assets/maps/elderwood/svg/',import.meta.url);
const points=(polygon:readonly (readonly number[])[])=>polygon.map(p=>p.join(',')).join(' ');
const polygon=(p:readonly (readonly number[])[],attributes:string)=>`<polygon points="${points(p)}" ${attributes}/>`;
const defs=`<defs>
 <linearGradient id="grass" x2=".8" y2="1"><stop stop-color="#80b94b"/><stop offset="1" stop-color="#507d3d"/></linearGradient>
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
 const roads=['M765 0V1024','M0 525H1536','M310 160H555Q590 160 590 205V280Q590 325 540 335H270Q240 335 240 390V610L300 650V805Q300 835 335 835H605V670','M950 200H1210V250H1350V390H1200Q1170 390 1170 430V590Q1170 625 1130 625H990V815L1080 900V1024','M435 220V270H590','M1080 220V320H950','M205 248H290L335 290H590','M260 372H335','M120 752H275','M1365 750H1280L1200 670'];
 pieces.push(`<g mask="url(#dry-ground)" fill="none" stroke-linejoin="round" stroke-linecap="round"><g stroke="#9b874e" stroke-width="63" opacity=".65">${roads.map(d=>`<path d="${d}"/>`).join('')}</g><g stroke="#d7b875" stroke-width="55">${roads.map(d=>`<path d="${d}"/>`).join('')}</g><g stroke="#efd59c" stroke-width="3" opacity=".45">${roads.map(d=>`<path d="${d}"/>`).join('')}</g></g>`);
 const plaza='M705 220H825V325H950V675H825V785H705V675H585V325H705Z';
 pieces.push(`<path d="${plaza}" fill="#536b63" stroke="#4d665c" stroke-width="10"/><path d="${plaza}" fill="url(#pavers)" stroke="#ccd0af" stroke-width="4" stroke-linejoin="round"/><ellipse cx="768" cy="503" rx="82" ry="54" fill="#88969a" stroke="#546972" stroke-width="5"/><ellipse cx="768" cy="503" rx="66" ry="43" fill="url(#pavers)" stroke="#d2d2b9" stroke-width="4"/>`);
 for(const [x,y,w,h] of [[630,365,68,100],[840,365,62,100],[630,545,67,86],[840,545,62,86]]){
 pieces.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="17" fill="#62964b" stroke="#94b166" stroke-width="2"/>`);
 for(let i=0;i<6;i++){const cx=x+13+(i*17)%(w-22),cy=y+14+(i*23)%(h-24);pieces.push(`<path d="M${cx-4} ${cy+5}q4-7 8 0" fill="none" stroke="#a2c075" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="${i%2?'#e8d68b':'#e3c4ca'}"/>`);}
 }
 geometry.rivers.forEach((p,i)=>{pieces.push(`<g clip-path="url(#river-${i})" data-river="${i}">${polygon(p,'fill="url(#water)"')}${polygon(p,'fill="url(#waves)"')}${polygon(p,'fill="none" stroke="#52615d" stroke-width="44" stroke-linejoin="round"')}${polygon(p,'fill="none" stroke="#9caa91" stroke-width="29" stroke-linejoin="round"')}`);
 for(let n=0;n<p.length;n++){const a=p[n],b=p[(n+1)%p.length],length=Math.hypot(a[0]-b[0],a[1]-b[1]),count=Math.max(1,Math.floor(length/30));for(let j=0;j<count;j++){const x=a[0]+(b[0]-a[0])*(j+.5)/count,y=a[1]+(b[1]-a[1])*(j+.5)/count;pieces.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="14" ry="10" fill="#a1a58c" stroke="#68766c" stroke-width="2"/>`);}}
 pieces.push('</g>');});
 // Waterfalls stay clipped to the same river collision regions.
 for(const [river,x,y,height] of [[0,132,0,78],[1,130,875,120],[3,1430,642,77]]){
 pieces.push(`<g clip-path="url(#river-${river})"><path d="M${x-15} ${y}q9 ${height/2} 0 ${height}h30q-9 -${height/2} 0 -${height}z" fill="#9edee0"/><path d="M${x-7} ${y}v${height}M${x+4} ${y+3}v${height-3}" fill="none" stroke="#e4f5e9" stroke-width="4"/><ellipse cx="${x}" cy="${y+height}" rx="24" ry="8" fill="#d4f0e5" opacity=".8"/></g>`);
 }
 for(const [river,x,y] of [[0,90,222],[0,182,315],[1,102,685],[1,148,819],[3,1418,867],[3,1385,931]])pieces.push(`<g clip-path="url(#river-${river})"><path d="M${x} ${y}l-9-6a11 8 0 1 0 11-1z" fill="#88b76d" stroke="#56835d" stroke-width="1.5"/><path d="M${x-7} ${y+1}l10 1" stroke="#bdd188" stroke-width="1"/></g>`);
 geometry.cliffs.forEach((p,i)=>{pieces.push(`<g clip-path="url(#cliff-${i})" data-cliff="${i}">${polygon(p,'fill="url(#cliff)" stroke="#536452" stroke-width="5"')}`);for(let x=20;x<1536;x+=35)pieces.push(`<path d="M${x} 0l5 1024" fill="none" stroke="#5d6658" stroke-width="2" opacity=".45"/>`);pieces.push(`<polyline points="${points(p.slice(0,Math.ceil(p.length/2)))}" fill="none" stroke="#a9be7c" stroke-width="15" stroke-linejoin="round"/></g>`);});
 geometry.bridges.forEach((p,i)=>{const x=Math.min(...p.map(v=>v[0])),y=Math.min(...p.map(v=>v[1])),w=Math.max(...p.map(v=>v[0]))-x,h=Math.max(...p.map(v=>v[1]))-y;
 pieces.push(`<g clip-path="url(#bridge-${i})" data-bridge="${i}">${polygon(p,'fill="url(#wood)" stroke="#593f30" stroke-width="6"')}`);for(let px=x+10;px<x+w;px+=12)pieces.push(`<path d="M${px} ${y}v${h}" stroke="#774e32" stroke-width="2"/><path d="M${px+3} ${y+7}v${h-14}" stroke="#e0b675" stroke-width="2" opacity=".6"/>`);pieces.push(`<path d="M${x} ${y+3}h${w}M${x} ${y+h-3}h${w}" stroke="#563c2d" stroke-width="6"/><path d="M${x} ${y+4}h${w}M${x} ${y+h-5}h${w}" stroke="#d6ac6a" stroke-width="2"/></g>`);});
 // Small water highlights and flowers are surface marks, never new obstacles.
 pieces.push('<g fill="none" stroke="#d0efdf" stroke-width="3" opacity=".6"><path d="M105 75q20 11 42 0M68 282q21 9 42 0M68 825q22 10 45 0M1410 847q18 9 40 0"/></g>');
 for(let i=0;i<92;i++){const x=315+(i*137)%890,y=150+(i*97)%680;if(x>570&&x<960&&y>200&&y<800)continue;if((x>305&&x<600&&y<225)||(x>930&&x<1225&&y<225))continue;pieces.push(`<g mask="url(#dry-ground)"><circle cx="${x}" cy="${y}" r="2.4" fill="${i%3===0?'#ead4d1':'#e2d58d'}"/><path d="M${x-3} ${y+5}l3-2 3 2" fill="none" stroke="#b6c982" stroke-width="1.5"/></g>`);}
 pieces.push('</svg>');return pieces.join('\n')+'\n';
}
const propDefs=`<defs><linearGradient id="wood" x2=".8" y2="1"><stop stop-color="#c69758"/><stop offset="1" stop-color="#805335"/></linearGradient><linearGradient id="wall" x2=".7" y2="1"><stop stop-color="#edd3a0"/><stop offset="1" stop-color="#be9d65"/></linearGradient><linearGradient id="blue" x2=".6" y2="1"><stop stop-color="#649ec3"/><stop offset="1" stop-color="#2d577a"/></linearGradient><linearGradient id="red" x2=".7" y2="1"><stop stop-color="#ce7461"/><stop offset="1" stop-color="#8d3b38"/></linearGradient><radialGradient id="light"><stop stop-color="#fff1a7"/><stop offset="1" stop-color="#e5a64f"/></radialGradient><linearGradient id="stone" x2=".7" y2="1"><stop stop-color="#bac3b0"/><stop offset="1" stop-color="#7b8d83"/></linearGradient></defs>`;
function building(kind:'tavern'|'blacksmith'){
 const tavern=kind==='tavern',width=tavern?280:290,height=tavern?187:194,roof=tavern?'blue':'red';
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,propDefs,'<g stroke="#443f33" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'];
 parts.push('<ellipse cx="140" cy="173" rx="119" ry="12" fill="#263d32" opacity=".22" stroke="none"/><rect x="34" y="73" width="212" height="98" rx="7" fill="url(#wall)"/><path d="M38 94h204M38 131h204M58 81v88M222 81v88" fill="none" stroke="#866443" stroke-width="5"/><path d="M30 92l110-79 110 79z" fill="url(#wood)"/><path d="M16 89L138 6l127 83-13 17-113-76-110 77z" fill="url(#'+roof+')"/>');
 for(let i=0;i<4;i++){const y=25+i*17;parts.push(`<path d="M${139-(y-6)*1.48} ${y+9}l${(y-6)*1.48} -${(y-6)*.68} ${((y-6)*1.54)} ${((y-6)*.68)}" fill="none" stroke="${tavern?'#9fbdd0':'#e3a48c'}" stroke-width="2" opacity=".65"/>`);}
 parts.push('<path d="M30 100l109-73 114 75" fill="none" stroke="#e1ba79" stroke-width="6"/><rect x="36" y="4" width="30" height="63" rx="2" fill="url(#stone)"/><path d="M37 19h27M38 37h26M38 53h25M50 5v12M53 21v14M49 39v12" stroke="#6b7b70" stroke-width="2"/><rect x="32" y="2" width="38" height="11" rx="2" fill="#b9c0a9"/>');
 if(tavern){parts.push('<path d="M106 166v-44q0-24 31-24t31 24v44z" fill="url(#wood)"/><path d="M137 102v62M118 111v51M154 111v51" stroke="#785232" stroke-width="2"/><circle cx="157" cy="142" r="3" fill="#e3c577"/><path d="M101 166h75v9H98zM95 176h84v8H93z" fill="url(#stone)"/>');
 for(const x of [72,201])parts.push(`<path d="M${x-18} 134v-22q0-17 18-17t18 17v22z" fill="url(#light)"/><path d="M${x} 98v34M${x-16} 116h32" stroke="#8a653b" stroke-width="3"/>`);
 parts.push('<path d="M224 98h43v47h-43z" fill="#795537" stroke="#d3ac66" stroke-width="3"/><path d="M232 110h18v23h-18zM251 115h7v12h-7" fill="#f3d49b"/><path d="M232 108q8-9 18 0" fill="#fff0cf" stroke-width="2"/>');
 }else{parts.push('<path d="M111 170v-40q0-30 32-30t32 30v40z" fill="#533b36"/><path d="M119 160v-28q0-22 24-22t24 22v28z" fill="#d97841"/><path d="M126 156l4-22 10 8 8-20 12 34z" fill="#ffe19b" stroke="#f7ae5f" stroke-width="2"/><path d="M103 171h80v11h-83zM97 183h91v8H95z" fill="url(#stone)"/><rect x="104" y="54" width="73" height="39" rx="4" fill="#75553d" stroke="#d0ae77"/><path d="M123 62l30 24M148 61l-25 25" stroke="#d1d5bd" stroke-width="5"/><path d="M143 59l12 10M118 59l10 10" stroke="#929e91" stroke-width="7"/><path d="M35 156h50l-8 9H63v15H49v-15h-8z" fill="#8c9e9a"/><path d="M40 156h39" stroke="#d5dfca" stroke-width="3"/>');
 for(const x of [78,213])parts.push(`<path d="M${x-14} 133v-25q0-12 14-12t14 12v25z" fill="url(#light)"/><path d="M${x} 98v33" stroke="#8a653b"/>`);
 }
 for(const x of (tavern?[44,234]:[228]))parts.push(`<ellipse cx="${x}" cy="159" rx="12" ry="7" fill="#c2975c"/><path d="M${x-12} 157v17q12 10 24 0v-17" fill="url(#wood)"/><path d="M${x-11} 162h22M${x-10} 172h20" stroke="#6f7d75" stroke-width="3"/>`);
 parts.push('</g></svg>');return parts.join('\n')+'\n';
}
function portal(){return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="179" viewBox="0 0 200 179">
<defs><linearGradient id="rock" x2=".7" y2="1"><stop stop-color="#c9c7bf"/><stop offset="1" stop-color="#6d7889"/></linearGradient><radialGradient id="vortex"><stop stop-color="#f6c2ff"/><stop offset=".18" stop-color="#bd77e7"/><stop offset=".6" stop-color="#683eac"/><stop offset="1" stop-color="#343467"/></radialGradient><linearGradient id="crystal" x2="1" y2="1"><stop stop-color="#efcfff"/><stop offset=".5" stop-color="#b57ce6"/><stop offset="1" stop-color="#6c4cac"/></linearGradient></defs>
<g stroke="#414959" stroke-width="2.5" stroke-linejoin="round"><ellipse cx="100" cy="136" rx="92" ry="31" fill="#243848" opacity=".2" stroke="none"/><ellipse cx="100" cy="117" rx="87" ry="43" fill="#737e88"/><path d="M13 105v14q87 84 174 0v-14" fill="url(#rock)"/><ellipse cx="100" cy="106" rx="87" ry="46" fill="url(#rock)"/><ellipse cx="100" cy="105" rx="66" ry="34" fill="url(#vortex)" stroke="#d4afea" stroke-width="4"/>
<path d="M48 105q16-32 66-23 42 12 10 39-43 20-61-3-9-24 26-27 31-4 26 13-4 13-23 7" fill="none" stroke="#d3a5f0" stroke-width="3" stroke-linecap="round"/><ellipse cx="100" cy="104" rx="8" ry="5" fill="#f9e4ff" stroke="none"/>
<path d="M27 91l13-17M45 138l9-18M82 150l4-17M121 150l-4-17M159 138l-9-18M176 92l-16-17" stroke="#5d6878"/><path d="M75 146h50v9H75zM72 156h56v9H72zM69 166h62v10H69z" fill="url(#rock)"/>
<path d="M100 4l17 31-17 25-17-25z" fill="url(#crystal)"/><path d="M100 4v56l17-25z" fill="#8654bd" opacity=".65" stroke="none"/><path d="M84 62h32v15H84z" fill="url(#rock)"/>
<path d="M26 53l13 25-13 20-13-20zM174 53l13 25-13 20-13-20z" fill="url(#crystal)"/><path d="M18 100h17v10H18zM165 100h17v10h-17z" fill="url(#rock)"/>
<path d="M49 132q11-7 17 0M133 132q11-7 17 0" fill="none" stroke="#94ad75" stroke-width="7"/><circle cx="55" cy="129" r="2" fill="#eac9d5" stroke="none"/><circle cx="144" cy="129" r="2" fill="#eac9d5" stroke="none"/></g></svg>\n`;}
export function elderwoodSvgFiles(){return {'base.svg':base(),'tavern.svg':building('tavern'),'blacksmith.svg':building('blacksmith'),'portal.svg':portal()};}
if(process.argv[1]===fileURLToPath(import.meta.url)){await mkdir(destination,{recursive:true});for(const [name,svg] of Object.entries(elderwoodSvgFiles()))await writeFile(new URL(name,destination),svg);console.log('Built Elderwood SVG ground, tavern, blacksmith and portal from shared map geometry.');}
