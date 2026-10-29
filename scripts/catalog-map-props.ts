import {readFileSync,writeFileSync} from 'node:fs';
import {gridMap} from '../packages/game-data/src/grid-world';
const keys=new Set(['elderwood','elderwood-upper','woods','woods-upper','caverns','swamp','woods-depths','caverns-depths'].flatMap(region=>gridMap(region).objects.map(o=>o.key)));
const sizes:Record<string,[number,number]>={};
for(const key of [...keys].sort()){
 const png=readFileSync(new URL(`../assets/world/objects/${key}.png`,import.meta.url));
 sizes[key]=[png.readUInt32BE(16),png.readUInt32BE(20)];
}
writeFileSync(new URL('../packages/game-data/src/map-prop-sizes.json',import.meta.url),JSON.stringify(sizes,null,2)+'\n');
console.log(`Recorded native dimensions for ${keys.size} placed prop textures.`);
