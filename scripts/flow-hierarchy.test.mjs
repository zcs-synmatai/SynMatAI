import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const load=path=>readFile(new URL('../apps/web/src/features/'+path,import.meta.url),'utf8');
const task=await load('workflow/task-canvas-model.js');
const hierarchy=await load('research-flow/hierarchy-model.js');
const draft=await load('research-flow/draft-model.js');
const M=vm.runInNewContext(task+'\n'+draft+'\n'+hierarchy+';FlowHierarchyModel',{structuredClone});
const stage=(id)=>({id,title:id,deliverables:'D1 输入记录；D2 决策文件'});
const views=Object.fromEntries([['市场分析',['M1']],['项目立项',['P1']],['研发',['S1','S2','S3','S4','S5','S6']],['量产',['L1','L2','L3']]].map(([p,ids])=>[p,{stages:ids.map(stage),tasks:ids.map(id=>({id:id+'T1',name:'任务',stage:id}))}]));
const plain=value=>JSON.parse(JSON.stringify(value));
test('global view starts with one research stage and can collapse it without inventing a second stage',()=>{
 const before=JSON.stringify(views),scene=M.stages(views,'研发',(p,s)=>s==='S2'?'进行中':p==='市场分析'||p==='项目立项'||s==='S1'?'已完成':'待开始');
 assert.equal(scene.nodes.length,11);assert.deepEqual(plain(scene.groups.map(g=>[g.name,g.ids.length,g.status])),[['立项',2,'已完成'],['研发',6,'进行中'],['量产',3,'待开始']]);
 assert.equal(scene.nodes.find(n=>n.id==='S2').status,'进行中');assert.equal(scene.edges.length,10);
 assert.ok(scene.edges.some(e=>e[0]==='PH2'&&e[1]==='S1'));assert.ok(scene.edges.some(e=>e[0]==='S6'&&e[1]==='L1'));assert.equal(scene.nodes.some(n=>n.id==='RD2'),false);
 assert.equal(scene.nodes.find(n=>n.id==='S6').feedback,true);assert.match(scene.nodes.find(n=>n.id==='S6').name,/用户反馈/);
 assert.equal(scene.nodes.filter(n=>n.viewKind==='phase').length,0);
 const folded=M.stages(views,'研发',(p,s)=>s==='S1'?'已完成':'待开始',['research-1']);
 assert.equal(folded.nodes.length,6);assert.ok(folded.edges.some(e=>e[0]==='PH2'&&e[1]==='RD1'));assert.ok(folded.edges.some(e=>e[0]==='RD1'&&e[1]==='L1'));
 assert.equal(folded.groups[1].collapsed,true);assert.equal(folded.nodes.find(n=>n.id==='RD1').count,6);
 assert.equal(JSON.stringify(views),before);assert.equal(M.stages(views,'市场分析',()=> '已完成').nodes.length,11);
 for(const n of scene.nodes.filter(n=>!n.pending))assert.ok(views[n.phase].stages.some(s=>s.id===n.stageId));
});
test('empty research and production keep phase titles separate from planning placeholders',()=>{
 const empty=plain(views);empty.研发={stages:[{id:'R0',title:'待规划生成',short:'待规划生成',empty:true}],tasks:[]};empty.量产={stages:[{id:'L0',title:'待规划生成',short:'待规划生成',empty:true}],tasks:[]};
 const scene=M.stages(empty,'项目立项',()=> '待开始');
 assert.deepEqual(plain(scene.groups.map(group=>group.name)),['立项','研发','量产']);
 assert.equal(scene.nodes.find(node=>node.id==='RD1').name,'待规划生成');
 assert.equal(scene.nodes.find(node=>node.id==='L0').name,'待规划生成');
});
test('boundary rails follow neighboring substages and cross major phase boundaries',()=>{
 assert.equal(M.adjacent(views,'研发','S2').before.id,'S1');assert.equal(M.adjacent(views,'研发','S2').after.id,'S3');
 assert.equal(M.adjacent(views,'研发','S1').before.phase,'项目立项');assert.equal(M.adjacent(views,'研发','S6').after.id,'L1');
 assert.equal(M.adjacent(views,'市场分析','M1').before,null);assert.equal(M.adjacent(views,'量产','L3').after,null);
 assert.deepEqual(plain(M.requirements(stage('S1'))),['输入记录','决策文件']);
});
test('task view can continue from the first or last work package into a neighboring stage',()=>{
 const local=plain(views);
 local['项目立项'].tasks.push({id:'P1T2',name:'方案审批',stage:'P1'});
 assert.deepEqual(plain(M.boundaryPackage(local,'研发','S1','before')),{id:'P1T2',name:'方案审批',stage:'P1',phase:'项目立项',stageId:'P1'});
 assert.equal(M.boundaryPackage(local,'研发','S1','after').id,'S2T1');
 assert.equal(M.boundaryPackage(local,'市场分析','M1','before'),null);
 assert.equal(M.boundaryPackage(local,'量产','L3','after'),null);
});
test('internal view reads the exact existing workspace keys',()=>{
 assert.equal(M.workspaceKey('研发','S2',{name:'制板'}),'研发/路线筛选/制板');
 assert.equal(M.workspaceKey('量产','L1',{name:'准备'}),'量产/小试/准备');
 assert.equal(M.workspaceKey('项目立项','P1',{name:'技术调研'}),'项目立项//技术调研');
});
test('internal projection retains saved dependencies, completion and files without mutating workspace',()=>{
 const cached={todos:[{id:'A',text:'核对材料',done:true},{id:'B',text:'准备样板',status:'doing'}],docs:{'记录.md':'已有内容'},taskCanvas:{edges:[['A','B','真实依赖','dependency']],artifacts:[],hidden:[]}};
 const before=JSON.stringify(cached),scene=M.internal({name:'制板'},{cached});
 assert.equal(scene.nodes.find(n=>n.id==='A').status,'已完成');assert.equal(scene.nodes.find(n=>n.id==='B').status,'进行中');
 assert.ok(scene.edges.some(e=>e[0]==='A'&&e[1]==='B'&&e[2]==='真实依赖'));assert.equal(scene.example,false);
 assert.equal(scene.docs['记录.md'],'已有内容');assert.equal(JSON.stringify(cached),before);
});
test('internal projection places one referenced file before its consuming tasks and ignores unrelated documents',()=>{
 const cached={todos:[{id:'A',text:'立项材料准备'},{id:'B',text:'组织立项审批'}],docs:{'项目立项—任务资料.md':'输入','WORKSPACE-项目立项—演示文档.md':'仅供对话预览'},taskCanvas:{edges:[],artifacts:[],hidden:[],inputNames:null}};
 const scene=M.internal({id:'P1T3',name:'项目立项'},{phase:'项目立项',stage:'P1',cached}),file=scene.nodes.find(n=>n.name==='项目立项—任务资料.md');
 assert.equal(file.viewKind,'file');assert.equal(scene.nodes.some(n=>n.name==='WORKSPACE-项目立项—演示文档.md'),false);
 assert.ok(scene.edges.some(edge=>edge[0]===scene.inputId&&edge[1]===file.id));
 assert.ok(scene.edges.some(edge=>edge[0]===file.id&&edge[1]==='A'));assert.ok(scene.edges.some(edge=>edge[0]===file.id&&edge[1]==='B'));
 assert.equal(scene.edges.some(edge=>edge[0]===scene.inputId&&['A','B'].includes(edge[1])),false);
 assert.ok(scene.edges.some(edge=>edge[0]==='A'&&edge[1]===scene.outputId));assert.ok(scene.edges.some(edge=>edge[0]==='B'&&edge[1]===scene.outputId));
});
test('independent internal tasks share one lightweight package brief before joining at output',()=>{
 const cached={todos:[{id:'A',text:'准备'},{id:'B',text:'核对'}],taskCanvas:{edges:[]}};
 const scene=M.internal({id:'T1',name:'制板'},{cached}),file=scene.nodes.find(n=>n.name==='制板—任务资料.md');assert.equal(scene.example,false);assert.equal(scene.nodes.length,5);
 assert.deepEqual(plain(scene.edges.map(e=>e.slice(0,2))),[[file.id,'A'],[file.id,'B'],[scene.inputId,file.id],['A',scene.outputId],['B',scene.outputId]]);
 assert.equal(cached.taskCanvas.edges.length,0);
});
test('simulation internal view wraps existing calculation topology with one input and output',()=>{
 const thermal=[{id:'micro1',type:'micro'},{id:'macro1',type:'macro',bindings:['micro1']},{id:'schedule1'},{id:'analysis1'}];
 const scene=M.internal({id:'T20',name:'计算模拟'},{thermal});assert.equal(scene.nodes.length,6);assert.equal(scene.edges.length,5);
 assert.deepEqual(plain(scene.edges.map(e=>e.slice(0,2))),[['micro1','macro1'],['macro1','schedule1'],['schedule1','analysis1'],[scene.inputId,'micro1'],['analysis1',scene.outputId]]);
 assert.equal(thermal[0].viewKind,undefined);assert.equal(scene.example,false);
});
test('stage wrapper retains real dependency and connects every independent branch',()=>{
 const items=[{id:'A',name:'调研'},{id:'B',name:'实验'},{id:'C',name:'审查'}],edges=[['A','C','已设依赖','dependency']];
 const scene=M.enclose(items,edges,'stage/研发/S2');
 assert.equal(scene.realEdgeCount,1);assert.equal(scene.edges[0][2],'已设依赖');
 assert.deepEqual(plain(scene.edges.slice(1).map(e=>e.slice(0,2))),[[scene.inputId,'A'],[scene.inputId,'B'],['B',scene.outputId],['C',scene.outputId]]);
 assert.equal(items[0].virtual,undefined);assert.equal(edges.length,1);
});
test('one integrated project graph connects all eleven stages and all package tasks',()=>{
 const graph=M.integrate(views,{internalFor:(phase,stage,item)=>M.enclose([{id:'task1',name:'准备'},{id:'task2',name:'核对'}],[],'task/'+phase+'/'+stage+'/'+item.id,'工作包')});
 assert.equal(graph.stages.length,11);assert.equal(graph.packages.length,11);assert.equal(graph.phaseGroups.length,4);
 const adjacency=new Map();for(const [from,to] of graph.edges){if(!adjacency.has(from))adjacency.set(from,[]);adjacency.get(from).push(to)}
 const seen=new Set(),queue=[graph.inputId];while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);queue.push(...adjacency.get(id)||[])}
 assert.equal(seen.size,graph.nodes.length);assert.ok(seen.has(graph.outputId));
 for(const item of graph.packages){assert.ok(seen.has(item.inputId));assert.ok(seen.has(item.outputId));}
 assert.ok(graph.edges.some(e=>e[0]===graph.phaseGroups[1].outputId&&e[1]===graph.phaseGroups[2].inputId));
 assert.ok(graph.edges.some(e=>e[0]===graph.stages[2].outputId&&e[1]===graph.stages[3].inputId));
});
test('integrated stage carries an attached result file without inventing a work package',()=>{
 const local=structuredClone(views);local.研发.canvasFiles={S2:{files:[{id:'FILE-1',name:'结果.md',fileNode:true}],edges:[['S2T1','FILE-1','结果文件','dependency']]}};
 const graph=M.integrate(local);const asset=graph.nodes.find(n=>n.id==='asset/研发/S2/FILE-1');
 assert.equal(asset.name,'结果.md');assert.equal(graph.packages.length,11);
 const source=graph.packages.find(p=>p.phase==='研发'&&p.stageId==='S2');assert.ok(graph.edges.some(e=>e[0]===source.outputId&&e[1]===asset.id));
 assert.ok(graph.edges.some(e=>e[0]===asset.id&&e[1]===graph.stages.find(s=>s.phase==='研发'&&s.stageId==='S2').outputId));
});


