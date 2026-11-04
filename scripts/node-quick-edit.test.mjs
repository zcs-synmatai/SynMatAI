import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../apps/web/src/features/workflow/node-quick-edit-model.js',import.meta.url),'utf8');
const M=vm.runInNewContext(source+';NodeQuickEditModel');
test('Agent presets create pending tasks with named Agents and a human collaborator',()=>{
 for(const type of ['数据分析Agent','调研Agent']){const t=M.create(type);assert.equal(t.executionMode,'ai');assert.match(t.owner,/Agent$/);assert.equal(t.done,false);assert.equal(t.status,'todo');assert.deepEqual(Array.from(t.collaborators),['林晓']);assert.equal(t.outputs.length,0)}
 assert.equal(M.create('数据分析Agent').type,'分析节点');
 assert.equal(M.create('调研Agent').type,'调研节点');
});
test('experiment creation is a human plan without a fabricated experiment identity or record',()=>{
 const t=M.create('实验ELN');assert.equal(t.plannedExperiment,true);assert.equal(t.executionMode,'human');assert.equal(t.type,'实验节点');assert.equal(t.experimentId,undefined);assert.equal(t.outputs.length,0);
});
test('simulation creation uses the named simulation Agent without executing a real calculation',()=>{
 const t=M.create('模拟计算');assert.equal(t.type,'模拟计算');assert.equal(t.executionMode,'simulation');assert.equal(t.owner,'模拟计算 Agent');assert.equal(t.done,false);assert.equal(t.outputs.length,0);
});
test('the editable type set matches the workflow create menu',()=>{
 assert.deepEqual(Array.from(M.types),['结果文件','实验节点','模拟计算','分析节点','调研节点','临时任务']);
 assert.equal(M.normalizeType('文档'),'结果文件');assert.equal(M.normalizeType('测试'),'分析节点');assert.equal(M.normalizeType('自定义'),'临时任务');
});
test('hover edits validate title, assignment and physical experiment boundaries',()=>{
 assert.throws(()=>M.validate({title:' ',type:'临时任务',executionMode:'human',owner:'林晓'}),/标题/);assert.throws(()=>M.validate({title:'任务',type:'分析节点',executionMode:'ai',owner:'林晓'}),/具名/);assert.throws(()=>M.validate({title:'实验',type:'实验节点',executionMode:'ai',owner:'数据分析 Agent'}),/人工/);assert.throws(()=>M.validate({title:'模拟',type:'模拟计算',executionMode:'ai',owner:'模拟计算 Agent'}),/模拟执行/);const v=M.validate({title:' 数据核查 ',type:'分析节点',executionMode:'ai',owner:'数据分析 Agent'});assert.equal(v.title,'数据核查');assert.equal(v.type,'分析节点');assert.equal(v.owner,'数据分析 Agent');assert.throws(()=>M.validate({title:'任务',type:'临时任务',executionMode:'human',owner:'数据分析 Agent'}),/人工负责人/);
});
