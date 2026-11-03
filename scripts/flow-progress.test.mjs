import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('../apps/web/src/features/research-flow/progress-model.js',import.meta.url),'utf8');
const model=vm.runInNewContext(code+'\nFlowProgress',{structuredClone});
const fixture=()=>({stages:[{id:'S2'},{id:'S3'}],tasks:[{id:'T22',stage:'S2'},{id:'b',stage:'S2'},{id:'c',stage:'S2'},{id:'d',stage:'S3'}],edges:{S2:[['T22','b'],['T22','c']],S3:[]}});
test('completing a task activates only ready successors and waits for parallel tasks before advancing substages',()=>{
 const view=fixture(),before={};const first=model.complete(view,'研发','T22',before);
 assert.equal(Object.keys(before).length,0);
 assert.equal(model.status('研发',view.tasks[0],first),'已完成');
 assert.equal(model.status('研发',view.tasks[1],first),'进行中');
 assert.equal(model.status('研发',view.tasks[2],first),'进行中');
 assert.equal(model.status('研发',view.tasks[3],first),'待开始');
 const second=model.complete(view,'研发','b',first);
 assert.equal(model.status('研发',view.tasks[3],second),'待开始');
 const third=model.complete(view,'研发','c',second);
 assert.equal(model.status('研发',view.tasks[3],third),'进行中');
 const last=model.complete(view,'研发','d',third);
 assert.equal(model.aggregate(view.tasks,t=>model.status('研发',t,last)),'已完成');
});
test('delivery checkboxes depend on matching assets rather than task completion or unrelated files',()=>{
 const d={id:'D1',description:'SOP文档'};
 assert.equal(model.match(d,[]),undefined);
 assert.equal(model.match(d,[{name:'无关文件.md',deliveryId:''}]),undefined);
 assert.equal(model.match({id:'',description:'SOP文档'},[{name:'无关文件.md',deliveryId:''}]),undefined);
 assert.equal(model.match(d,[{name:'SOP.md'}]).name,'SOP.md');
 assert.equal(model.match(d,[{name:'已审批方案.pdf',deliveryId:'D1'}]).name,'已审批方案.pdf');
 assert.equal(model.match({id:'D2',description:'测试记录'},[{name:'测试记录.xlsx'}]).name,'测试记录.xlsx');
});
test('phase and task baseline states stay independent from editable definitions',()=>{
 assert.equal(model.status('项目立项',{id:'P1T3',stage:'P1'}),'已完成');
 assert.equal(model.status('量产',{id:'L1T1',stage:'L1'}),'待开始');
 assert.equal(model.status('研发',{id:'T21',stage:'S2'}),'已完成');
 assert.equal(model.status('研发',{id:'T22',stage:'S2'}),'进行中');
 assert.equal(model.status('研发',{id:'T23',stage:'S2'}),'待开始');
 assert.equal(model.aggregate([],()=>''),'待开始');
});


test('pending or already-completed tasks cannot be completed directly',()=>{
 const view=fixture();assert.throws(()=>model.complete(view,'研发','b'),/仅进行中/);
 const records=model.complete(view,'研发','T22');assert.throws(()=>model.complete(view,'研发','T22',records),/仅进行中/);
 assert.equal(model.status('研发',{id:'T20',stage:'S2'}),'进行中');
});
