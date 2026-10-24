import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const folder=fileURLToPath(new URL('../assets/monsters/svg/',import.meta.url));mkdirSync(folder,{recursive:true});
const gradient=(kind:string)=>`<defs><radialGradient id="fur" cx=".35" cy=".2" r=".9"><stop stop-color="${kind==='boar'?'#a67c4e':'#9b6d43'}"/><stop offset=".5" stop-color="${kind==='boar'?'#71513a':'#755035'}"/><stop offset="1" stop-color="#3f3029"/></radialGradient><radialGradient id="carapace" cx=".3" cy=".2"><stop stop-color="#66798b"/><stop offset=".45" stop-color="#343d58"/><stop offset="1" stop-color="#1c2538"/></radialGradient><linearGradient id="ivory" x2=".6" y2="1"><stop stop-color="#ffedbd"/><stop offset="1" stop-color="#b9a076"/></linearGradient><radialGradient id="moss"><stop stop-color="#a9b660"/><stop offset="1" stop-color="#3c643f"/></radialGradient></defs>`;
function spider(direction:string,phase:number,attack:number){let s='';
 for(let side of [-1,1])for(let i=0;i<4;i++){const y=54+i*15,step=phase*(i%2?1:-1),root=96+side*17,knee=96+side*(45+i%2*8),end=96+side*(77-i*3);s+=`<path d="M${root} ${y}Q${knee-4*side} ${y-23+step} ${knee} ${y-21+step}L${end} ${y+14-step}l${-side*3} 10" fill="none" stroke="#172335" stroke-width="10"/><path d="M${root} ${y}L${knee} ${y-21+step} ${end} ${y+14-step}" fill="none" stroke="#89704f" stroke-width="5"/><path d="M${root+side*7} ${y-7}l${side*5} -8 ${side*2} 13M${knee} ${y-21+step}l${side*5} -9 2 10" fill="#bbb072" stroke="#415040" stroke-width="1.3"/><circle cx="${knee}" cy="${y-21+step}" r="4" fill="#465370" stroke="#192738"/>`;}
 s+=`<path d="M72 65Q55 34 77 18l19-6 22 9q22 18 0 47l-22 12z" fill="url(#carapace)"/><path d="M77 29l18 4 18-5M72 40l22 7 26-6M73 54l21 8 24-8" fill="none" stroke="#697a8c" stroke-width="2"/><path d="M84 24l12 12 13-11-4 26-9 8-10-9z" fill="#ae4c4f" stroke="#d18158"/><path d="M83 23l-5 7M76 37l-3 8" stroke="#abb6b7" stroke-width="3"/>
 <path d="M74 72l5-14 17 6 17-6 7 15-4 22-20 12-22-11z" fill="url(#carapace)"/><path d="M78 75l17 6 19-6" stroke="#82918e" fill="none"/>
 <path d="M83 96q-17 ${12+attack*6} -7 28l12-12-1-12M109 96q17 ${12+attack*6} 7 28l-12-12 1-12" fill="url(#ivory)" stroke="#4f493d"/><path d="M80 88l-8 10-6-6M112 88l8 10 6-6" fill="none" stroke="#746650" stroke-width="6"/>`;
 for(const [x,y,r]of [[87,87,5],[105,87,5],[78,81,3],[114,81,3],[86,74,2],[105,74,2]])s+=`<circle cx="${x}" cy="${y}" r="${r+1.5}" fill="#192233"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f6a347" stroke="#bd5a3f"/><circle cx="${x-1}" cy="${y-1}" r="1" fill="#fff4bf" stroke="none"/>`;
 const rotation=direction==='up'?180:direction==='right'?-90:direction==='left'?90:0;
 return `<g transform="translate(96 79) rotate(${rotation}) scale(${rotation===90||rotation===-90?.83:1}) translate(-96 -79)">${s}</g>`;
}
function paw(x:number,y:number,phase:number,bear:boolean,far=false){return `<g transform="translate(${x} ${y+phase})"><path d="M-9-22q-6 17-2 30l-4 6 5 5h21l2-6-5-4 2-27z" fill="${far?'#47372d':'url(#fur)'}" transform="scale(${bear?1.35:1} 1)"/><path d="M-7 10q8-4 15 0" fill="none" stroke="#ad8756" stroke-width="2"/>${bear?[-5,0,5].map(dx=>`<path d="M${dx} 14l-1 5 3-2" fill="url(#ivory)" stroke="#6e5a42" stroke-width=".8"/>`).join(''):'<path d="M-10 12l1 7H2v-7M3 12v7h9l-1-7" fill="#32332f"/>'}</g>`;}
function beast(kind:string,direction:string,phase:number,attack:number){const bear=kind==='bear',side=direction==='left'||direction==='right',back=direction==='up';let s='';
 if(side){s+=paw(54,122,-phase,bear,true)+paw(122,120,phase,bear,true);
 s+=`<path d="${bear?'M27 99Q10 53 47 32 80 13 114 39 145 40 155 79l-11 32-93 5z':'M34 90Q25 52 57 40l20-11 8 7 9-7 6 9 12-4 6 13q34 2 40 36l-12 24-19 3-54 1-27-4z'}" fill="url(#fur)"/><path d="M43 81q30-28 63-14" fill="none" stroke="#ba8d52" stroke-width="4"/><path d="${bear?'M34 80l-7 5 6 10':'M37 73l-12-7-3 13 12 8M55 44l6-13 11 8M76 39l8-14 7 12M97 40l6-10 6 14'}" fill="url(#fur)"/>`;
 s+=paw(52,126,phase,bear)+paw(120,125,-phase,bear);
 const hx=137+attack*5,hy=76-attack*3;
 if(bear)s+=`<circle cx="${hx-21}" cy="${hy-24}" r="11" fill="url(#fur)"/><circle cx="${hx+13}" cy="${hy-24}" r="10" fill="url(#fur)"/>`;
 s+=`<path d="${bear?`M${hx-29} ${hy-14}q-3-20 22-20 30-2 35 26l-5 29-36 5-21-20z`:`M${hx-26} ${hy-21}l-9-18 19 6 8-1 12-10 8 21 14 14 8 15-10 18-27 1-23-18z`} " fill="url(#fur)"/><path d="M${hx-22} ${hy-25}l-4-9 9 5M${hx+8} ${hy-22}l6-11 2 11" fill="#af8b67"/>`;
 if(bear)s+=`<path d="M${hx-1} ${hy+2}q24-11 28 7l-4 15-25 1-9-9z" fill="#bd996e"/><path d="M${hx+5} ${hy+14}l21-2-5 15-15-2z" fill="#382c2a"/><path d="M${hx+10} ${hy+15}l3 8 4-8M${hx+21} ${hy+14}l1 7 3-8" fill="url(#ivory)"/><ellipse cx="${hx+20}" cy="${hy+5}" rx="9" ry="6" fill="#282c2a"/>`;
 else s+=`<path d="M${hx} ${hy-2}l25 10 2 17-12 8-19-13-8-10z" fill="#9f7d60"/><ellipse cx="${hx+22}" cy="${hy+18}" rx="11" ry="9" fill="#b09277"/><path d="M${hx+12} ${hy+24}q-16-2-9-23-1 14 14 13z" fill="url(#ivory)"/><path d="M${hx+20} ${hy+17}l2 3M${hx+27} ${hy+16}v4" stroke="#433c33" stroke-width="3"/>`;
 s+=`<path d="M${hx-10} ${hy-6}l12-4" stroke="#332d29" stroke-width="4"/><ellipse cx="${hx-2}" cy="${hy-4}" rx="3.5" ry="3" fill="#e5b55d"/><path d="M${hx-20} ${hy+6}l5 4-5 6 7 2" fill="none" stroke="#b38550" stroke-width="2"/>`;
 }else{
 s+=paw(67,111,phase,bear,true)+paw(121,111,-phase,bear,true);
 s+=`<path d="${bear?'M42 99Q29 44 59 31 94 13 131 33 158 52 149 99l-17 22-71-2z':'M54 93Q38 50 67 33l17-10 11 7 11-9 12 13q31 7 25 59l-12 20-69-1z'}" fill="url(#fur)"/><path d="M58 66l-9-4 6 15-8 3 10 9M134 64l10-4-6 16 10 4-11 10" fill="url(#fur)"/><path d="M64 53q28-24 63 0" fill="none" stroke="#b08752" stroke-width="4"/>`;
 s+=paw(68,128,-phase,bear)+paw(122,128,phase,bear);
 if(back){s+='<path d="M64 45l-5-19 18 6 18-7 21 7 16-9-1 23-12 22-44-2z" fill="url(#fur)"/><path d="M77 35l-6 5 8 6M100 32l-7 9 7 8M116 36l-7 8 7 7" fill="none" stroke="#b38a53" stroke-width="2"/><path d="M90 105q10-10 14 6l-7 12-8-8" fill="#4b382a"/>';}else{
 s+=`<g transform="translate(0 ${-attack*5})">${bear?'<circle cx="65" cy="49" r="13" fill="url(#fur)"/><circle cx="129" cy="49" r="13" fill="url(#fur)"/>':''}<path d="${bear?'M61 73Q54 41 78 40q25-8 48 7 15 17 2 43l-31 18-29-15z':'M66 70l-12-26 24 4 17-5 21 4 21-12-5 34-5 24-30 15-29-15z'}" fill="url(#fur)"/><path d="M64 46l3 12 9-4M123 48l-1 10 7-5" fill="#b38a65"/><path d="M67 78l-6 6 9 5-5 6 14 1M127 77l7 6-9 6 6 6-14 2" fill="url(#fur)"/>
 <path d="M76 84q20-16 41 0l8 17-12 15H83l-13-14z" fill="${bear?'#bd986d':'#9c765a'}"/>`;
 if(bear)s+='<path d="M77 100q20 9 41-1l-6 24H86z" fill="#372b2b"/><path d="M82 104l5 12 4-10M105 107l5 9 5-13" fill="url(#ivory)"/><path d="M90 118q6-6 16 0v5H91z" fill="#ad6f65" stroke="none"/><path d="M85 88q12-7 24 0l-3 10H89z" fill="#282b29"/>';
 else s+='<ellipse cx="97" cy="102" rx="18" ry="13" fill="#b08a6e"/><ellipse cx="90" cy="102" rx="3" ry="4" fill="#453a32"/><ellipse cx="104" cy="102" rx="3" ry="4" fill="#453a32"/><path d="M78 112q-22-6-13-30-3 18 17 20zM117 112q22-6 13-30 3 18-17 20z" fill="url(#ivory)"/>';
 s+='<path d="M73 71l14 5M106 76l14-6" stroke="#342f2b" stroke-width="4"/><ellipse cx="82" cy="80" rx="4" ry="3" fill="#ecc571"/><ellipse cx="112" cy="80" rx="4" ry="3" fill="#ecc571"/><circle cx="83" cy="80" r="1.5" fill="#292f28"/><circle cx="111" cy="80" r="1.5" fill="#292f28"/></g>';
 }
 }
 // Broken fur highlights and moss mantle identify the ancient forest guardian.
 for(let i=0;i<17;i++){const x=58+(i*17)%78,y=46+(i*13)%52;if(!back&&!side&&y>62)continue;s+=`<path d="M${x} ${y}l-3 5 5-1" fill="none" stroke="#b58b54" stroke-width="1.2" opacity=".75"/>`;}
 if(bear){s+='<path d="M53 49l5-16 10 6 5-14 12 9 10-14 10 13 11-5 5 15 15 3-6 13-15-3-10 7-9-9-14 6-11-6-15 3z" fill="url(#moss)" stroke="#34543a"/><path d="M60 43l8-2M79 36l4 8M101 35l3 10M120 45l-7 3" stroke="#c3c778" stroke-width="2"/><path d="M59 48q-14 32 0 50M127 49q15 21 5 45" fill="none" stroke="#537446" stroke-width="3"/><path d="M55 67l-9-2 5 10M136 69l8-4-2 10" fill="#82a150"/>';}
 return `<g transform="${direction==='left'?'translate(192 0) scale(-1 1)':''}">${s}</g>`;
}
for(const kind of ['spider','boar','bear'])for(const direction of ['down','left','right','up'])for(const motion of ['idle','walk','attack'])for(let frame=0;frame<6;frame++){
 const wave=Math.sin(frame*Math.PI/3),phase=motion==='walk'?wave*5:wave*.55,attack=motion==='attack'?Math.max(0,wave):0;
 const body=kind==='spider'?spider(direction,phase,attack):beast(kind,direction,phase,attack);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="160" viewBox="0 0 192 160">${gradient(kind)}<ellipse cx="96" cy="145" rx="${kind==='spider'?70:60}" ry="9" fill="#142c27" opacity=".27"/><g transform="translate(0 ${motion==='walk'?Math.abs(wave)*-2:wave*.5})" stroke="#302f2b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>\n`;
 writeFileSync(`${folder}${kind}-${motion}-${direction}-${frame}.svg`,svg);
}
