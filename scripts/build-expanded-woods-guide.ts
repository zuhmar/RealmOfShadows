import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {woodsMap,woodsClearings,woodsTrails,woodsGeometry} from '../packages/game-data/src/woods';
const polygon=(points:readonly (readonly [number,number])[],fill:string)=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}"/>`;
export function expandedWoodsGuide(){let body=`<rect width="2304" height="1536" fill="#256747"/>`;
for(const trail of woodsTrails)body+=`<polyline points="${trail.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#d3a056" stroke-width="145" stroke-linecap="round" stroke-linejoin="round"/>`;
for(const c of woodsClearings)body+=`<ellipse cx="${c.x}" cy="${c.y}" rx="${c.rx}" ry="${c.ry}" fill="#d3a056"/>`;
for(const river of woodsGeometry.rivers)body+=polygon(river,'#178aa9');
for(const cliff of woodsGeometry.cliffs)body+=polygon(cliff,'#778384');
for(const bridge of woodsGeometry.bridges)body+=polygon(bridge,'#946639');
body+='<rect x="640" y="450" width="300" height="205" rx="25" fill="#8b9290" stroke="#455551" stroke-width="10"/><ellipse cx="792" cy="557" rx="100" ry="65" fill="none" stroke="#c7b173" stroke-width="7"/><ellipse cx="1550" cy="1290" rx="200" ry="140" fill="#8b9290" stroke="#455551" stroke-width="10"/>';
return `<svg xmlns="http://www.w3.org/2000/svg" width="${woodsMap.width}" height="${woodsMap.height}" viewBox="0 0 2304 1536">${body}</svg>`;}
if(process.argv[1]===fileURLToPath(import.meta.url))writeFileSync('/tmp/expanded-woods-guide.svg',expandedWoodsGuide());
