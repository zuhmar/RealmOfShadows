import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {elderwoodTerrainGeometry} from '@realm/game-data';
import {elderwoodSvgFiles} from '../scripts/build-elderwood-svg';
// Prevent edits to collision geometry from silently leaving stale artwork.
test('committed Elderwood SVGs match the shared geometry generator and contain only vector artwork',async()=>{
 for(const [name,expected] of Object.entries(elderwoodSvgFiles())){
  const actual=await readFile(new URL(`../assets/maps/elderwood/svg/${name}`,import.meta.url),'utf8');
  assert.equal(actual,expected,`Run npm run art:elderwood after editing geometry or art: ${name}`);
  assert.doesNotMatch(actual,/<image\b|data:image|<script\b|<foreignObject\b/);
  assert.match(actual,/<svg[^>]+viewBox=/);
 }
});
test('every water, cliff and bridge collision outline is represented in the SVG base',async()=>{
 const base=await readFile(new URL('../assets/maps/elderwood/svg/base.svg',import.meta.url),'utf8');
 for(const polygons of Object.values(elderwoodTerrainGeometry))for(const polygon of polygons){
  assert.ok(base.includes(`points="${polygon.map(p=>p.join(',')).join(' ')}"`));
 }
});
