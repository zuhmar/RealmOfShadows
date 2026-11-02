import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WorldCulling} from '../apps/client/src/world-culling';
test('camera culling preserves roof visibility and other cameras, restores props after moving and zooming',()=>{
 const prop=(x:number,visible=true)=>({cameraFilter:2,visible,getData:()=>false,getBounds:()=>({x,y:0,width:64,height:64})});
 const near=prop(0,false),far=prop(2000),camera={id:1,width:400,height:400,zoom:1,zoomX:1,zoomY:1,scrollX:0,scrollY:0};const cull=new WorldCulling();
 cull.replace([near,far] as any);cull.update(camera as any,0);assert.equal(near.cameraFilter,2);assert.equal(near.visible,false);assert.equal(far.cameraFilter,3);
 camera.scrollX=2000;cull.update(camera as any,101);assert.equal(far.cameraFilter,2);assert.equal(near.cameraFilter,3);
 camera.scrollX=0;camera.zoom=camera.zoomX=camera.zoomY=.1;cull.update(camera as any,102);assert.equal(far.cameraFilter,2);
 cull.replace([near] as any);cull.update(camera as any,103);assert.equal(cull.total,1);
});
