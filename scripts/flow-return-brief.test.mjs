import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('../apps/web/src/features/research-flow/return-brief.js',import.meta.url),'utf8');
const model=vm.runInNewContext(code+'\nFlowReturnBrief',{structuredClone});
test('return briefing has two separate pending T22 approvals and only T21/T22 changes',()=>{
 const brief=model.create();assert.equal(JSON.stringify(brief.changedIds),'["T21","T22"]');assert.equal(brief.approvals.length,2);assert.ok(brief.approvals.every(a=>a.node==='T22'&&a.status==='待确认'&&a.files.length));
});
test('quick approval updates only the chosen item and cannot process it twice',()=>{
 const original=model.create(),next=model.decide(original,'sample-plan','已通过','确认示例方案');assert.equal(original.approvals[0].status,'待确认');assert.equal(next.approvals[0].status,'已通过');assert.equal(next.approvals[1].status,'待确认');assert.throws(()=>model.decide(next,'sample-plan','已通过'));assert.equal(next.tasks,undefined);
});
test('returning an approval requires a reason; a fresh demonstration resets only demonstration decisions',()=>{
 const brief=model.create();assert.throws(()=>model.decide(brief,'blank-plan','已退回',' '));assert.throws(()=>model.decide(brief,'missing','已通过'));assert.throws(()=>model.decide(brief,'blank-plan','完成任务'));const next=model.decide(brief,'blank-plan','已退回','请补充关联记录');assert.equal(next.approvals[1].comment,'请补充关联记录');assert.ok(model.create().approvals.every(a=>a.status==='待确认'));
});
