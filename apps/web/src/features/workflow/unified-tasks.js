/* A view over task todos and stable experiment identities; no copied ELN state. */
window.UnifiedTasks=(()=>{
 const types=['调研','文档整理','计算模拟','实验','测试','自定义'];
 const modes={human:'人工完成',ai:'AI 完成',collaborative:'人机协作',simulation:'模拟执行'};
 const statusNames={todo:'未开始',doing:'进行中',blocked:'受阻',done:'已完成'};
 const agents=['资料整理 Agent','文献调研 Agent','证据核查 Agent','配方核算 Agent','方案规划 Agent','数据分析 Agent','进度汇报 Agent','调研 Agent','DOE实验设计 Agent','实验协作 Agent','模拟计算 Agent','工艺规划 Agent'];
 const suggestedAgent=t=>/闭合|账本|配方核算/.test(t.text)?agents[3]:/文献|专利|调研/.test(t.text)?agents[1]:/核对|复核|缺口/.test(t.text)?agents[2]:agents[0];
 function assignAgent(t,agent=suggestedAgent(t)){const previous=t.owner;if(previous&&!/Agent$/.test(previous))t.collaborators=[...new Set([...(t.collaborators||[]),previous])];t.executionMode='ai';t.owner=agent;return t}
 function applyAgentExamples(todos){
  const eligible=new Set(['复核R1—R4各独立层批量闭合','归集黏度与过滤损失证据','复核各层1000g湿料、水与硝酸质量账本','梳理候选技术路线与证据缺口','补充专利、文献与供应商资料','归集10min外观和1h保光及划格记录','整理候选路线与下一阶段准入依据','梳理候选技术路线、整理证据缺口']);
  for(const t of todos)if(!t.done&&eligible.has(t.text)&&(!t.executionMode||t.executionMode==='human')&&(!t.owner||t.owner==='林晓')){assignAgent(t);t.type=/调研|文献|专利/.test(t.text)?'调研':'分析';}
  if(!todos.some(t=>t.executionMode==='ai'))todos.push({text:'整理本任务输入资料与证据索引（AI演示）',type:'分析',executionMode:'ai',owner:agents[0],collaborators:['林晓'],done:false,status:'todo',due:'',priority:'normal',inputs:[],outputs:[],estimate:''});
  return normalize(todos);
 }
 function applyAgentTaskPack(todos,inputNames=[]){
  const definitions=[
   ['sop-checklist','提取 SOP 中的本任务要求与验收清单','分析','证据核查 Agent'],
   ['research-evidence','汇总相关文献与专利线索','调研','文献调研 Agent'],
   ['version-check','检查输入文档版本与引用一致性','分析','证据核查 Agent'],
   ['execution-draft','草拟任务执行方案与记录模板','文档','方案规划 Agent'],
   ['evidence-index','建立实验记录与证据的关联索引','文档','资料整理 Agent'],
   ['data-gaps','梳理已有数据的缺项与异常提示','分析','数据分析 Agent'],
   ['progress-brief','生成阶段进展摘要与风险清单','文档','进度汇报 Agent'],
   ['delivery-draft','整理交付物草稿与人工复核要点','文档','资料整理 Agent']
  ];
  const inputs=inputNames.filter(n=>/SOP|任务资料|准备清单/.test(n)).slice(0,2);
  for(const [key,text,type,owner] of definitions)if(!todos.some(t=>t.agentExampleKey===key||t.text===text))todos.push({text,type,owner,executionMode:'ai',collaborators:['林晓'],done:false,status:'todo',due:'',priority:'normal',inputs:[...inputs],outputs:[],estimate:'',agentExampleKey:key});
  return normalize(todos);
 }
 const infer=text=>/模拟|计算/.test(text)?'计算模拟':/实验/.test(text)?'实验':/测试|验证|测量/.test(text)?'测试':/调研|专利|文献/.test(text)?'调研':/文档|整理|报告/.test(text)?'文档整理':'自定义';
 function normalize(todos){for(const t of todos){t.id||=WorkflowNumbering.nextTodoId(todos);t.type||=infer(t.text);t.executionMode||='human';t.collaborators||=[];t.inputs||=[];t.outputs||=[];t.estimate||='';t.status=t.done?'done':t.status==='progress'?'doing':t.status||'todo'}return todos}
 function rows(todos,experiments,state,model){normalize(todos);for(const t of todos)if(t.executionMode==='ai'&&!/Agent$/.test(t.owner||''))assignAgent(t);return [
  ...todos.map((t,index)=>({...t,name:t.text,statusName:t.executionMode==='ai'&&!t.done&&t.status==='doing'?'进行中 · Agent工作中':statusNames[t.done?'done':t.status]||'未开始',index,kind:'todo'})),
  ...experiments.map(e=>({id:e.id,name:e.name,type:'实验',executionMode:'human',owner:model.people.find(p=>p.id===e.executor)?.name||'待分配',collaborators:[model.people.find(p=>p.id===e.tester)?.name||'待分配'],estimate:e.estimate||e.due||'',statusName:e.status,done:e.status==='完成',kind:'experiment',experiment:e,delivery:model.delivery(state,e)}))
 ]}
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const modeLabel=r=>r.executionMode==='ai'?(r.done?'AI 已完成':'AI 执行'):r.executionMode==='simulation'?(r.done?'模拟已完成':'模拟执行'):r.executionMode==='collaborative'?(r.done?'协作已完成':'人机协作'):'人工';
 function render(rows,filters={},compact=false,locked=false){
  const filtered=rows.filter(r=>(!filters.type||r.type===filters.type)&&(!filters.mode||r.executionMode===filters.mode)&&(!filters.search||[r.id,r.name,r.owner,...r.collaborators].join(' ').toLowerCase().includes(filters.search.toLowerCase())));
  const completed=rows.filter(r=>r.done).length,percent=rows.length?Math.round(completed/rows.length*100):0,counts={ai:rows.filter(r=>r.executionMode==='ai').length,human:rows.filter(r=>r.executionMode==='human').length,collaborative:rows.filter(r=>r.executionMode==='collaborative').length,simulation:rows.filter(r=>r.executionMode==='simulation').length};
  const icon=id=>`<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const files=(names,label)=>names.length?names.map(n=>`<button class="ut-file" data-open="${esc(n)}" title="${esc(n)}">${esc(n)}</button>`).join(''):`<span class="ut-muted">未关联${label}</span>`;
  const typeIcon=type=>({'实验':'flask','模拟':'grid','模拟计算':'grid','文档':'file','调研':'asset-search-icon','会议':'calendar','审批':'check','分析':'flow'})[type]||'grid';
  const row=r=>{
   const agent=/Agent$/.test(r.owner||''),state=r.statusName||'未开始';
   const input=r.kind==='experiment'?`<button class="ut-file" data-unified-asset="${esc(r.experiment.scheme.asset)}" data-version="${esc(r.experiment.scheme.version)}">SOP ${esc(r.experiment.scheme.version)}</button>`:files(r.inputs,'输入');
   const output=r.kind==='experiment'?`<button class="ut-link" data-task-experiment="${esc(r.id)}">${r.delivery.measured}/${r.delivery.required} 条记录</button>`:files(r.outputs,'产出');
   return `<article class="ut-row ${r.done?'ut-done':''}" data-unified-row="${esc(r.id)}"><div class="ut-title" data-label="待办事项"><div class="ut-title-text"><div class="ut-title-meta"><span class="ut-id">${esc(r.id)}</span><span class="ut-type" data-type="${esc(r.type)}">${icon(typeIcon(r.type))}${esc(r.type)}</span></div><button class="ut-name" title="${esc(r.name)}" ${r.kind==='experiment'?`data-task-experiment="${esc(r.id)}"`:`data-edit-unified="${r.index}"`}>${esc(r.name)}</button></div></div><div class="ut-person" data-label="负责人 / 协作人"><span class="ut-avatar ${agent?'is-agent':''}" aria-hidden="true">${agent?icon('spark'):esc((r.owner||'待')[0])}</span><span class="ut-person-copy"><strong>${esc(r.owner)}</strong><small>${r.collaborators.length?'协作 '+esc(r.collaborators.join('、')):'协作 —'}</small></span></div><div class="ut-execution" data-label="执行方式"><span class="ut-mode" data-mode="${esc(r.executionMode)}">${r.executionMode==='ai'?icon('spark'):''}${modeLabel(r)}</span></div><div class="ut-estimate" data-label="预计时间">${r.estimate||r.due?esc(r.estimate||r.due):`<span class="ut-unscheduled">${icon('calendar')}待排期</span>`}</div><div class="ut-state-cell" data-label="状态">${r.kind==='todo'?`<button class="ut-status" data-toggle-unified="${r.index}" data-completed="${r.done}" data-state="${esc(state)}" ${locked?'disabled':''} title="${r.done?'重新打开':'标记完成'}"><i aria-hidden="true">${r.done?'✓':''}</i>${esc(state)}</button>`:`<span class="ut-status" data-completed="${r.done}" data-state="${esc(state)}"><i aria-hidden="true">${r.done?'✓':''}</i>${esc(state)}</span>`}</div><div class="ut-eln" data-label="ELN">${r.kind==='experiment'?`<button class="ut-eln-button" data-task-experiment="${esc(r.id)}">${icon('file')}ELN</button>`:'<span class="ut-muted" aria-label="ELN不适用">—</span>'}</div><div class="ut-files ut-input" data-label="输入文档">${input}</div><div class="ut-files ut-output" data-label="产出物">${output}</div><div class="ut-chat-cell" data-label="对话"><button type="button" class="ut-chat" data-todo-chat="${esc(r.id)}" aria-label="打开 ${esc(r.id)} 待办对话" title="专属对话">${icon('todo-dialogue')}</button></div></article>`;
  };
  return `<section class="unified-tasks ${compact?'ut-compact':''}" aria-label="统一待办清单">${compact?'':`<div class="ut-toolbar"><label class="ut-search">${icon('asset-search-icon')}<input id="unified-task-search" aria-label="搜索待办" placeholder="搜索编号、名称或负责人" value="${esc(filters.search||'')}"></label><select id="unified-task-type" aria-label="筛选待办类型"><option value="">全部类型</option>${types.map(t=>`<option ${filters.type===t?'selected':''}>${t}</option>`).join('')}</select><select id="unified-task-mode" aria-label="筛选执行方式"><option value="">全部执行方式</option>${Object.entries(modes).map(([v,n])=>`<option value="${v}" ${filters.mode===v?'selected':''}>${n}</option>`).join('')}</select><button class="btn primary" id="unified-task-add" ${locked?'disabled':''}>${icon('plus')}添加待办</button></div>`}<div class="ut-status-summary"><div class="ut-summary-progress"><span>${compact?'':filtered.length+' 项待办'}</span><span class="ut-progress-rule" role="progressbar" aria-label="待办完成进度" aria-valuemin="0" aria-valuemax="${rows.length||1}" aria-valuenow="${completed}"><i style="width:${percent}%"></i></span><span>${completed}/${rows.length} 已完成</span></div>${compact?'':`<div class="ut-workforce"><span class="ut-workforce-agent">${icon('spark')}Agent <b>${counts.ai}</b></span><span>人工 <b>${counts.human}</b></span><span>协作 <b>${counts.collaborative}</b></span></div>`}</div><div class="ut-table"><div class="ut-grid-head" aria-hidden="true"><span>待办事项</span><span>负责人 / 协作人</span><span>执行方式</span><span>预计时间</span><span>状态</span><span>ELN</span><span>输入文档</span><span>产出物</span><span>对话</span></div><div class="ut-list">${filtered.map(row).join('')||'<div class="ut-empty"><strong>没有符合条件的待办</strong><p>试试其他关键词或筛选条件。</p></div>'}</div></div></section>`;
 }

 return {types,modes,statusNames,agents,suggestedAgent,assignAgent,applyAgentExamples,applyAgentTaskPack,normalize,rows,render};
})();


