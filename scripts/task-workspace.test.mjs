import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=n=>readFileSync(new URL('../apps/web/src/features/workflow/'+n+'.js',import.meta.url),'utf8');
const {C,D,R}=vm.runInNewContext(source('task-canvas-model')+'\n'+source('task-dialogue')+'\n'+source('task-report')+'\n({C:TaskCanvasModel,D:TaskDialogueModel,R:TaskReportModel})',{Date,Math,Set,structuredClone});
const rows=()=>[{id:'TODO-001',name:'整理文档',kind:'todo',canvasKind:'task',executionMode:'ai',owner:'资料整理 Agent',done:false,inputs:[],outputs:[]},{id:'TODO-002',name:'核对方案',kind:'todo',executionMode:'human',owner:'林晓',done:false,inputs:[],outputs:[]}];
test('unified workflow view supports simulation, computation and research tasks',()=>{
 assert.equal(C.supportsTask({name:'计算模拟'}),true);assert.equal(C.supportsTask({name:'自定义求解',taskType:'计算节点'}),true);assert.equal(C.supportsTask({name:'数值分析',taskType:'计算'}),true);assert.equal(C.supportsTask({name:'证据整理',taskType:'调研节点'}),true);
});
test('canvas file provenance is fixed and input identity survives reordered file lists',()=>{
 const state=C.seed();state.inputNames=['a.md','b.md'];const first=C.project(rows(),['a.md','b.md'],state);assert.equal(first.nodes.find(n=>n.name==='a.md').id,C.project(rows(),['b.md','a.md'],state).nodes.find(n=>n.name==='a.md').id);
 const a=C.artifact(state,'TODO-001','output.md'),scene=C.project(rows(),['a.md','output.md'],state);
 assert.ok(scene.edges.some(e=>e[0]==='TODO-001'&&e[1]===a.id));
 assert.throws(()=>C.connect(scene,'TODO-002',C.inputId('a.md')),/只读/);assert.throws(()=>C.connect(scene,'TODO-002',a.id),/来源/);
});
test('only files explicitly referenced by tasks become default input nodes',()=>{
 const r=rows(),state=C.seed();state.inputNames=[];r[0].inputs=['task-brief.md'];r[1].inputs=['task-brief.md'];
 const scene=C.project(r,['task-brief.md','conversation-demo.md'],state),file=scene.nodes.find(n=>n.name==='task-brief.md');
 assert.equal(scene.nodes.some(n=>n.name==='conversation-demo.md'),false);assert.equal(file.canvasKind,'input');
 assert.deepEqual(Array.from(scene.edges.filter(edge=>edge[0]===file.id).map(edge=>edge[1])),['TODO-001','TODO-002']);
});
test('file nodes are transparent to execution readiness and never block downstream tasks',()=>{
 const r=rows(),state=C.seed();r[0].inputs=['brief.md'];r[0].outputs=['result.md'];r[1].inputs=['result.md'];
 const result=C.artifact(state,'TODO-001','result.md');state.edges.push([result.id,'TODO-002','文件输入','dependency']);
 assert.equal(C.advanceReady(r,['brief.md','result.md'],state,true),true);
 assert.equal(r[0].status,'doing');assert.equal(r[1].status,undefined);
 r[0].done=true;r[0].status='done';
 assert.equal(C.advanceReady(r,['brief.md','result.md'],state,true),true);assert.equal(r[1].status,'doing');
 const scene=C.project(r,['brief.md','result.md'],state);
 assert.deepEqual(Array.from(C.taskPredecessors(scene,r,'TODO-002')),['TODO-001']);
});
test('an inactive work package does not auto-start otherwise ready tasks',()=>{
 const r=rows(),state=C.seed();assert.equal(C.advanceReady(r,[],state,false),false);assert.equal(r[0].status,undefined);assert.equal(r[1].status,undefined);
});
test('connections reject duplicates and cycles; task links pass outputs rather than unproduced input material',()=>{
 const r=rows(),state=C.seed();r[0].outputs=['summary.md'];r[0].inputs=['source.md'];let scene=C.project(r,['source.md'],state);
 state.edges.push(C.connect(scene,'TODO-001','TODO-002'));scene=C.project(r,['source.md'],state);
 assert.throws(()=>C.connect(scene,'TODO-001','TODO-002'),/已存在/);assert.throws(()=>C.connect(scene,'TODO-002','TODO-001'),/循环/);
 assert.deepEqual(Array.from(C.inheritedFiles(scene,'TODO-002')),['summary.md']);
 const before=JSON.stringify(state);C.inheritedFiles(scene,'TODO-002');assert.equal(JSON.stringify(state),before);
});
test('completed task nodes only allow outgoing links and terminal nodes need no successor',()=>{
 const r=rows();r[0].done=true;const state=C.seed(),scene=C.project(r,[],state);
 const edge=C.connect(scene,'TODO-001','TODO-002');assert.equal(edge[0],'TODO-001');assert.equal(edge[1],'TODO-002');
 assert.throws(()=>C.connect(scene,'TODO-002','TODO-001'),/不能接收/);
 state.edges.push(edge);const projected=C.project(r,[],state);assert.equal(projected.edges.length,1);assert.equal(projected.edges.some(e=>e[0]==='TODO-002'),false);
});
test('each todo retains its own messages and report projections never complete real tasks',()=>{
 const store={};D.append(store,'TODO-001',{text:'first'});D.append(store,'TODO-002',{text:'second'});assert.equal(D.thread(store,'TODO-001')[0].text,'first');assert.equal(D.thread(store,'TODO-002').length,1);
 const r=rows(),before=JSON.stringify(r),brief=R.create(r),shown=R.project(r,brief);assert.equal(shown[0].done,true);assert.equal(r[0].done,false);assert.equal(JSON.stringify(r),before);assert.equal(brief.approvals.length,2);assert.ok(brief.risk);
});

