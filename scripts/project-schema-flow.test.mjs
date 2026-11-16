import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {projectRoot} from './dev-server.mjs';

const source=path=>readFile(resolve(projectRoot,'apps/web',path),'utf8');

function runtime(){
 const stored=new Map(),events=[],updates=[];
 const localStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value))};
 const document={dispatchEvent:event=>events.push(event)};
 class CustomEvent{constructor(type,options={}){this.type=type;this.detail=options.detail}}
 const project={id:'demo',name:'低温固化透明涂层',owner:'林晓',scenario:'guided-demo'};
 const ProjectStore={active:()=>project,updateActive:patch=>{updates.push(patch);Object.assign(project,patch)}};
 const context={localStorage,document,CustomEvent,ProjectStore,structuredClone,setTimeout:fn=>fn(),console};
 vm.createContext(context);return {context,stored,events,updates,project};
}

test('project schema intake fills one shared markdown document before research starts',async()=>{
 const r=runtime();vm.runInContext(await source('src/features/research-flow/demo-lifecycle.js'),r.context);
 const flow=vm.runInContext('ProjectSchemaFlow',r.context);
 assert.match(flow.documentText(),/## 项目名称\n{3,}## 需求/);
 assert.equal(flow.read().step,'requirements');
 assert.match(flow.prompt(flow.read(),r.project),/发送任意内容即可继续/);
 const completed=flow.submit('好的，继续',r.project);
 assert.equal(flow.read().fields.projectName,r.project.name);
 assert.match(flow.read().fields.requirements,/低温固化透明涂层/);
 assert.match(flow.read().fields.constraints,/现有材料、设备和项目周期/);
 assert.match(flow.read().fields.outputs,/技术调研报告/);
 assert.equal(completed.state.step,'confirm');assert.match(completed.reply,/确认内容是否准确/);
 const confirmed=flow.submit('确认',r.project);assert.equal(confirmed.requirementsConfirmed,true);assert.equal(confirmed.startResearch,true);assert.equal(flow.read().step,'complete');
 const progressAfterConfirm=JSON.parse(r.stored.get('synmat-flow-progress-v1'));assert.equal(progressAfterConfirm.tasks['项目立项/P1T1'].status,'已完成');
 const workspace=JSON.parse(r.stored.get('synmat-task-workspaces'));assert.match(workspace['项目立项//需求确认'].docs['项目基础信息.md'],/## 约束条件\n\n基于现有材料、设备和项目周期/);
 assert.equal(flow.read().researchStatus,'started');
 const progress=JSON.parse(r.stored.get('synmat-flow-progress-v1'));assert.equal(progress.tasks['项目立项/P1T2'].status,'进行中');
 assert.equal(r.project.currentNodeId,'P1T2');assert(r.events.some(event=>event.type==='synmat:request-flow-task-entry'));
});

test('new projects begin with initiation packages, matching conversations and no generated research round',async()=>{
 const model=await source('src/features/projects/model.js');
 const research=await source('src/features/workflow/research.js');
 assert.match(model,/currentTask:'需求确认',currentNodeId:'P1T1'/);
 assert.match(model,/scenario:'guided-demo'/);
 assert.match(model,/'项目立项\/P1T1':\{status:'进行中'\}/);
 assert.match(model,/'项目立项\/P1T2':\{status:'待开始'\}/);
 assert.match(model,/'项目立项\/P1T3':\{status:'待开始'\}/);
 assert.match(model,/'项目立项\/P1T4':\{status:'待开始'\}/);
 assert.match(model,/'项目立项\/\/需求确认':workspace/);
 assert.match(model,/'项目立项\/\/技术调研':workspace/);
 assert.match(model,/'项目立项\/\/项目立项':workspace/);
 assert.match(model,/'项目立项\/\/SOP审批':workspace/);
 assert.match(model,/\{'项目基础信息\.md':schemaDocument\}/);
 assert.match(model,/round1Generated:false/);
 assert.doesNotMatch(model,/const requirementKey='研发\/需求与资源对齐/);
 assert.match(model,/synmat-project-entry','requirements-intake/);
 assert.match(research,/workspaceStore=\{\.\.\.latest,\.\.\.workspaceStore,\[workspaceKey\]:/);
 assert.match(research,/guidedProject&&task==='需求确认'.*ProjectSchemaFlow\.fileName/);
});

test('the first schema prompt renders as a structured intake card',async()=>{
 const research=await source('src/features/workflow/research.js');
 const css=await source('src/styles/research.css');
 assert.match(research,/function messageMarkup\(message\)/);
 assert.match(research,/class="research-schema-intake"/);
 assert.match(research,/项目需求/);
 assert.match(research,/约束条件/);
 assert.match(research,/预期产出/);
 assert.match(research,/项目基础信息\.md/);
 assert.match(research,/发送后生成草稿/);
 assert.match(research,/直接发送任意说明即可/);
 assert.match(research,/项目需求：.*约束条件：.*预期产出：/s);
 assert.match(research,/class="research-schema-confirm"/);
 assert.match(research,/data-schema-action="start"/);
 assert.match(research,/确认并启动技术调研/);
 assert.match(css,/\.research-schema-intake\{[^}]*border:1px solid/);
 assert.match(css,/\.research-schema-intake li\{/);
 assert.match(css,/\.research-schema-confirm\{/);
});

test('starting research exposes an Agent working status in conversation assets',async()=>{
 const research=await source('src/features/workflow/research.js');
 const lifecycle=await source('src/features/research-flow/demo-lifecycle.js');
 const css=await source('src/styles/research.css');
 assert.match(lifecycle,/agentWorking:true/);
 assert.match(research,/function agentWorkingMarkup\(\)/);
 assert.match(research,/Agent\}\s*工作中|工作中/);
 assert.match(research,/正在生成资产/);
 assert.match(css,/\.research-agent-working\{/);
 assert.match(css,/@keyframes research-working-dot/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
});

test('project initiation uses one numbered TODO while technical research stays parallel',async()=>{
 const r=runtime();vm.runInContext(await source('src/features/research-flow/demo-lifecycle.js'),r.context);
 const lifecycle=vm.runInContext('DemoProjectLifecycle.initiationView()',r.context);
 const initiation=lifecycle.tasks.find(task=>task.id==='P1T3');
 const sop=lifecycle.tasks.find(task=>task.id==='P1T4');
 assert.equal(initiation.workItemsMode,'sequential');
 assert.equal(sop.workItemsMode,'sequential');
 assert.deepEqual(Array.from(initiation.workItems,item=>item.name),['立项材料准备']);
 assert.deepEqual(Array.from(initiation.workItems,item=>item.id),['TODO-001']);
 assert.deepEqual(Array.from(sop.workItems,item=>item.name),['确认 SOP 项目工作流']);
 assert.deepEqual(JSON.parse(JSON.stringify(lifecycle.edges.P1)),[['P1T1','P1T2'],['P1T2','P1T3'],['P1T3','P1T4']]);
});

test('TODO confirmations continue into the next package and activate every ready research root',async()=>{
 const research=await source('src/features/workflow/research.js');
 const flow=await source('src/features/research-flow/page.js');
 assert.match(research,/function confirmSequenceItem\(\)/);
 assert.match(research,/确认完成任务/);
 assert.match(research,/autoContinue:true/);
 assert.match(research,/autoFocusFirstTask/);
 assert.match(flow,/function finishNode\(id,autoContinue=false,approved=false\)/);
 assert.match(flow,/for\(const item of generated\.tasks\).*status:'待开始'/);
 assert.match(flow,/FlowProgress\.ready\(generated/);
 assert.match(flow,/enterNodeWorkspace\(first\.id,\{autoFocusFirstTask:true\}\)/);
});

test('SOP approval gates research generation and customer access can create an identical second round',async()=>{
 const r=runtime();vm.runInContext(await source('src/features/research-flow/demo-lifecycle.js'),r.context);
 const lifecycle=vm.runInContext('DemoProjectLifecycle',r.context);
 const template={version:'v1',stages:[{id:'S1',short:'研发任务',title:'研发任务'},{id:'S6',short:'准入',title:'准入'}],tasks:[{id:'T11',stage:'S1',name:'研究任务',deliverables:[]},{id:'T62',stage:'S6',name:'原准入任务',deliverables:[]}],edges:{S1:[],S6:[]}};
 const first=lifecycle.instantiate(template,1),second=lifecycle.instantiate(template,2);
 assert.equal(first.tasks.at(-1).name,'客户准入');
 assert.equal(first.tasks.at(-1).round,1);
 assert.equal(second.tasks.at(-1).name,'客户准入');
 assert.equal(second.tasks.at(-1).id,'R2-T62');
 assert.deepEqual(Array.from(first.tasks,item=>item.sourceTaskId),Array.from(second.tasks,item=>item.sourceTaskId));
 const flow=await source('src/features/research-flow/page.js');
 assert.match(flow,/sopCompleted.*generateResearchRound\(1\)/s);
 assert.match(flow,/function confirmNextResearchRound/);
 assert.match(flow,/启动研发阶段 2/);
 assert.match(flow,/generateResearchRound\(2\)/);
 assert.match(flow,/round2Approved=true/);
});
