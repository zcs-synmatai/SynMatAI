/* Mounts the shared workspace shell around legacy task and calculation surfaces. */
(()=>{
 const components=window.ProjectWorkspaceComponents,controller=window.ProjectWorkspaceController;
 const sidebar=document.querySelector('.sidebar'),brand=sidebar?.querySelector('.brand');
 const flowNav=sidebar?.querySelector('[data-nav="流程V3"]'),workspaceNav=sidebar?.querySelector('[data-nav="任务"]');
 if(flowNav)flowNav.classList.add('workspace-merged-nav-hidden');
 if(workspaceNav){workspaceNav.querySelector('span')?.replaceChildren('项目工作区');workspaceNav.setAttribute('aria-label','项目工作区');workspaceNav.title='项目流程与工作台'}
 sidebar?.querySelector('.workspace-conversation-launcher')?.remove();
 if(!document.querySelector('.workspace-conversation-scrim'))document.body.insertAdjacentHTML('beforeend','<button type="button" class="workspace-conversation-scrim" data-conversation-overlay-close aria-label="关闭项目内对话"></button>');
 document.body.classList.add('workspace-nav-collapsed');
 try{localStorage.setItem('synmat-global-nav-collapsed','1')}catch{}
 const archive=sidebar?.querySelector('.sidebar-archive');if(archive)archive.open=false;
 sidebar?.querySelectorAll('nav [data-nav]').forEach(button=>{const label=button.getAttribute('aria-label')||button.querySelector('span')?.textContent?.trim()||button.dataset.nav;button.dataset.sidebarTooltip=label;button.setAttribute('aria-label',label);button.removeAttribute('title')});
 const archiveSummary=archive?.querySelector(':scope>summary');if(archiveSummary){archiveSummary.dataset.sidebarTooltip='回收站';archiveSummary.setAttribute('aria-label','回收站')}
 const activeConversationShell=()=>document.querySelector('.research-desk:not(.hidden),.workbench:not(.hidden),#research-flow-page.project-v3:not(.hidden)');
 let peekHideTimer=0;
 const closeConversationPeek=()=>{clearTimeout(peekHideTimer);document.querySelectorAll('.workspace-conversation-peek.is-open').forEach(peek=>{peek.classList.remove('is-open');peek.setAttribute('aria-hidden','true');peek.inert=true})};
 const scheduleConversationPeekClose=()=>{clearTimeout(peekHideTimer);peekHideTimer=setTimeout(closeConversationPeek,140)};
 const openConversationPeek=button=>{
  clearTimeout(peekHideTimer);const state=controller.conversationState();if(!state.effectiveCollapsed||state.viewportForced||state.overlayOpen)return;
  const peek=button.closest('.research-chat,.copilot')?.querySelector(':scope>.workspace-conversation-peek');if(!peek)return;
  peek.classList.add('is-open');peek.setAttribute('aria-hidden','false');peek.inert=false;
 };
 const mountConversationPeek=(shell=activeConversationShell())=>{
  const rail=shell?.querySelector(':scope>.workspace-conversation-rail'),chat=shell?.querySelector(':scope>.research-chat,:scope>.copilot');if(!rail||!chat)return;
  chat.querySelector(':scope>.workspace-conversation-peek')?.remove();
  const peek=rail.cloneNode(true);peek.classList.add('workspace-conversation-peek');peek.dataset.conversationPeek='';peek.setAttribute('aria-label','项目内对话预览');peek.setAttribute('aria-hidden','true');peek.inert=true;peek.querySelector('[data-conversation-rail-toggle]')?.remove();chat.append(peek);
  const button=chat.querySelector('[data-workspace-conversation-toggle]');if(button){button.onmouseenter=()=>openConversationPeek(button);button.onmouseleave=scheduleConversationPeekClose;button.onfocus=()=>openConversationPeek(button);button.onblur=scheduleConversationPeekClose}
  peek.onmouseenter=()=>clearTimeout(peekHideTimer);peek.onmouseleave=scheduleConversationPeekClose;
 };
 const syncConversationLauncher=()=>{
  const conversation=controller.conversationState(),expanded=!conversation.effectiveCollapsed||conversation.overlayOpen;
  document.querySelectorAll('[data-workspace-conversation-toggle]').forEach(button=>{button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'收起项目内对话':'展开项目内对话');button.title=expanded?'收起项目内对话':'展开项目内对话';button.classList.toggle('is-expanded',expanded)});
  closeConversationPeek();mountConversationPeek();
 };
 const setConversationCollapsed=(_shell,collapsed)=>controller.setConversationsCollapsed(collapsed);
 const workbench=document.querySelector('.workbench'),copilot=workbench?.querySelector(':scope>.copilot');
 if(workbench&&copilot&&!workbench.querySelector(':scope>.workspace-conversation-rail'))copilot.insertAdjacentHTML('beforebegin',components.conversationRail({rows:[{id:'calculation',name:'计算模拟',meta:'当前任务对话',icon:'spark'}],currentId:'calculation',footerLabel:'当前区域',footerValue:'工作台',staticMode:true}));
 const calculationTitle=copilot?.querySelector(':scope>.panel-title');
 if(calculationTitle&&!calculationTitle.querySelector('[data-workspace-conversation-toggle]')){
  const agentTitle=calculationTitle.querySelector(':scope>.copilot-title');
  calculationTitle.insertAdjacentHTML('afterbegin','<div class="workspace-agent-heading">'+components.conversationToggle()+'<span class="workspace-agent-divider" aria-hidden="true"></span></div>');
  if(agentTitle)calculationTitle.querySelector(':scope>.workspace-agent-heading')?.append(agentTitle);
 }
 const calculationPreview=workbench?.querySelector(':scope>.right-workspace');
 if(calculationPreview&&!calculationPreview.querySelector(':scope>.calculation-workspace-head'))calculationPreview.insertAdjacentHTML('afterbegin','<div class="calculation-workspace-head">'+ProjectWorkspace.markup('task')+'</div>');
 if(workbench&&copilot&&!copilot.querySelector(':scope>.workspace-chat-breadcrumb'))copilot.insertAdjacentHTML('afterbegin',components.breadcrumb(controller.getBreadcrumb()));
 if(workbench&&copilot&&!workbench.querySelector('[data-workspace-resizer]'))copilot.insertAdjacentHTML('afterend',components.resizer({className:'workspace-static-resizer',value:controller.getChatWidth()}));
 syncConversationLauncher();
 controller.syncBreadcrumb();
 document.addEventListener('click',event=>{
  const stableConversationToggle=event.target.closest('[data-workspace-conversation-toggle]');
  if(stableConversationToggle){const current=controller.conversationState(),expanded=!current.effectiveCollapsed||current.overlayOpen;controller.setConversationsCollapsed(expanded);return}
  const peekConversation=event.target.closest('.workspace-conversation-peek [data-conversation-select]');
  if(peekConversation){const shell=activeConversationShell(),target=[...shell?.querySelectorAll(':scope>.workspace-conversation-rail [data-conversation-select]')||[]].find(button=>button.dataset.conversationSelect===peekConversation.dataset.conversationSelect);closeConversationPeek();target?.click();return}
  if(event.target.closest('[data-conversation-overlay-close]')){controller.closeConversationOverlay();return}
  const calculationMode=event.target.closest('.workbench [data-project-workspace-mode]');
  if(calculationMode){if(calculationMode.dataset.projectWorkspaceMode==='flow'){const project=window.ProjectStore?.active();document.dispatchEvent(new CustomEvent('synmat:open-project-flow-context',{detail:{phase:project?.currentPhase||'研发',packageId:project?.currentNodeId||null}}))}return}
  const conversationToggle=event.target.closest('[data-conversation-rail-toggle]');if(!conversationToggle)return;
  controller.setConversationsCollapsed(true);
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeConversationPeek()});
 document.addEventListener('synmat:workspace-conversations',()=>syncConversationLauncher());
 document.addEventListener('synmat:task-workspace-visible',()=>queueMicrotask(()=>syncConversationLauncher()));
 const projectStore=()=>typeof ProjectStore!=='undefined'?ProjectStore:null;
 const openPrimaryTaskWorkspace=(project=projectStore()?.active?.())=>{let resolved=false;document.dispatchEvent(new CustomEvent('synmat:request-primary-task-workspace',{detail:{phase:project?.currentPhase||'项目立项',nodeId:project?.currentNodeId||'',respond:value=>{resolved=!!value}}}));if(!resolved)document.dispatchEvent(new CustomEvent('synmat:task-workspace-visible'));return resolved};
 const restorePrimaryTaskWorkspace=()=>openPrimaryTaskWorkspace();
 const restoreLegacyWorkspace=()=>{const project=projectStore()?.active?.();if(project?.lastRoute==='#workspace/flow'){controller.activate('flow');document.dispatchEvent(new CustomEvent('synmat:open-project-flow-context',{detail:{phase:project.currentPhase||'项目立项',packageId:project.currentNodeId||null}}));return}controller.activate('task');restorePrimaryTaskWorkspace()};
 const normalizeLegacyTaskRoute=()=>{if(location.hash!=='#task')return false;if(projectStore())queueMicrotask(restoreLegacyWorkspace);else window.addEventListener('DOMContentLoaded',restoreLegacyWorkspace,{once:true});return true};
 window.addEventListener('popstate',normalizeLegacyTaskRoute);
 window.addEventListener('hashchange',normalizeLegacyTaskRoute);
 window.ProjectWorkspaceShell={syncConversationLauncher,setConversationCollapsed,openPrimaryTaskWorkspace};
 if(!normalizeLegacyTaskRoute()&&!location.hash)queueMicrotask(restorePrimaryTaskWorkspace);
})();
