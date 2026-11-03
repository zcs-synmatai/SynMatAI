/* V3 navigation projections. These views never rewrite execution dependencies. */
const FlowHierarchyModel=(()=>{
 const phases=['市场分析','项目立项','研发','量产'];
 const workspaceSub={S1:'实施条件验证',S2:'路线筛选',S3:'因子筛选',S4:'工艺窗口优化',S5:'耐候与老化',S6:'客户验证'};
 function adjacent(views,phase,stage){const chain=phases.flatMap(p=>views[p].stages.map(s=>({...s,phase:p}))),index=chain.findIndex(s=>s.phase===phase&&s.id===stage);return {before:chain[index-1]||null,after:chain[index+1]||null,current:chain[index]}}
 function boundaryPackage(views,phase,stage,side){let next=adjacent(views,phase,stage)[side];while(next){const tasks=views[next.phase].tasks.filter(t=>t.stage===next.id&&!t.fileNode);if(tasks.length)return {...tasks[side==='before'?tasks.length-1:0],phase:next.phase,stageId:next.id};next=adjacent(views,next.phase,next.id)[side]}return null}
 function requirements(stage){return (stage?.deliverables||'').split(/[；;]/).map(s=>s.trim().replace(/^D\d+\s*/,'' )).filter(Boolean)}
 function gateId(scope,kind){return '@'+scope+':'+kind}
 function enclose(nodes,edges,scope,kind='阶段'){
  const real=nodes.map(n=>({...n})),ids=new Set(real.map(n=>n.id)),links=edges.filter(e=>ids.has(e[0])&&ids.has(e[1])).map(e=>[...e]);
  const incoming=new Set(links.map(e=>e[1])),outgoing=new Set(links.map(e=>e[0]));
  const inputId=gateId(scope,'input'),outputId=gateId(scope,'output');
  const input={id:inputId,name:'输入',viewKind:'gate',gate:'input',virtual:true,scope:kind,status:'待开始',condition:kind+'的统一输入起点'},output={id:outputId,name:'输出',viewKind:'gate',gate:'output',virtual:true,scope:kind,status:'待开始',condition:kind+'的统一交付终点'};
  const bridge=(a,b)=>[a,b,'','virtual',{fromPort:'right',toPort:'left'}];
  for(const n of real)if(!incoming.has(n.id))links.push(bridge(inputId,n.id));
  for(const n of real)if(!outgoing.has(n.id))links.push(bridge(n.id,outputId));
  if(!real.length)links.push(bridge(inputId,outputId));
  return {nodes:[input,...real,output],edges:links,inputId,outputId,realEdgeCount:edges.filter(e=>ids.has(e[0])&&ids.has(e[1])).length};
 }
 function stages(views,phase,status,collapsedRounds=[]){
  const researchStages=views.研发.stages||[],roundOneStages=researchStages.filter(stage=>(stage.round||1)===1&&!stage.empty),roundTwoStages=researchStages.filter(stage=>stage.round===2&&!stage.empty);
  const nodes=[],positions={},groups=[],collapsed=new Set(collapsedRounds),definitions=[{id:'initiation',name:'立项',phases:['市场分析','项目立项']},{id:'research-1',name:'研发',stages:roundOneStages,round:1,pending:!roundOneStages.length},...(roundTwoStages.length?[{id:'research-2',name:'研发阶段2',stages:roundTwoStages,round:2,pending:false}]:[]),{id:'production',name:'量产',phases:['量产']}];
  // A loose, readable traversal gives the full project room to breathe at fit-to-canvas zoom.
  const anchors=[{x:80,y:180},{x:370,y:215},{x:660,y:170},{x:950,y:220},{x:960,y:490},{x:675,y:530},{x:385,y:490},{x:90,y:530},{x:100,y:800},{x:390,y:770},{x:690,y:805},{x:980,y:770}];let index=0;
  for(const definition of definitions){const ids=[];
   if(definition.pending){const n={id:definition.round===1?'RD1':'RD2',name:'待规划生成',title:'研发 · 待规划生成',phase:'研发',stageId:null,viewKind:'round',groupId:definition.id,status:'待开始',count:0,condition:definition.round===1?'等待项目立项与 SOP 审批完成':'等待上一轮客户准入收集反馈并完成阶段任务确认',deliverables:[],pending:true};nodes.push(n);ids.push(n.id)}
   else if(definition.round&&collapsed.has(definition.id)){const stages=definition.stages,states=stages.map(s=>status('研发',s.id)),state=states.every(s=>s==='已完成')?'已完成':states.every(s=>s==='待开始')?'待开始':'进行中';const n={id:'RD'+definition.round,name:'研发阶段'+definition.round,title:'研发阶段 '+definition.round+' 工作流程',phase:'研发',stageId:stages[0]?.id,viewKind:'round',groupId:definition.id,status:state,count:stages.length,condition:'已折叠 '+stages.length+' 个研发子阶段',deliverables:[],roundSummary:true};nodes.push(n);ids.push(n.id)}
   else if(definition.stages){for(const stage of definition.stages){const feedback=(stage.sourceStageId||stage.id)==='S6',n={id:stage.id,name:feedback?'客户准入 · 用户反馈':stage.short||stage.title,title:stage.title,phase:'研发',stageId:stage.id,viewKind:'stage',groupId:definition.id,status:status('研发',stage.id),count:views.研发.tasks.filter(t=>t.stage===stage.id).length,condition:feedback?[stage.goal,'收集本轮用户反馈，作为下一轮研发规划输入'].filter(Boolean).join('；'):stage.goal,deliverables:requirements(stage),feedback};nodes.push(n);ids.push(n.id)}}
   else for(const p of definition.phases){for(const stage of views[p].stages){const leaf=['市场分析','项目立项'].includes(p),id=leaf?'PH'+(phases.indexOf(p)+1):stage.id,n={id,name:leaf?p:stage.short||stage.title,title:stage.title,phase:p,stageId:stage.id,viewKind:'stage',groupId:definition.id,status:leaf?status(p):status(p,stage.id),count:views[p].tasks.filter(t=>t.stage===stage.id).length,condition:stage.goal,deliverables:requirements(stage)};nodes.push(n);ids.push(id)}}
   for(const id of ids){positions[id]=anchors[index]||{x:80+(index%4)*290,y:180+Math.floor(index/4)*300};index++}
   const statuses=ids.map(id=>nodes.find(n=>n.id===id).status),groupStatus=statuses.every(s=>s==='已完成')?'已完成':statuses.every(s=>s==='待开始')?'待开始':'进行中';groups.push({...definition,ids,status:groupStatus,collapsed:collapsed.has(definition.id)});
  }
  const edges=nodes.slice(1).map((n,i)=>[nodes[i].id,n.id,'','dependency']);return {nodes,edges,positions,groups};
 }
 function packageOverview(views,phase,stage,packageId,taskStatus,activeOptions=null){
   const contexts=phases.flatMap(projectPhase=>views[projectPhase].stages.map(item=>({...item,phase:projectPhase}))),nodes=[],edges=[],groups=[];
   for(const context of contexts){const active=context.phase===phase&&context.id===stage,source=active&&activeOptions?activeOptions.tasks:views[context.phase].tasks.filter(task=>task.stage===context.id),items=source.filter(task=>!task.fileNode),links=active&&activeOptions?activeOptions.edges:views[context.phase].edges?.[context.id]||[],prefix=context.phase+'/'+context.id+'/',ids=new Set(items.map(task=>task.id)),layout=items.length?FlowDraft.layout(items,links.filter(edge=>ids.has(edge[0])&&ids.has(edge[1]))):null;
    nodes.push(...items.map(task=>({...task,id:prefix+task.id,packageId:task.id,phase:context.phase,stageId:context.id,status:taskStatus(context.phase,task),symbol:/实验/.test(task.taskType||'')?'flask':/审批/.test(task.taskType||'')?'check':'flow'})));
    edges.push(...links.filter(edge=>ids.has(edge[0])&&ids.has(edge[1])).map(edge=>[prefix+edge[0],prefix+edge[1]]));
    const columns=layout?Array.from({length:layout.columns},(_,index)=>items.filter(task=>layout.positions[task.id].column===index+1).map(task=>prefix+task.id)):[];
    groups.push({id:prefix,name:context.short||context.title,ids:items.map(task=>prefix+task.id),columns,active});
   }
   return {nodes,edges,groups,current:phase+'/'+stage+'/'+packageId,context:'全项目工作包缩略导航',fullChain:true};

 }
 function workspaceKey(phase,stage,task){const round=/^R(\d+)-/.exec(stage)?.[1],base=stage.replace(/^R\d+-/,''),sub=phase==='研发'?(round?'研发阶段'+round+' · ':'')+(workspaceSub[base]||stage):phase==='量产'?({L1:'小试',L2:'中试',L3:'量产'}[stage]||stage):'';return [phase,sub,task.name].join('/')}
 function internal(task,{phase,stage,cached,thermal,taskRows}={}){
  if(task.demo||task.name==='计算模拟'){const nodes=structuredClone(thermal||[]).map(n=>({...n,viewKind:'task',status:n.status==='done'?'已完成':n.status==='running'?'进行中':'待开始',owner:'模拟计算 Agent',condition:'计算模拟演示，双击查看节点说明或打开原计算工作台。',deliverables:[]})),ids=new Set(nodes.map(n=>n.id)),edges=[];for(const n of nodes)for(const a of n.bindings||[])if(ids.has(a))edges.push([a,n.id,'材料物性','dependency']);for(const n of nodes.filter(n=>n.type==='macro'))if(ids.has('schedule1'))edges.push([n.id,'schedule1','计算配置','dependency']);if(ids.has('schedule1')&&ids.has('analysis1'))edges.push(['schedule1','analysis1','计算结果','dependency']);return {...enclose(nodes,edges,'task/'+phase+'/'+stage+'/'+task.id,'工作包'),docs:{},example:false}}
  let todos=structuredClone(taskRows||cached?.todos||[{text:task.condition||'核对本工作包的目标与输入',done:false,status:'todo',owner:'林晓'},...(task.deliverables||[]).map(d=>({text:'准备：'+d.description,done:false,status:'todo',owner:'林晓'}))]);
  const docs=structuredClone(cached?.docs||{}),sharedBrief=task.name+'—任务资料.md';
  if(task.workItems?.length){const saved=todos;todos=task.workItems.map((item,index)=>{const previous=saved.find(row=>row.id===item.id||row.name===item.name||row.text===item.name);return {...item,...previous,id:item.id,text:item.name,name:item.name,status:previous?.status||item.status||(index?'todo':'doing'),done:previous?.done??false}})}
  if(!Object.hasOwn(docs,sharedBrief))docs[sharedBrief]='# '+task.name+' · 任务资料\n\n## 工作目标\n'+(task.condition||'请核对本工作包的目标、输入与交付要求。')+'\n\n## 输入来源\n'+(task.input||'承接上游工作包的已确认资料。');
  if(todos.length&&!todos.some(item=>(item.inputs||[]).length))todos=todos.map(item=>({...item,inputs:[sharedBrief]}));
  const rows=todos.map((t,i)=>({...t,id:t.id||'TODO-'+String(i+1).padStart(3,'0'),name:t.text||t.name,statusName:t.done?'已完成':t.status==='doing'?'进行中':t.statusName||'待开始',kind:t.kind||'todo',type:t.type||'任务',inputs:t.inputs||[],outputs:t.outputs||[]})),canvas={...TaskCanvasModel.seed(),...structuredClone(cached?.taskCanvas||{})},scene=TaskCanvasModel.project(rows,Object.keys(docs),canvas);
  const nodes=scene.nodes.map(n=>({...n,viewKind:n.canvasKind==='task'?'task':'file',status:n.statusName||'待开始',condition:n.canvasKind==='task'?n.name:'工作台中已有文件的只读引用',deliverables:n.outputs||[]}));
  return {...enclose(nodes,scene.edges,'task/'+phase+'/'+stage+'/'+task.id,'工作包'),docs,example:false};
 }
 function integrate(views,{internalFor=()=>({nodes:[],edges:[]})}={}){
  const nodes=[],edges=[],stages=[],packages=[],phaseGroups=[];let previousStage=null,previousPhase=null;
  for(const phase of phases){
   const phaseInput={id:gateId('phase/'+phase,'input'),name:phase+'输入',viewKind:'gate',gate:'input',virtual:true,scope:'项目阶段',phase},phaseOutput={id:gateId('phase/'+phase,'output'),name:phase+'输出',viewKind:'gate',gate:'output',virtual:true,scope:'项目阶段',phase};nodes.push(phaseInput,phaseOutput);
   if(previousPhase)edges.push([previousPhase,phaseInput.id,'项目阶段交接','virtual']);previousPhase=phaseOutput.id;previousStage=null;
   const phaseStages=views[phase].stages;for(const stage of phaseStages){
   const scope='stage/'+phase+'/'+stage.id,files=views[phase].canvasFiles?.[stage.id]||{files:[],edges:[]},items=[...views[phase].tasks.filter(t=>t.stage===stage.id),...files.files],ids=new Set(items.map(t=>t.id));
   const stageEdges=[...(views[phase].edges?.[stage.id]||[]),...files.edges].filter(e=>ids.has(e[0])&&ids.has(e[1]));
   const shell=enclose(items,stageEdges,scope,'阶段');
   const input={...shell.nodes[0],phase,stageId:stage.id},output={...shell.nodes.at(-1),phase,stageId:stage.id};nodes.push(input,output);
   if(previousStage)edges.push([previousStage,input.id,'子阶段交接','virtual']);else edges.push([phaseInput.id,input.id,'阶段开始','virtual']);previousStage=output.id;
   const packageIds=new Map();
   for(const item of items){if(item.fileNode){const id='asset/'+phase+'/'+stage.id+'/'+item.id;nodes.push({...item,id,phase,stageId:stage.id,viewKind:'file'});packageIds.set(item.id,{entry:id,exit:id});continue}const local=internalFor(phase,stage.id,item)||{nodes:[],edges:[]},inside=local.inputId&&local.outputId?local:enclose(local.nodes||[],local.edges||[],'task/'+phase+'/'+stage.id+'/'+item.id,'工作包');
    const prefix='task/'+phase+'/'+stage.id+'/'+item.id+'/',rename=id=>prefix+id,entry=rename(inside.inputId),exit=rename(inside.outputId);packageIds.set(item.id,{entry,exit});
    nodes.push(...inside.nodes.map(n=>({...n,id:rename(n.id),phase,stageId:stage.id,packageId:item.id})));
    edges.push(...inside.edges.map(e=>[rename(e[0]),rename(e[1]),e[2],e[3],e[4]]));
    packages.push({phase,stageId:stage.id,packageId:item.id,inputId:entry,outputId:exit});
   }
   for(const e of shell.edges){const from=e[0]===shell.inputId?input.id:e[0]===shell.outputId?output.id:packageIds.get(e[0])?.exit,to=e[1]===shell.inputId?input.id:e[1]===shell.outputId?output.id:packageIds.get(e[1])?.entry;if(from&&to)edges.push([from,to,e[2],e[3],e[4]])}
   stages.push({phase,stageId:stage.id,inputId:input.id,outputId:output.id,packageIds:items.filter(t=>!t.fileNode).map(t=>t.id)});
   }if(previousStage)edges.push([previousStage,phaseOutput.id,'阶段结束','virtual']);else edges.push([phaseInput.id,phaseOutput.id,'空阶段','virtual']);phaseGroups.push({phase,inputId:phaseInput.id,outputId:phaseOutput.id,stageIds:phaseStages.map(s=>s.id)});
  }
  return {nodes,edges,stages,packages,phaseGroups,inputId:phaseGroups[0]?.inputId,outputId:phaseGroups.at(-1)?.outputId};
 }
 return {phases,packageOverview,workspaceSub,workspaceKey,adjacent,boundaryPackage,requirements,stages,internal,enclose,integrate};
})();
