import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const [data,code]=await Promise.all(['../apps/web/src/features/research-flow/data.js','../apps/web/src/features/project-overview/model.js'].map(p=>readFile(new URL(p,import.meta.url),'utf8')));
const {model,source}=vm.runInNewContext(data+'\n'+code+'\n({model:OverviewModel,source:researchFlowData})',{structuredClone});
test('overview keeps 21 source tasks, undated tasks and a genuine 3000h-sized demonstration window',()=>{
 const s=model.seed(source);assert.equal(s.tasks.length,21);assert.equal(s.tasks.filter(t=>t.stage==='S2').length,6);assert.equal(s.tasks.find(t=>t.id==='T24').status,'进行中');assert.equal(s.tasks.find(t=>t.id==='T31').plan,null);assert.equal(s.tasks.find(t=>t.id==='T26').status,'待开始');assert.ok((model.day(model.stages.S5[1])-model.day(model.stages.S5[0])+1)*24>=3000);assert.equal(source.tasks.find(t=>t.id==='T24').status,undefined);
});
test('submitting a failure report updates delivery without selecting routes or releasing downstream work',()=>{
 const before=model.seed(source),after=model.submitReport(before,'未通过');assert.equal(before.r3Report,false);assert.equal(after.r3Report,true);assert.equal(after.r3Result,'未通过');assert.equal(after.tasks.find(t=>t.id==='T24').status,'已完成');assert.equal(after.tasks.find(t=>t.id==='T26').status,'待开始');
});
test('member removal preserves tasks and requires a deliberate owner handover',()=>{
 const before=model.seed(source);assert.throws(()=>model.removeMember(before,'lin',''),/移交/);assert.throws(()=>model.removeMember(before,'wang',undefined),/接手/);assert.throws(()=>model.removeMember(before,'wang','missing'),/不在项目/);
 const reassigned=model.removeMember(before,'wang','chen');assert.equal(reassigned.tasks.length,21);assert.ok(reassigned.tasks.filter(t=>before.tasks.find(n=>n.id===t.id).ownerId==='wang').every(t=>t.ownerId==='chen'));assert.equal(before.members.length,4);
 const unassigned=model.removeMember(before,'wang','');assert.ok(unassigned.tasks.filter(t=>before.tasks.find(n=>n.id===t.id).ownerId==='wang').every(t=>t.ownerId===''));
 const owner=model.removeMember(before,'lin','chen');assert.equal(owner.ownerId,'chen');assert.equal(owner.members.find(m=>m.id==='chen').manage,true);
});
test('Agent source access cannot override original knowledge permissions',()=>{
 const s=model.seed(source);assert.equal(model.usable(s).length,2);assert.throws(()=>model.toggleAgent(s,'clearcoat',true),/不可用/);assert.throws(()=>model.toggleAgent(s,'restricted',true),/不可用/);model.toggleAgent(s,'methods',false);assert.equal(model.usable(s).length,1);assert.equal(s.links.length,3);
});
test('date suggestions stay drafts until adoption and never shift downstream tasks automatically',()=>{
 const s=model.seed(source),before=structuredClone(s.tasks.find(t=>t.id==='T26').plan);const p=model.propose(s,source,'T24','2026-10-26','2026-10-28','核对归档与资源');s.proposals.push(p);assert.equal(s.tasks.find(t=>t.id==='T24').plan[0],'2026-10-25');assert.ok(p.affected.includes('T26'));const adopted=model.apply(s,p.id);assert.equal(adopted.tasks.find(t=>t.id==='T24').plan[0],'2026-10-26');assert.deepEqual(adopted.tasks.find(t=>t.id==='T26').plan,before);assert.throws(()=>model.apply(adopted,p.id),/已处理/);assert.throws(()=>model.propose(s,source,'T24','2026-11-01','2026-10-01','原因'),/结束日期/);
});
