import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WorldChat} from '../apps/server/src/world-chat';
import type {ChatMessage} from '@realm/shared';
test('world chat reaches every connected listener, while party chat is private and absent from public history',()=>{
 const c=new WorldChat(),inboxes=new Map<string,ChatMessage[]>();for(const id of ['a','b','c']){const list:ChatMessage[]=[];inboxes.set(id,list);c.connect(id,`Name ${id}`,m=>list.push(m));}
 assert.equal(c.send('a',{channel:'world',text:'Hello',name:'Fake',sender:'c'},undefined,1000),undefined);for(const list of inboxes.values()){assert.equal(list[0].sender,'a');assert.equal(list[0].name,'Name a');}
 c.send('a',{channel:'party',text:'Private'},['a','b'],2000);assert.equal(inboxes.get('b')!.length,2);assert.equal(inboxes.get('c')!.length,1);assert.equal(c.history().length,1);assert.match(c.send('c',{channel:'party',text:'Spy'},['a','b'],3000)!,/Join/);
 c.disconnect('b');c.send('a',{channel:'world',text:'Again'},undefined,4000);assert.equal(inboxes.get('b')!.length,2);
});
test('chat validates input, retains plain text and limits spam/history growth',()=>{
 const c=new WorldChat();c.connect('a','Player',()=>{});
 assert.ok(c.send('a',{channel:'world',text:'x'.repeat(241)},undefined,0));assert.ok(c.send('a',{channel:'world',text:'\n\t'},undefined,0));assert.ok(c.send('a',{channel:'wrong',text:'No'},undefined,0));
 assert.equal(c.send('a',{channel:'world',text:' <img src=x onerror=alert(1)> '},undefined,0),undefined);assert.equal(c.history()[0].text,'<img src=x onerror=alert(1)>');
 c.send('a',{channel:'world',text:'2'},undefined,0);c.send('a',{channel:'world',text:'3'},undefined,0);assert.match(c.send('a',{channel:'world',text:'4'},undefined,0)!,/wait/);
 for(let i=1;i<=100;i++)assert.equal(c.send('a',{channel:'world',text:String(i)},undefined,i*2000),undefined);assert.equal(c.history().length,80);
});
