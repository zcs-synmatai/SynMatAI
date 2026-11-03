/* Workspace-local todo editor. Experiments are opened and edited through ELN. */
window.TaskTodoEditor=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let dialog;
 function editor(ctx,index){
  const old=index==null?null:ctx.todos[index],locked=ctx.locked();
  const t=old||{text:'',type:'调研',executionMode:'human',owner:'林晓',collaborators:[],estimate:'',status:'todo',inputs:[],outputs:[]};
  if(!dialog){dialog=document.createElement('dialog');dialog.className='ut-editor';dialog.setAttribute('aria-label','待办事项配置');document.body.append(dialog)}
  const opener=document.activeElement,catalog=ctx.catalog();
  const checks=(key,names)=>`<fieldset><legend>${key==='inputs'?'输入文档':'产出物'}</legend>${catalog.map(n=>`<label><input type="checkbox" name="${key}" value="${esc(n)}" ${names.includes(n)?'checked':''} ${locked?'disabled':''}>${esc(n)}</label>`).join('')||'<p class="ut-note">暂无文件，请先在任务资产中上传。</p>'}</fieldset>`;
  dialog.innerHTML=`<h2>${locked?'查看':old?'编辑':'添加'}待办${old?' · '+esc(old.id):''}</h2><form><label>名称<input name="text" aria-label="待办名称" required maxlength="200" value="${esc(t.text)}" ${locked?'readonly':''}></label><div class="ut-edit-grid"><label>类型<select name="type" aria-label="待办类型" ${locked?'disabled':''}>${UnifiedTasks.types.map(n=>`<option ${t.type===n?'selected':''}>${n}</option>`).join('')}</select></label><label>执行方式<select name="executionMode" aria-label="待办执行方式" ${locked?'disabled':''}>${Object.entries(UnifiedTasks.modes).map(([v,n])=>`<option value="${v}" ${t.executionMode===v?'selected':''}>${n}</option>`).join('')}</select></label><label>负责人<select name="owner" aria-label="待办负责人" ${locked?'disabled':''}>${[...new Set(['林晓','张三','王宁','陈妍',...UnifiedTasks.agents,t.owner])].filter(Boolean).map(n=>`<option ${n===t.owner?'selected':''}>${esc(n)}</option>`).join('')}</select></label><label>预计时间<input name="estimate" aria-label="待办预计时间" placeholder="如：10 月 30 日 · 预计 2 小时" value="${esc(t.estimate||t.due||'')}" ${locked?'readonly':''}></label><label>状态<select name="status" aria-label="待办状态" ${locked?'disabled':''}>${Object.entries(UnifiedTasks.statusNames).map(([v,n])=>`<option value="${v}" ${t.status===v?'selected':''}>${n}</option>`).join('')}</select></label></div><fieldset><legend>协作人</legend>${['林晓','张三','王宁','陈妍',...UnifiedTasks.agents].map(n=>`<label><input type="checkbox" name="collaborators" value="${n}" ${t.collaborators.includes(n)?'checked':''} ${locked?'disabled':''}>${n}</label>`).join('')}</fieldset><div class="ut-edit-grid">${checks('inputs',t.inputs)}${checks('outputs',t.outputs)}</div><p class="ut-note" id="ut-experiment-note" hidden>实验待办来自项目实验，以同一编号自动汇入清单。请在项目实验中登记或配置，避免重复创建。</p><p class="ut-note">执行方式和完成状态由用户确认，仅保存本机原型配置；不会启动真实 AI 或代替实验执行。</p><p class="ut-error" role="alert"></p><footer>${old&&!locked?'<button type="button" class="btn" data-ut-delete>删除待办</button>':''}<button type="button" class="btn" data-ut-close>关闭</button><button type="button" class="btn" data-ut-experiments hidden>前往项目实验</button>${locked?'':'<button class="btn primary" data-ut-save>保存待办</button>'}</footer></form>`;
  dialog.querySelector('[data-ut-close]').onclick=()=>dialog.close();dialog.onclose=()=>{if(opener?.isConnected)opener.focus()};
  const mode=dialog.querySelector('[name="executionMode"]'),owner=dialog.querySelector('[name="owner"]');
  const syncOwner=()=>{const names=mode.value==='ai'?UnifiedTasks.agents:['林晓','张三','王宁','陈妍'];const previous=owner.value;owner.innerHTML=names.map(n=>'<option>'+esc(n)+'</option>').join('');owner.value=names.includes(previous)?previous:mode.value==='ai'?UnifiedTasks.suggestedAgent(t):'林晓'};mode.onchange=syncOwner;syncOwner();
  const type=dialog.querySelector('[name="type"]');const toggle=()=>{const experiment=type.value==='实验';dialog.querySelector('#ut-experiment-note').hidden=!experiment;dialog.querySelector('[data-ut-experiments]').hidden=!experiment;if(dialog.querySelector('[data-ut-save]'))dialog.querySelector('[data-ut-save]').disabled=experiment};type.onchange=toggle;toggle();
  dialog.querySelector('[data-ut-experiments]').onclick=()=>{dialog.close();document.querySelector('[data-nav="实验"]').click()};
  dialog.querySelector('[data-ut-delete]')?.addEventListener('click',()=>{if(ctx.locked())return;ctx.todos.splice(index,1);ctx.save();dialog.close();ctx.render()});
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();if(ctx.locked()||type.value==='实验')return;const data=new FormData(e.target),text=String(data.get('text')||'').trim();if(!text)return;
   const values={text,type:data.get('type'),executionMode:data.get('executionMode'),owner:data.get('owner'),collaborators:data.getAll('collaborators').filter(n=>n!==data.get('owner')),estimate:String(data.get('estimate')||'').trim(),status:data.get('status'),done:data.get('status')==='done',inputs:data.getAll('inputs'),outputs:data.getAll('outputs')};
   if(old)Object.assign(old,values);else ctx.todos.push({...values,due:'',priority:'normal'});UnifiedTasks.normalize(ctx.todos);ctx.save();dialog.close();ctx.render();ctx.checkCompletion();
  };
  dialog.showModal();
 }
 function bind(root,ctx){
  const search=root.querySelector('#unified-task-search');if(search)search.oninput=e=>{ctx.filters.search=e.target.value;const pos=e.target.selectionStart;ctx.render();const field=root.querySelector('#unified-task-search');field.focus();field.setSelectionRange(pos,pos)};
  for(const [id,key] of [['unified-task-type','type'],['unified-task-mode','mode']]){const el=root.querySelector('#'+id);if(el)el.onchange=e=>{ctx.filters[key]=e.target.value;ctx.render()}}
  root.querySelector('#unified-task-add')?.addEventListener('click',()=>editor(ctx,null));
  root.querySelectorAll('[data-edit-unified]').forEach(b=>b.onclick=()=>editor(ctx,+b.dataset.editUnified));
  root.querySelectorAll('[data-toggle-unified]').forEach(b=>b.onclick=()=>{if(ctx.locked())return;const t=ctx.todos[+b.dataset.toggleUnified];t.done=!t.done;t.status=t.done?'done':'todo';ctx.save();ctx.render();ctx.checkCompletion()});
  root.querySelectorAll('[data-task-experiment]').forEach(b=>b.onclick=()=>document.dispatchEvent(new CustomEvent('synmat:open-experiment',{detail:{experimentId:b.dataset.taskExperiment}})));
  root.querySelectorAll('[data-unified-asset]').forEach(b=>b.onclick=()=>document.dispatchEvent(new CustomEvent('synmat:open-project-asset',{detail:{id:b.dataset.unifiedAsset,version:b.dataset.version}})));
 }
 return {bind,open:editor};
})();
