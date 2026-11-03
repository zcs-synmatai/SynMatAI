import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../apps/web/src/features/workflow/task-canvas-model.js',import.meta.url),'utf8');
const model=vm.runInNewContext(source+';TaskCanvasModel',{structuredClone});
test('temporary conversations have generated titles without task obligations and retain optional file provenance',()=>{
 const state=model.seed(),chat=model.createConversation(state),second=model.createConversation(state);
 assert.notEqual(chat.id,second.id);assert.equal(chat.name,'临时对话 01');assert.equal(second.name,'临时对话 02');
 for(const field of ['status','done','owner','executionMode'])assert.equal(Object.hasOwn(chat,field),false);
 assert.equal(chat.inputs.length,0);assert.equal(chat.outputs.length,0);
 const rows=[{id:'TODO-001',name:'下游任务',type:'分析',outputs:[]}];
 const result=model.artifact(state,chat.id,'对话纪要.md');
 const scene=model.project(rows,['对话纪要.md'],state);
 assert.ok(scene.edges.some(e=>e[0]===chat.id&&e[1]===result.id));
 state.edges.push(model.connect(scene,result.id,'TODO-001'));
 assert.equal(model.inheritedFiles(model.project(rows,['对话纪要.md'],state),'TODO-001')[0],'对话纪要.md');
 assert.equal(rows.length,1);
 const restored=JSON.parse(JSON.stringify(state));assert.equal(restored.chats[0].id,chat.id);
});

test('conversation context deduplicates direct upstream records and files without merging histories',()=>{
 const state=model.seed(),chat=model.createConversation(state),rows=[{id:'A',name:'路线分析',outputs:['分析.md']},{id:'B',name:'证据核查',outputs:[]}];
 let scene=model.project(rows,['分析.md'],state);
 state.edges.push(model.connect(scene,'A',chat.id),model.connect(scene,'B',chat.id));
 const threads={A:[{user:true,text:'比较路线'},{text:'分析完成',doc:'分析.md'}],B:[{text:'存在证据缺口'}]};
 scene=model.project(rows,['分析.md'],state);
 const context=model.conversationContext(scene,chat.id,threads,name=>name==='分析.md'?'分析内容':null);
 assert.equal(context.length,2);assert.equal(context[0].messages.length,2);assert.equal(context[0].files.length,1);assert.equal(context[0].files[0].text,'分析内容');
 assert.equal(threads[chat.id],undefined);threads.A[0].text='之后修改';assert.equal(context[0].messages[0].text,'比较路线');
 model.removeEdge(state,state.edges[0]);
 const after=model.conversationContext(model.project(rows,['分析.md'],state),chat.id,threads);
 assert.equal(after.length,1);assert.equal(after[0].id,'B');
 assert.equal(context.length,2);
});
