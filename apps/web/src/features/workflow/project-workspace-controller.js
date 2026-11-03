/* State, routing, breadcrumb and resizable-column controller for the project workspace. */
(()=>{
 const components=window.ProjectWorkspaceComponents,root=document.documentElement;
 const routes={flow:'#workspace/flow',task:'#workspace/task'},widthKey='synmat-workspace-chat-width',conversationKey='synmat-workspace-conversations-collapsed';
 const limits={min:240,max:1600,home:360};
 const clampWidth=value=>Math.max(limits.min,Math.min(limits.max,Number(value)||limits.home));
 const storage={get(){try{return Number(localStorage.getItem(widthKey))}catch{return NaN}},set(value){try{localStorage.setItem(widthKey,String(Math.round(value)))}catch{}}};
 const compactViewport=window.matchMedia?.('(max-width: 740px)')||{matches:false,addEventListener(){}};
 const savedConversationPreference=(()=>{try{return localStorage.getItem(conversationKey)==='1'}catch{return false}})();
 const state={mode:location.hash.endsWith('/flow')?'flow':'task',chatWidth:limits.home,conversations:{userCollapsed:savedConversationPreference,viewportForced:compactViewport.matches,overlayOpen:false}};
 const stored=storage.get();if(Number.isFinite(stored)&&stored>=limits.min&&stored<=limits.max)state.chatWidth=stored;
 root.style.setProperty('--workspace-chat-width',state.chatWidth+'px');
 const breadcrumbSource=()=>document.querySelector('.breadcrumbs strong');
 const getBreadcrumb=()=>breadcrumbSource()?.textContent?.trim()||'项目工作区';
 const syncBreadcrumbLabels=text=>document.querySelectorAll('.workspace-chat-breadcrumb span').forEach(label=>label.textContent=text||getBreadcrumb());
 function setBreadcrumb(text,{updateSource=true}={}){const value=String(text||'项目工作区');if(updateSource&&breadcrumbSource())breadcrumbSource().textContent=value;syncBreadcrumbLabels(value);document.dispatchEvent(new CustomEvent('synmat:workspace-breadcrumb',{detail:{text:value}}));return value}
 function notifyWidth(reason){document.dispatchEvent(new CustomEvent('synmat:workspace-width-change',{detail:{width:state.chatWidth,mode:state.mode,reason}}))}
 function setChatWidth(value,{persist=true,reason='programmatic'}={}){state.chatWidth=clampWidth(value);root.style.setProperty('--workspace-chat-width',state.chatWidth+'px');if(persist)storage.set(state.chatWidth);document.querySelectorAll('[data-workspace-resizer]').forEach(handle=>handle.setAttribute('aria-valuenow',String(Math.round(state.chatWidth))));window.dispatchEvent(new Event('resize'));notifyWidth(reason);return state.chatWidth}
 function emphasizeTaskContent(documentOpen,{persist=false}={}){const appWidth=document.querySelector('.app')?.getBoundingClientRect?.().width||Math.max(0,(window.innerWidth||1280)-70),railWidth=conversationState().effectiveCollapsed?0:216,divider=8,previewWidth=documentOpen?Math.max(560,appWidth*.58):Math.max(320,Math.min(520,appWidth*.26));document.body.classList.toggle('workspace-document-open',!!documentOpen);return setChatWidth(appWidth-railWidth-divider-previewWidth,{persist})}
 function balanceFlowColumns({persist=false}={}){const appWidth=document.querySelector('.app')?.getBoundingClientRect?.().width||Math.max(0,(window.innerWidth||1280)-70),railWidth=conversationState().effectiveCollapsed?0:216,divider=8,sharedWidth=Math.max(0,appWidth-railWidth-divider);document.body.classList.remove('workspace-document-open');return setChatWidth(sharedWidth/2,{persist,reason:'flow-balance'})}
 const conversationState=()=>({...state.conversations,effectiveCollapsed:state.conversations.userCollapsed||state.conversations.viewportForced});
 function syncConversations({announce=true}={}){const current=conversationState();document.body.classList.toggle('workspace-conversations-collapsed',current.effectiveCollapsed);document.body.classList.toggle('workspace-conversations-forced',current.viewportForced);document.body.classList.toggle('workspace-conversations-overlay-open',current.overlayOpen);if(announce)document.dispatchEvent(new CustomEvent('synmat:workspace-conversations',{detail:current}));window.dispatchEvent(new Event('resize'));return current}
 function setConversationsCollapsed(collapsed,{persist=true}={}){if(state.conversations.viewportForced){state.conversations.overlayOpen=!collapsed}else{state.conversations.userCollapsed=!!collapsed;state.conversations.overlayOpen=false;if(persist)try{localStorage.setItem(conversationKey,collapsed?'1':'0')}catch{}}return syncConversations()}
 function closeConversationOverlay(){if(!state.conversations.overlayOpen)return conversationState();state.conversations.overlayOpen=false;return syncConversations()}
 function setViewportForced(forced){state.conversations.viewportForced=!!forced;state.conversations.overlayOpen=false;return syncConversations()}
 function activate(mode,{route=true}={}){if(!routes[mode])return;state.mode=mode;document.body.classList.add('project-workspace-active');document.body.classList.toggle('workspace-flow-state',mode==='flow');document.body.classList.toggle('workspace-task-state',mode==='task');if(route&&location.hash!==routes[mode])history.replaceState(null,'',location.pathname+location.search+routes[mode]);try{localStorage.setItem('synmat-project-workspace-mode',mode)}catch{}document.dispatchEvent(new CustomEvent('synmat:project-workspace-mode',{detail:{mode}}))}
 function pointerWidth(handle,event){const app=document.querySelector('.app')?.getBoundingClientRect();if(!app)return state.chatWidth;const conversation=handle.parentElement?.querySelector(':scope>.workspace-conversation-rail')?.getBoundingClientRect().width||0;return event.clientX-app.left-conversation}
 document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-workspace-resizer]');if(!handle||!document.body.matches('.task-workspace-active,.flow-canvas-active'))return;
  event.preventDefault();const pointerId=event.pointerId;handle.setPointerCapture?.(pointerId);
  const move=next=>{if(next.pointerId===pointerId)setChatWidth(pointerWidth(handle,next),{reason:'drag'})};
  const stop=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',stop);handle.removeEventListener('pointercancel',stop);handle.removeEventListener('lostpointercapture',stop);window.removeEventListener('blur',stop);if(handle.hasPointerCapture?.(pointerId))handle.releasePointerCapture(pointerId);notifyWidth('drag-end')};
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);handle.addEventListener('lostpointercapture',stop);window.addEventListener('blur',stop);
 });
 document.addEventListener('keydown',event=>{const handle=event.target.closest('[data-workspace-resizer]');if(!handle||!document.body.matches('.task-workspace-active,.flow-canvas-active')||!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();setChatWidth(event.key==='Home'?limits.home:state.chatWidth+(event.key==='ArrowLeft'?-16:16),{reason:'keyboard'})});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.conversations.overlayOpen)closeConversationOverlay()});
 compactViewport.addEventListener?.('change',event=>setViewportForced(event.matches));
 const source=breadcrumbSource();if(source)new MutationObserver(()=>syncBreadcrumbLabels()).observe(source,{childList:true,subtree:true,characterData:true});
 syncConversations({announce:false});
 const controller={routes,limits,state,activate,setBreadcrumb,getBreadcrumb,setChatWidth,getChatWidth:()=>state.chatWidth,resetChatWidth:()=>setChatWidth(limits.home),emphasizeTaskContent,balanceFlowColumns,syncBreadcrumb:()=>syncBreadcrumbLabels(),conversationState,setConversationsCollapsed,closeConversationOverlay,setViewportForced};
 const compatibility={activate,markup(mode,extra=''){return components.modeSwitch({mode,extra,attribute:'data-project-workspace-mode',label:'项目工作区状态'})},viewMarkup(mode,extra=''){return components.modeSwitch({mode,extra})}};
 Object.defineProperty(compatibility,'mode',{get:()=>state.mode});
 window.ProjectWorkspaceController=controller;window.ProjectWorkspace=compatibility;
})();
