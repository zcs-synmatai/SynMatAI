import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const code=await readFile(new URL('../apps/web/src/features/research-flow/draft-model.js',import.meta.url),'utf8');
const model=vm.runInNewContext(code+'\nFlowDraft',{structuredClone});
const fixture=()=>({tasks:[{id:'a',stage:'S',name:'准备'},{id:'b',stage:'S',name:'验证'},{id:'c',stage:'S',name:'复核'}],edges:{S:[['a','b'],['b','c']]}});

test('manual relationships reject self-links, duplicate edges, cross-stage edges and cycles',()=>{
 assert.equal(model.validate(fixture()),true);
 for(const edge of [['a','a'],['a','b'],['c','a'],['a','missing']]){
  const v=fixture();v.edges.S.push(edge);assert.throws(()=>model.validate(v));
 }
 const v=fixture();v.tasks.push({id:'other',stage:'X',name:'其他阶段'});v.edges.S.push(['a','other']);assert.throws(()=>model.validate(v));
});

test('deleting a node removes only incident edges and never bypasses its dependencies',()=>{
 const source=fixture(),next=model.removeNode(source,'b');
 assert.equal(source.tasks.length,3);
 assert.equal(next.tasks.length,2);
 assert.equal(next.edges.S.length,0);
 assert.ok(!next.edges.S.some(e=>e[0]==='a'&&e[1]==='c'));
 assert.equal(model.validate(next),true);
});

test('layout adapts to added nodes and parallel branches without duplicate positions',()=>{
 const view=fixture();view.tasks.push({id:'d',stage:'S',name:'并行验证'});view.edges.S.push(['a','d'],['d','c']);
 const layout=model.layout(view.tasks,view.edges.S);
 assert.equal(layout.columns,3);assert.equal(layout.rows,2);
 assert.equal(layout.positions.b.column,layout.positions.d.column);
 assert.notEqual(layout.positions.b.rowStart,layout.positions.d.rowStart);
 assert.ok(layout.positions.c.column>layout.positions.b.column);
 view.tasks.push({id:'e',stage:'S',name:'新增归档'});view.edges.S.push(['c','e']);
 const updated=model.layout(view.tasks,view.edges.S);assert.equal(updated.columns,4);
 for(const pos of Object.values(updated.positions))assert.ok(Number.isFinite(pos.column)&&pos.rowEnd>pos.rowStart);
});


test('completed nodes freeze their definition, owner and incident relationships while other edits remain allowed',()=>{
 const source=fixture();source.tasks[0].ownerId='linxiao';
 for(const mutate of [v=>v.tasks[0].name='改名',v=>v.tasks[0].ownerId='wangning',v=>v.tasks.shift(),v=>v.edges.S.shift(),v=>v.edges.S[0].push('新说明'),v=>v.edges.S.push(['a','c'])]){
  const next=structuredClone(source);mutate(next);assert.throws(()=>model.assertCompletedUnchanged(source,next,['a']));
 }
 const next=structuredClone(source);next.tasks[2].ownerId='wangning';next.edges.S[1]=['b','c','补充说明'];assert.equal(model.assertCompletedUnchanged(source,next,['a']),true);
});


test('simulation demonstration overlays T20 before T21 without changing authoritative tasks',()=>{
 const source={stages:[{id:'S2'}],tasks:[{id:'T21',stage:'S2',name:'批料'},{id:'T22',stage:'S2',name:'制板'}],edges:{S2:[['T21','T22']]}};
 const next=model.withSimulationDemo(source);
 assert.equal(source.tasks.length,2);assert.equal(next.tasks.length,3);assert.equal(next.tasks[0].id,'T20');assert.equal(next.tasks[0].name,'计算模拟');assert.equal(next.tasks[0].demo,true);assert.ok(next.edges.S2.some(([a,b])=>a==='T20'&&b==='T21'));assert.equal(model.validate(next),true);
 const again=model.withSimulationDemo(next);assert.equal(again.tasks.length,3);assert.equal(again.edges.S2.length,2);
});

test('creating a dependent task can consume completed output without changing completed definitions or existing links',()=>{
 const before=fixture(),after=structuredClone(before);after.tasks.push({id:'new',custom:true,stage:'S',name:'新增后续任务'});after.edges.S.push(['a','new'],['b','new']);
 assert.throws(()=>model.assertCompletedUnchanged(before,after,['a']));
 assert.equal(model.assertCompletedUnchanged(before,after,['a'],true),true);
 assert.equal(model.assertCompletedUnchanged(after,before,['a'],true),true);
 for(const mutate of [v=>v.tasks[0].name='修改完成节点',v=>v.edges.S.shift(),v=>v.edges.S.push(['new','a'])]){const invalid=structuredClone(after);mutate(invalid);assert.throws(()=>model.assertCompletedUnchanged(before,invalid,['a'],true))}
});

test('deleting unfinished nodes cleans incident edges while preserving completed nodes and supports undo',()=>{
 const before=fixture(),after=model.removeNode(before,'b');
 assert.equal(model.assertCompletedUnchanged(before,after,['a'],false,true),true);
 assert.equal(model.assertCompletedUnchanged(after,before,['a'],false,true),true);
 assert.throws(()=>model.assertCompletedUnchanged(before,model.removeNode(before,'a'),['a'],false,true));
 const changed=structuredClone(after);changed.tasks[0].ownerId='new-owner';assert.throws(()=>model.assertCompletedUnchanged(before,changed,['a'],false,true));
 const retained=structuredClone(before);retained.edges.S[0]=['a','c'];assert.throws(()=>model.assertCompletedUnchanged(before,retained,['a'],false,true));
});