test('research example connects existing steps and report once without modifying task facts',()=>{
 const r=[{id:'T1',name:'明确技术指标与应用边界',done:true},{id:'T2',name:'梳理候选技术路线',done:true},{id:'T3',name:'补充专利资料',done:true},{id:'T4',name:'完成技术调研报告',done:true}];
 const before=JSON.stringify(r),state=C.seed();state.inputNames=['需求确认纪要.md','涂层性能指标.csv','技术调研报告.md'];
 assert.equal(C.seedResearch(state,r,state.inputNames),true);assert.equal(state.artifacts.length,1);assert.equal(state.artifacts[0].producer,'T4');assert.equal(state.inputNames.length,2);assert.equal(state.edges.length,5);assert.equal(JSON.stringify(r),before);
 const saved=JSON.stringify(state);assert.equal(C.seedResearch(state,r,['技术调研报告.md']),false);assert.equal(JSON.stringify(state),saved);
 const custom=C.seed();custom.edges=[['T1','T3']];C.seedResearch(custom,r,['技术调研报告.md']);assert.equal(custom.edges.length,1);assert.equal(custom.artifacts.length,0);
});
test('dialogue title uses responsible Agent or a supporting Agent without altering human owner',()=>{
 const human={name:'梳理候选技术路线',owner:'林晓',executionMode:'human'};
 assert.equal(D.agent(human),'方案规划 Agent');assert.equal(human.owner,'林晓');assert.equal(D.agent({owner:'文献调研 Agent'}),'文献调研 Agent');assert.equal(D.agent({kind:'experiment',owner:'张三'}),'实验协作 Agent');assert.equal(D.agent(null),'研究 Copilot');
});

test('removing generated and explicit connections persists without deleting files or task state',()=>{
 const state=C.seed(),r=rows();state.inputNames=['input.md'];r[0].inputs=['input.md'];const file=C.artifact(state,'TODO-001','result.md');state.edges.push(['TODO-001','TODO-002']);const original=JSON.stringify({r,artifacts:state.artifacts});
 for(const pair of [[C.inputId('input.md'),'TODO-001'],['TODO-001',file.id],['TODO-001','TODO-002']])C.removeEdge(state,pair);
 const reloaded=JSON.parse(JSON.stringify(state)),scene=C.project(r,['input.md','result.md'],reloaded);
 assert.equal(scene.edges.length,0);assert.equal(scene.nodes.length,4);assert.equal(JSON.stringify({r,artifacts:state.artifacts}),original);assert.equal(reloaded.removedEdges.length,3);
});

test('work-package deliverables accept input and result references once without changing files or provenance',()=>{
 const state=C.seed(),r=rows();state.inputNames=['upstream.md'];const output=C.artifact(state,r[0].id,'result.md'),scene=C.project(r,['upstream.md','result.md'],state),before=JSON.stringify({r,artifacts:state.artifacts,inputNames:state.inputNames,edges:state.edges});
 assert.equal(C.addDeliverable(state,scene,C.inputId('upstream.md')),true);assert.equal(C.addDeliverable(state,scene,output.id),true);assert.equal(C.addDeliverable(state,scene,output.id),false);assert.equal(state.deliverables.length,2);assert.equal(state.deliverables[0].sourceKind,'input');assert.equal(state.deliverables[1].producer,r[0].id);assert.throws(()=>C.addDeliverable(state,scene,r[0].id),/文件/);
 const loaded=JSON.parse(JSON.stringify(state));C.removeDeliverable(loaded,output.id);assert.equal(loaded.deliverables.length,1);assert.equal(loaded.artifacts.length,1);assert.equal(JSON.stringify({r,artifacts:state.artifacts,inputNames:state.inputNames,edges:state.edges}),before);
});
