import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const folder=fileURLToPath(new URL('../assets/monsters/svg/',import.meta.url));mkdirSync(folder,{recursive:true});
for(const kind of ['spider','boar','bear'])for(const direction of ['down','left','right','up'])for(const motion of ['idle','walk'])for(let frame=0;frame<4;frame++){
 const phase=motion==='walk'?Math.sin(frame*Math.PI/2)*6:Math.sin(frame*Math.PI/2)*1.2;
 const side=direction==='left'||direction==='right',back=direction==='up';let body='';
 if(kind==='spider'){
 for(let i=0;i<4;i++)for(const sign of [-1,1]){const y=42+i*12,step=phase*(i%2?1:-1);body+=`<path d="M${64+sign*12} ${y}l${sign*25} ${-15+step} ${sign*16} ${27-step}" fill="none" stroke="#252238" stroke-width="9"/><path d="M${64+sign*12} ${y}l${sign*25} ${-15+step} ${sign*16} ${27-step}" fill="none" stroke="#98644c" stroke-width="4"/>`;}
 body+=`<ellipse cx="64" cy="${45+phase*.15}" rx="25" ry="28" fill="url(#body)"/><path d="M54 30l10 11 10-11-10 27z" fill="#bb4f55"/><ellipse cx="64" cy="73" rx="21" ry="18" fill="#443149"/><path d="M52 85l-5 11 12-7M75 85l5 11-12-7" fill="#ead9b0"/>`;
 if(!back)for(const [x,y,rad]of [[55,72,4],[73,72,4],[48,66,2],[80,66,2]])body+=`<circle cx="${x}" cy="${y}" r="${rad}" fill="#ff9d58" stroke="#6b303c"/>`;
 }else{
 const bear=kind==='bear',fur=bear?'#785137':'#62402e';
 for(const [x,y,sign]of [[38,80,1],[82,80,-1],[45,92,-1],[83,92,1]])body+=`<path d="M${x} ${y-13}v${20+phase*sign}q8 8 18 0v-20z" fill="${fur}"/><path d="M${x+4} ${y+9+phase*sign}h11" stroke="#d1b48b" stroke-width="3"/>`;
 body+=`<ellipse cx="64" cy="65" rx="${side?43:34}" ry="33" fill="url(#body)"/><path d="M40 42q18-17 43-4" fill="none" stroke="#ac7c4a" stroke-width="5"/>`;
 const hx=side?88:64,hy=back?42:70;
 body+=`<circle cx="${hx-18}" cy="${hy-21}" r="10" fill="${fur}"/><circle cx="${hx+18}" cy="${hy-21}" r="10" fill="${fur}"/><ellipse cx="${hx}" cy="${hy}" rx="27" ry="26" fill="url(#body)"/>`;
 if(!back){body+=`<ellipse cx="${hx}" cy="${hy+10}" rx="17" ry="12" fill="${bear?'#b88a5b':'#9d7560'}"/><ellipse cx="${hx}" cy="${hy+5}" rx="8" ry="5" fill="#29272a"/>`;
 for(const sign of [-1,1])body+=`<path d="M${hx+sign*18} ${hy+17}q${sign*12} -4 ${sign*5} -20q${sign*2} 13 ${-sign*5} 12z" fill="#f1dfb9"/><circle cx="${hx+sign*12}" cy="${hy-4}" r="3" fill="#f0bb62"/><path d="M${hx+sign*7} ${hy-12}l${sign*11} 3" stroke="#302b29" stroke-width="4"/>`;
 }
 if(bear)body+='<path d="M33 37l-4-12 13 5 5-15 12 14 12-12 4 15 14-2-7 15" fill="#5c863f" stroke="#354934"/>';
 }
 const turn=direction==='left'?'translate(128 0) scale(-1 1)':'';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><radialGradient id="body" cx=".35" cy=".25"><stop stop-color="${kind==='spider'?'#70617b':'#a27649'}"/><stop offset="1" stop-color="${kind==='spider'?'#30283e':'#513a2c'}"/></radialGradient></defs><ellipse cx="64" cy="113" rx="44" ry="9" fill="#152a24" opacity=".25"/><g transform="${turn}" stroke="#302b2b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
 writeFileSync(`${folder}${kind}-${motion}-${direction}-${frame}.svg`,svg);
}
