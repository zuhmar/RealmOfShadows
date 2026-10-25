import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {generatedFrames} from '../apps/client/src/generated-frames';
test('painted PNG atlases cover every map prop, equipment icon and character layer previously drawn as SVG',()=>{
 const cases=[['assets/maps/elderwood/svg', ['buildings','village'],'elderwood-'],['assets/maps/whispering-woods/svg',['forest'],'woods-'],['assets/items',['items'],'doll-item-'],['assets/characters/paper-doll',['character'],'doll-']] as const;
 for(const [folder,groups,prefix]of cases){const keys=new Set(groups.flatMap(g=>Object.keys(generatedFrames[g])));for(const name of readdirSync(folder).filter(n=>n.endsWith('.svg')&&!['base.svg','full-map.svg'].includes(n)))assert.ok(keys.has(prefix+name.replace('.svg','')),`${folder}/${name} needs generated art`);}
 assert.equal(Object.values(generatedFrames).reduce((n,g)=>n+Object.keys(g).length,0),90);
});
test('atlas crops stay inside the PNG and retain valid original logical canvases and attachment offsets',()=>{
 for(const [group,frames]of Object.entries(generatedFrames)){const png=readFileSync(`assets/generated/${group}.png`);assert.equal(png.subarray(1,4).toString(),'PNG');const width=png.readUInt32BE(16),height=png.readUInt32BE(20);assert.equal(png[25],6,'Sprite atlases need RGBA transparency');
 for(const [key,f]of Object.entries(frames)){const [x,y,w,h]=f.source,[cw,ch]=f.size,[dx,dy,dw,dh]=f.placement;assert.ok([...f.source,...f.size,...f.placement].every(Number.isFinite));assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=width&&y+h<=height,key);assert.ok(cw>0&&ch>0&&dx>=0&&dy>=0&&dw>0&&dh>0&&dx+dw<=cw&&dy+dh<=ch,key);}}
});