test('shared package overview preserves project definitions, branch layout and cross-stage identity',()=>{
 const source=structuredClone(views);source.研发.tasks.push({id:'BRANCH',name:'自建工作包',stage:'S2'},{id:'RESULT',name:'文件',stage:'S2',fileNode:true});source.研发.edges={S2:[['S2T1','BRANCH']]};const before=JSON.stringify(source);
 const nav=M.packageOverview(source,'研发','S2','BRANCH',(p,t)=>t.id==='BRANCH'?'进行中':'待开始');
 assert.equal(nav.current,'研发/S2/BRANCH');assert.equal(nav.groups.length,11);assert.equal(nav.groups.filter(g=>g.active).length,1);
 assert.equal(nav.nodes.some(n=>n.packageId==='RESULT'),false);assert.equal(nav.nodes.find(n=>n.packageId==='BRANCH').status,'进行中');
 assert.ok(nav.nodes.some(n=>n.phase==='量产'));assert.ok(nav.edges.some(e=>e[0]==='研发/S2/S2T1'&&e[1]==='研发/S2/BRANCH'));
 const group=nav.groups.find(g=>g.active);assert.equal(group.columns.length,2);assert.equal(JSON.stringify(source),before);
 const live=M.packageOverview(source,'研发','S2','BRANCH',()=> '待开始',{tasks:[{id:'FILTER',name:'路线过滤节点',stage:'S2'}],edges:[]});
 assert.ok(live.nodes.some(n=>n.id==='研发/S2/FILTER'));assert.equal(live.nodes.some(n=>n.id==='研发/S2/BRANCH'),false);
});
