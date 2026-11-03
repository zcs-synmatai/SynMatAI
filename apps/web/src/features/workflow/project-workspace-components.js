/* Shared, presentation-only building blocks for the unified project workspace. */
(()=>{
 const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const icon=name=>`<svg aria-hidden="true"><use href="#${safe(name)}"/></svg>`;
 function modeSwitch({mode='task',attribute='data-project-workspace-view',extra='',label='项目工作区视图'}={}){
  const button=(value,name,iconName)=>`<button class="workspace-view-button" type="button" ${attribute}="${value}" aria-label="查看${name}" title="${name}" aria-pressed="${mode===value}">${icon(iconName)}<span class="workspace-view-label" aria-hidden="true">${name}</span></button>`;
  return `<div class="project-workspace-state-switch project-workspace-view-switch workspace-view-switch ${safe(extra)}" role="group" aria-label="${safe(label)}">${button('task','工作台','workspace')}${button('flow','项目流程','flow')}</div>`;
 }
 function breadcrumb(text){return `<div class="workspace-chat-breadcrumb">${icon('todo-dialogue')}<span>${safe(text||'项目工作区')}</span>${icon('chevron')}</div>`}
 function resizer({className='research-resizer',label='调整 AI 对话区域宽度',value}={}){
  const now=Number.isFinite(Number(value))?` aria-valuenow="${Math.round(Number(value))}"`:'';
  return `<div class="workspace-column-resizer ${safe(className)}" data-workspace-resizer tabindex="0" role="separator" aria-label="${safe(label)}" aria-orientation="vertical" aria-valuemin="240" aria-valuemax="1600"${now}></div>`;
 }
 function conversationToggle(){
  return `<button type="button" class="workspace-conversation-toggle" data-workspace-conversation-toggle aria-expanded="true" aria-label="收起项目内对话" title="收起项目内对话">${icon('todo-dialogue')}<span class="workspace-conversation-state" aria-hidden="true"></span></button>`;
 }
 function conversationRail({rows=[],currentId='',footerLabel='当前工作包',footerValue='',staticMode=false}={}){
  const items=rows.map(row=>`<button type="button"${staticMode?'':` data-conversation-select="${safe(row.id)}"`} aria-current="${row.id===currentId}">${icon(row.icon||'todo-dialogue')}<span><strong>${safe(row.name)}</strong><small>${safe(row.meta||'')}</small></span></button>`).join('');
  return `<aside class="workspace-conversation-rail${staticMode?' workspace-conversation-rail-static':''}" aria-label="项目内对话"><header><strong>${icon('todo-dialogue')}<span>项目内对话</span></strong><button type="button" class="icon-btn" data-conversation-rail-toggle aria-label="关闭项目内对话" title="关闭项目内对话">${icon('chevron')}</button></header><nav aria-label="当前工作包对话">${items}</nav><footer><span>${safe(footerLabel)}</span><strong>${safe(footerValue)}</strong></footer></aside>`;
 }
 window.ProjectWorkspaceComponents={safe,icon,modeSwitch,breadcrumb,resizer,conversationToggle,conversationRail};
})();
