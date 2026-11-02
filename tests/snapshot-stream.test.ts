import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SnapshotStream} from '../apps/server/src/snapshot-stream';
test('snapshot stream keeps clocks flowing and immediately delivers changed state per client',()=>{
 const stream=new SnapshotStream(),messages:{type:string;data:any}[]=[],client={sessionId:'a',send:(type:string,data:unknown)=>messages.push({type,data})};
 const state={time:1,inventory:[{id:'sword',count:1}],houses:[{owner:'A'}]};
 stream.send(client,state);stream.send(client,{...state,time:2});stream.send(client,{...state,time:3,inventory:[{id:'sword',count:2}]});stream.send(client,{...state,time:4,houses:[{owner:'B'}]});
 assert.deepEqual(messages.map(m=>m.type),['economy-state','economy-clock','economy-state','economy-state']);assert.equal(messages[1].data.time,2);
 stream.send({...client,sessionId:'b'},state);assert.equal(messages.at(-1)!.type,'economy-state');stream.forget('a');stream.send(client,state);assert.equal(messages.at(-1)!.type,'economy-state');
});
