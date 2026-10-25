import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {woodsMap,woodsClearings,woodsTrails,woodsGeometry,woodsHabitats,woodsEncounterSpawns,woodsSpawnTrails,woodsPortal} from '../packages/game-data/src/woods';
const polygon=(points:readonly (readonly [number,number])[],fill:string)=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}"/>`;
export function expandedWoodsGuide(){let body=`<rect width="${woodsMap.width}" height="${woodsMap.height}" fill="#256747"/>`;
for(const trail of woodsTrails)body+=`<polyline points="${trail.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#d3a056" stroke-width="110" stroke-linecap="round" stroke-linejoin="round"/>`;
for(const trail of woodsSpawnTrails)body+=`<polyline points="${trail.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#d3a056" stroke-width="72" stroke-linecap="round"/>`;
for(const c of woodsClearings.filter(c=>!woodsHabitats.some(h=>h.name===c.name)||c.name==='Forest Bear arena'))body+=`<ellipse cx="${c.x}" cy="${c.y}" rx="${c.rx}" ry="${c.ry}" fill="#d3a056"/>`;
for(const s of woodsEncounterSpawns.filter(s=>s.kind!=='bear'))body+=`<ellipse cx="${s.x}" cy="${s.y}" rx="95" ry="75" fill="#d3a056"/>`;
for(const river of woodsGeometry.rivers)body+=polygon(river,'#178aa9');
for(const cliff of woodsGeometry.cliffs)body+=polygon(cliff,'#778384');
for(const bridge of woodsGeometry.bridges)body+=polygon(bridge,'#946639');
body+=`<rect x="${woodsPortal.x*48-152}" y="${(woodsPortal.y-woodsMap.offsetY)*48-134}" width="300" height="205" rx="25" fill="#8b9290" stroke="#455551" stroke-width="10"/><ellipse cx="${woodsPortal.x*48}" cy="${(woodsPortal.y-woodsMap.offsetY)*48-27}" rx="100" ry="65" fill="none" stroke="#c7b173" stroke-width="7"/><ellipse cx="${woodsClearings[4].x}" cy="${woodsClearings[4].y}" rx="${woodsClearings[4].rx-20}" ry="${woodsClearings[4].ry-15}" fill="#8b9290" stroke="#455551" stroke-width="10"/>`;
return `<svg xmlns="http://www.w3.org/2000/svg" width="${woodsMap.width}" height="${woodsMap.height}" viewBox="0 0 ${woodsMap.width} ${woodsMap.height}">${body}</svg>`;}
if(process.argv[1]===fileURLToPath(import.meta.url))writeFileSync('/tmp/expanded-woods-guide.svg',expandedWoodsGuide());
