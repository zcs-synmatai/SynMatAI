import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../apps/web/src/features/workflow/node-quick-edit-model.js',import.meta.url),'utf8');
const M=vm.runInNewContext(source+';NodeQuickEditModel');
test('Agent presets create pending tasks with named Agents and a human collaborator',()=>{
 for(const type of ['数据分析Agent','调研Agent','DOE实验设计Agent']){const t=M.create(type);assert.equal(t.executionMode,'ai');assert.match(t.owner,/Agent$/);assert.equal(t.done,false);assert.equal(t.status,'todo');assert.deepEqual(Array.from(t.collaborators),['林晓']);assert.equal(t.outputs.length,0)}
 assert.equal(M.create('DOE实验设计Agent').type,'DOE设计');
});
test('experiment creation is a human plan without a fabricated experiment identity or record',()=>{
 const t=M.create('实验ELN');assert.equal(t.plannedExperiment,true);assert.equal(t.executionMode,'human');assert.equal(t.type,'实验');assert.equal(t.experimentId,undefined);assert.equal(t.outputs.length,0);
});
test('hover edits validate title, assignment and physical experiment boundaries',()=>{
 assert.throws(()=>M.validate({title:' ',executionMode:'human',owner:'林晓'}),/标题/);assert.throws(()=>M.validate({title:'任务',executionMode:'ai',owner:'林晓'}),/具名/);assert.throws(()=>M.validate({title:'实验',executionMode:'ai',owner:'数据分析 Agent'},{humanOnly:true}),/人工/);const v=M.validate({title:' 数据核查 ',executionMode:'ai',owner:'数据分析 Agent'});assert.equal(v.title,'数据核查');assert.equal(v.owner,'数据分析 Agent');assert.throws(()=>M.validate({title:'任务',executionMode:'human',owner:'数据分析 Agent'}),/人工负责人/);
});
