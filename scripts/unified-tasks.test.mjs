import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../apps/web/src/features/workflow/unified-tasks.js',import.meta.url),'utf8');
const numberingSource=readFileSync(new URL('../apps/web/src/features/workflow/numbering-model.js',import.meta.url),'utf8');
const editorSource=readFileSync(new URL('../apps/web/src/features/workflow/task-todo-editor.js',import.meta.url),'utf8');
const taskStyles=readFileSync(new URL('../apps/web/src/styles/unified-tasks.css',import.meta.url),'utf8');
const model=readFileSync(new URL('../apps/web/src/features/experiments/model.js',import.meta.url),'utf8');
const {U,M}=vm.runInNewContext(model+'\nconst window={};\n'+numberingSource+'\nconst WorkflowNumbering=window.WorkflowNumbering;\n'+source+'\n({U:window.UnifiedTasks,M:ExperimentModel})',{Date,JSON,Set});
test('legacy todos keep stable identities and fields across normalization and deletion',()=>{
 const todos=[{text:'核对材料',done:false,status:'progress'},{text:'文献调研',done:true}];U.normalize(todos);
 assert.equal(todos[0].status,'doing');assert.equal(todos[1].type,'调研');const id=todos[1].id;
 todos.splice(0,1);todos.push({text:'审批',done:false});U.normalize(todos);
 assert.equal(todos[0].id,id);assert.notEqual(todos[1].id,id);assert.equal(todos[1].executionMode,'human');
});
test('unified list observes shared experiment progress without changing experiment state',()=>{
 const s=M.seed(),before=JSON.stringify(s),experiments=s.experiments.filter(e=>e.stage==='S2');
 const todos=[{text:'复核',done:false}];let rows=U.rows(todos,experiments,s,M);
 assert.equal(rows.length,9);assert.equal(new Set(rows.map(r=>r.id)).size,9);assert.equal(JSON.stringify(s),before);
 s.experiments.find(e=>e.id===experiments[0].id).status='完成';rows=U.rows(todos,experiments,s,M);
 assert.equal(rows[1].done,true);assert.equal(todos[0].done,false);
});
test('AI completion label requires explicit completion; filters and document references retain meaning',()=>{
 const t={text:'AI摘要',done:false,executionMode:'ai',inputs:['依据.md'],outputs:[],owner:'林晓'};
 let rows=U.rows([t],[],null,null),html=U.render(rows,{});
 assert.ok(html.includes('AI 执行'));assert.ok(!html.includes('AI 已完成'));assert.ok(html.includes('未关联产出'));assert.ok(html.includes('依据.md'));
 t.done=true;rows=U.rows([t],[],null,null);assert.ok(U.render(rows,{}).includes('AI 已完成'));
 assert.ok(U.render(rows,{mode:'human'}).includes('没有符合条件的待办'));
});
test('Agent examples assign document and calculation work while preserving human experiment execution',()=>{
 const todos=[{text:'复核R1—R4各独立层批量闭合',owner:'林晓',done:false},{text:'记录滴加顺序、温度与熟化时间',owner:'林晓',done:false},{text:'归集黏度与过滤损失证据',owner:'林晓',done:false}];
 U.applyAgentExamples(todos);assert.equal(todos.length,3);assert.equal(todos[0].owner,'配方核算 Agent');assert.equal(todos[2].owner,'资料整理 Agent');assert.equal(todos[1].executionMode,'human');assert.ok(todos[0].collaborators.includes('林晓'));assert.ok(todos.every(t=>!t.done));
 const s=M.seed(),experiment=s.experiments[0];experiment.executionMode='ai';const row=U.rows([], [experiment],s,M)[0];assert.equal(row.executionMode,'human');assert.ok(!row.owner.endsWith('Agent'));
});
test('AI mode always displays a named Agent and retains the previous human collaborator',()=>{
 const t={text:'文献摘要',owner:'张三',executionMode:'ai',done:false};const row=U.rows([t],[],null,null)[0];assert.equal(row.owner,'文献调研 Agent');assert.ok(row.collaborators.includes('张三'));
});
test('additional Agent assignments are idempotent, keep human work and use only existing input references',()=>{
 const todos=[{text:'记录滴加顺序、温度与熟化时间',owner:'林晓',executionMode:'human',done:false},{text:'已完成的人工审批',owner:'林晓',executionMode:'human',done:true,status:'done'}];
 U.applyAgentTaskPack(todos,['任务—SOP依据.md','任务—记录模板.md']);
 assert.equal(todos.length,10);assert.equal(todos.filter(t=>t.executionMode==='ai').length,8);assert.equal(todos[0].owner,'林晓');assert.equal(todos[1].done,true);
 assert.ok(todos.slice(2).every(t=>t.owner.endsWith('Agent')&&!t.done&&t.outputs.length===0&&t.inputs.length===1));
 todos[2].owner='文献调研 Agent';U.applyAgentTaskPack(todos);assert.equal(todos.length,10);assert.equal(todos[2].owner,'文献调研 Agent');
});

test('todo collaborators use a searchable at-mention multi-select instead of a checkbox wall',()=>{
 assert.match(editorSource,/data-collaborator-search/);
 assert.match(editorSource,/placeholder="@ 添加协作人"/);
 assert.match(editorSource,/role="listbox"/);
 assert.match(editorSource,/selectedCollaborators/);
 assert.match(editorSource,/collaboratorField\.outerHTML/);
 assert.match(taskStyles,/\.ut-collaborator-chip/);
 assert.match(taskStyles,/\.ut-collaborator-options/);
});
