// Finishing a stage task is distinct from running the demonstration workflow.
(()=>{
 const button=document.getElementById('complete-simulation-task');
 const dialog=document.createElement('dialog');
 dialog.className='completion-dialog';
 dialog.setAttribute('aria-labelledby','simulation-completion-title');
 dialog.innerHTML='<h2 id="simulation-completion-title">完成计算模拟阶段任务？</h2><div id="simulation-completion-summary"></div><p class="research-muted">确认后任务变为已完成，计算配置、运行和待办将锁定；仍可查看节点、结果、上传资料、继续对话及导出资料。此操作只结束交互原型中的阶段任务，不代表真实科学计算或技术验证通过。</p><div class="completion-actions"><button class="btn" data-simulation-todos>查看待办</button><button class="btn" data-simulation-cancel>继续检查</button><button class="btn primary" data-simulation-confirm>确认完成</button></div>';
 document.body.append(dialog);
 const confirm=dialog.querySelector('[data-simulation-confirm]');
 function readiness(){return {pending:ensureDocumentTasks().filter(t=>t.status!=='done').length,ready:node('analysis1')?.status==='done',running:busy}}
 function refresh(){
  button.disabled=!!state.stageTaskComplete||busy;
  button.innerHTML=icon('check')+(state.stageTaskComplete?'阶段任务已完成':'完成阶段任务');
  button.title=state.stageTaskComplete?'计算模拟阶段任务已完成':busy?'请等待工作流运行结束':'确认计算产物和待办已完成后，结束阶段任务';
  const visible=!document.querySelector('.workbench').classList.contains('hidden');
  if(state.stageTaskComplete&&visible){$('#task-status').textContent='已完成';$('#task-status').dataset.progress='已完成'}
  for(const id of ['validate','add-todo']){const el=document.getElementById(id);if(el)el.disabled=!!state.stageTaskComplete||busy}
  $('#chat-form').inert=false;
  if(!state.stageTaskComplete)return;
  for(const id of ['run','validate','add-node','run-node','ai-edit','add-todo']){const el=document.getElementById(id);if(el)el.disabled=true}
  document.querySelectorAll('.workbench #node-form input,.workbench #node-form select,.workbench #node-form button,.workbench .job-settings input,.workbench .job-settings select,.workbench .job-settings button,.workbench [data-bind],.workbench [data-apply],.workbench [data-view]').forEach(el=>el.disabled=true);
  const composer=$('#chat-form');composer.inert=false;composer.title='任务已完成，可继续对话与上传资料';
  const dock=$('#copilot-dock');
  dock.querySelectorAll('.task-checkbox,[data-task-status],[data-task-owner],[data-task-date],[data-priority]').forEach(el=>el.disabled=true);
  dock.querySelectorAll('[contenteditable]').forEach(el=>el.contentEditable='false');
 }
 function showConfirmation(){
  if(state.stageTaskComplete)return;
  const status=readiness();
  $('#simulation-completion-summary').innerHTML=`<p>${status.running?'工作流正在运行，请结束后再完成阶段任务。':status.pending||!status.ready?'请先完成以下准备，再确认结束阶段任务。':'演示结果分析与全部待办已完成，请确认产物已核对并归档。'}</p><ul><li>演示结果分析：${status.ready?'已生成':'尚未完成'}</li><li>任务待办：${status.pending?'还有 '+status.pending+' 项未完成':'全部完成'}</li></ul>`;
  confirm.disabled=status.running||status.pending>0||!status.ready;
  dialog.showModal();
 }
 button.onclick=showConfirmation;
 dialog.querySelector('[data-simulation-cancel]').onclick=()=>dialog.close();
 dialog.querySelector('[data-simulation-todos]').onclick=()=>{dialog.close();todoFilter='all';toggleDock('todos',true)};
 confirm.onclick=()=>{
  const status=readiness();if(status.running||status.pending||!status.ready||state.stageTaskComplete)return;
  closeTaskPopup();state.stageTaskComplete=true;state.stageTaskCompletedAt=new Date().toISOString();
  state.history.push({time:new Date().toLocaleString('zh-CN'),text:'确认完成计算模拟阶段任务',id:state.selected});
  save();dialog.close();render();refresh();document.dispatchEvent(new CustomEvent('synmat:simulation-complete'));toast('计算模拟阶段任务已完成');
 };
 // Existing renderers can recreate forms and docks, so apply read-only state afterwards.
 const header=renderHeader,detail=renderDetail,todos=renderTodos,dock=renderDock;
 renderHeader=function(){header();refresh()};
 renderDetail=function(){detail();refresh()};
 renderTodos=function(){todos();refresh()};
 renderDock=function(...args){dock(...args);refresh()};
 document.addEventListener('synmat:flow-progress',e=>{if(e.detail.tasks?.['研发/T20']?.status==='已完成'&&!state.stageTaskComplete){state.stageTaskComplete=true;save();refresh()}});
 refresh();
})();
