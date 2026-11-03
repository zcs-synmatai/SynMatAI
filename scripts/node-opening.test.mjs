import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../apps/web/src/features/workflow/node-opening.js',import.meta.url),'utf8');
const M=vm.runInNewContext(source+';WorkspaceNodeOpening',{Date});
test('node activation routes by type without confusing file nodes and document work',()=>{
 for(const [node,expected] of [[{kind:'experiment',id:'EXP-1'},'experiment'],[{taskType:'实验节点'},'experiment'],[{type:'审批'},'approval'],[{taskType:'审批节点'},'approval'],[{type:'文档'},'document'],[{canvasKind:'input',name:'a.md'},'file'],[{fileNode:true},'file'],[{type:'DOE设计'},'chat'],[{type:'分析'},'chat'],[{type:'调研'},'chat'],[{name:'建立批料与施工窗证据'},'document'],[{name:'技术调研'},'chat']])assert.equal(M.kind(node),expected);
});
test('document activation opens existing output before input and preserves missing-file state',()=>{
 assert.equal(M.documentFile({outputs:['missing.md','out.md'],inputs:['input.md']},['input.md','out.md']),'out.md');assert.equal(M.documentFile({outputs:[],inputs:[]},['other.md']),null);
});
test('quick approval requires the pending current approver and a return reason, and cannot repeat',()=>{
 const record={status:'pending',approver:'林晓'};assert.equal(M.canApprove(record),true);assert.equal(M.canApprove(record,'张三'),false);assert.throws(()=>M.decide(record,'returned',''),/原因/);assert.throws(()=>M.decide(record,'approved','同意','张三'),/轮到/);const approved=M.decide(record,'approved','同意');assert.equal(record.status,'pending');assert.equal(approved.status,'approved');assert.equal(M.canApprove(approved),false);assert.throws(()=>M.decide(approved,'returned','补充材料'),/轮到/);
});
