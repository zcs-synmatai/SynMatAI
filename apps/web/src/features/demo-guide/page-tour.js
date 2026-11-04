/* First-entry product tour for local demo projects. */
const PageTour=(()=>{
 const storagePrefix='synmat-page-tour-v1:',selectors={
  navigation:'.sidebar',
  conversationToggle:'.research-desk:not(.hidden) [data-workspace-conversation-toggle], #research-flow-page:not(.hidden) [data-workspace-conversation-toggle], .workbench:not(.hidden) [data-workspace-conversation-toggle]',
  conversation:'.research-desk:not(.hidden) .research-chat, #research-flow-page:not(.hidden) .rf-copilot, .workbench:not(.hidden) .copilot',
  workspace:'.research-desk:not(.hidden) .research-preview, #research-flow-page:not(.hidden) .pv3-main .fc-viewport, .workbench:not(.hidden) .right-workspace',
  tabs:'.research-desk:not(.hidden) [role="tablist"][aria-label="已打开文档"], .research-desk:not(.hidden) .research-tabs',
  switcher:'.research-desk:not(.hidden) [data-project-workspace-view], #research-flow-page:not(.hidden) [data-project-workspace-view]',
  flowTopbar:'#research-flow-page:not(.hidden) .pv3-overview-slot',
  flowLevels:'#research-flow-page:not(.hidden) .pv3-navigation',
  flowCanvas:'#research-flow-page:not(.hidden) .pv3-main .fc-viewport',
  flowInput:'#research-flow-page:not(.hidden) .pv3-main .pv3-input',
  flowOutput:'#research-flow-page:not(.hidden) .pv3-main .pv3-output',
  flowNode:'#research-flow-page:not(.hidden) .pv3-main[data-hierarchy-level="packages"] .fc-node:not(.pv3-gate-card):not(.pv3-file-card)',
  agentPalette:'#research-flow-page:not(.hidden) .pv3-main[data-hierarchy-level="internal"] .pv3-agent-palette',
  page:'#research-flow-page:not(.hidden), .ov-page:not(.hidden), .pa-page:not(.hidden), #experiments-page:not(.hidden), #projects-page:not(.hidden)',
  guide:'.demo-guide'
 };
 const icon=path=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
 let root=null,steps=[],index=0,target=null,observer=null,frame=0,previousFocus=null,autoTimer=0;const shownProjects=new Set();
 function project(){return typeof ProjectStore!=='undefined'?ProjectStore.active?.():null}
 function storageKey(){return storagePrefix+(project()?.id||'default')}
 function visible(selector){for(const node of document.querySelectorAll(selector)){const rect=node.getBoundingClientRect();if(rect.width>24&&rect.height>24&&getComputedStyle(node).visibility!=='hidden')return node}return null}
 function targetOf(name){const node=visible(selectors[name]);if(name==='switcher'&&node)return node.closest('.project-workspace-view-switch,.pv3-workspace-state-switch,.workspace-view-switch')||node;return node}
 function waitFor(check,attempts=30){return new Promise(resolve=>{const tick=()=>{const value=check();if(value||attempts--<=0)return resolve(value||null);setTimeout(tick,80)};tick()})}
 async function ensureWorkspace(mode,level=''){
  let flow=visible('#research-flow-page:not(.hidden) .pv3-main'),desk=visible('.research-desk:not(.hidden)');
  if(mode==='flow'&&!flow){visible('[data-project-workspace-view="flow"]')?.click();flow=await waitFor(()=>visible('#research-flow-page:not(.hidden) .pv3-main'))}
  if(mode==='task'&&!desk){visible('[data-project-workspace-view="task"]')?.click();desk=await waitFor(()=>visible('.research-desk:not(.hidden)'))}
  if(mode==='flow'&&level&&flow?.dataset.hierarchyLevel!==level){
   if(level==='internal'&&flow?.dataset.hierarchyLevel==='packages'){const packages=[...flow.querySelectorAll('.fc-node:not(.pv3-gate-card):not(.pv3-file-card)')],editable=packages.find(node=>!/计算模拟/.test(node.textContent||''))||packages[0];editable?.click()}
   flow.querySelector(`[data-v3-view="${level}"]`)?.click();flow=await waitFor(()=>{const current=visible('#research-flow-page:not(.hidden) .pv3-main');return current?.dataset.hierarchyLevel===level?current:null})
  }
  return mode==='flow'?flow:desk
 }
 function eligible(){const item=project(),route=location.hash.split('?')[0];return !!item&&route!=='#projects'&&item.protected===true}
 function stepSet(){
  const common=[{id:'navigation',target:()=>targetOf('navigation'),placement:'right',title:'最左侧是主菜单栏',text:'从这里进入项目列表、项目概览、项目工作区、实验工作台和项目资产。图标悬停时会显示菜单名称。'}];
  if(targetOf('conversation')&&targetOf('workspace'))return [...common,
   {id:'conversation-toggle',prepare:()=>ensureWorkspace('task'),target:()=>targetOf('conversationToggle'),placement:'bottom',title:'切换项目内对话列表',text:'点击这个图标可展开或收起对话列表；列表收起时，将鼠标悬停在图标上仍可快速预览和切换对话。'},
   {id:'conversation',prepare:()=>ensureWorkspace('task'),target:()=>targetOf('conversation'),placement:'right',title:'Agent对话栏，不同任务会有不同类型的Agent接受任务，完成工作',text:'左侧保留当前任务的完整对话。输入背景、补充资料或确认结果，任务上下文会随节点一起切换。'},
   {id:'workspace',prepare:()=>ensureWorkspace('task'),target:()=>targetOf('workspace'),placement:'left',title:'工作预览区，展示任务或者预览文件',text:'右侧根据任务类型显示流程画布、文档、ELN 或模拟计算。'},
   {id:'tabs',prepare:()=>ensureWorkspace('task'),target:()=>targetOf('tabs'),placement:'bottom',title:'多个成果通过页签并行打开',text:'文档、ELN 和模拟工作台会作为独立页签保留。点击页签切换内容，关闭最后一个页签会将工作区域收起为图标。'},
   {id:'switcher',prepare:()=>ensureWorkspace('task'),target:()=>targetOf('switcher'),placement:'bottom',title:'在工作台与项目流程间切换',text:'工作台聚焦当前任务，项目流程查看全局依赖。下一步将自动进入项目流程继续介绍。'},
   {id:'flow-topbar',flow:true,prepare:()=>ensureWorkspace('flow','stages'),target:()=>targetOf('flowTopbar'),placement:'bottom',title:'阶段导航，单击节点进入，双击向上返回',text:'这里概览项目阶段和当前所在节点，可直接选择阶段，也可双击当前层级图标返回上一层流程。'},
   {id:'flow-levels',flow:true,prepare:()=>ensureWorkspace('flow','stages'),target:()=>targetOf('flowLevels'),placement:'left',title:'切换全局、阶段与任务视图',text:'全局查看项目阶段，阶段查看工作包，任务查看包内 TODO、文件与依赖。'},
   {id:'flow-canvas',flow:true,prepare:()=>ensureWorkspace('flow','stages'),target:()=>targetOf('flowCanvas'),placement:'left',title:'项目流程画布，自由管理流程，安排Agent或人工完成的任务',text:'画布中的节点、文件与连线共同表达研发流程。可缩放、平移和选择节点，不把文件误当成任务。'},
   {id:'flow-input',flow:true,prepare:()=>ensureWorkspace('flow','packages'),target:()=>targetOf('flowInput'),placement:'right',title:'左侧集中展示上游输入',text:'进入阶段或任务层级后，左侧显示上游节点及其输入文件；可打开文件，支持的文件还可拖入工作包建立引用。'},
   {id:'flow-double-click',flow:true,prepare:()=>ensureWorkspace('flow','packages'),target:()=>targetOf('flowNode'),placement:'bottom',title:'双击节点进入下一层',text:'单击用于选中和查看状态；双击工作包进入任务视图，双击 TODO 则进入对应任务工作台。'},
   {id:'flow-output',flow:true,prepare:()=>ensureWorkspace('flow','packages'),target:()=>targetOf('flowOutput'),placement:'left',title:'右侧汇总下游交付',text:'右侧展示当前阶段或工作包将交付给下游的文件和要求，并可切换到相邻流程。'},
   {id:'agent-palette',flow:true,prepare:()=>ensureWorkspace('flow','internal'),target:()=>targetOf('agentPalette'),placement:'bottom',title:'把Agent拖到画布上，创建Agent任务',text:'在任务视图中，可点击或拖动分析、调研、DOE 等 Agent 到画布，快速创建对应类型的 TODO。'},
   {id:'guide',target:()=>targetOf('guide'),placement:'left',title:'演示说明，正式系统会优化为新手引导',text:'这张卡片解释当前页面在真实工作中的使用方式，可拖动或最小化；这里也可以重新打开本引导。'}];
  const page=targetOf('page');if(page)common.push({id:'page',target:()=>targetOf('page'),placement:'left',title:'当前页面是本项目的一部分',text:'页面内容会跟随当前项目切换，流程、任务、实验和资产使用同一份本地演示数据。'});
  common.push({id:'guide',target:()=>targetOf('guide'),placement:'left',title:'随时查看演示说明',text:'演示说明会根据页面和流程节点更新。您可以拖动、最小化，也可以从这里重新打开页面引导。'});return common;
 }
 function create(){
  const node=document.createElement('section');node.className='page-tour';node.setAttribute('role','dialog');node.setAttribute('aria-modal','false');node.setAttribute('aria-label','页面操作引导');node.innerHTML=`<div class="page-tour__mask" data-mask="top"></div><div class="page-tour__mask" data-mask="left"></div><div class="page-tour__mask" data-mask="right"></div><div class="page-tour__mask" data-mask="bottom"></div><div class="page-tour__spotlight" aria-hidden="true"></div><article class="page-tour__card"><header><span class="page-tour__progress" data-tour-progress></span><button type="button" class="page-tour__close" data-tour-close aria-label="跳过页面引导" title="跳过引导">${icon('M6 6l12 12M18 6 6 18')}</button></header><div class="page-tour__copy"><h2 data-tour-title></h2><p data-tour-text></p></div><footer><button type="button" class="page-tour__skip" data-tour-close>跳过</button><div><button type="button" class="page-tour__back" data-tour-back>${icon('m15 18-6-6 6-6')}上一步</button><button type="button" class="page-tour__next" data-tour-next><span data-tour-next-label>下一步</span>${icon('m9 18 6-6-6-6')}</button></div></footer></article>`;document.body.append(node);
  node.querySelectorAll('[data-tour-close]').forEach(button=>button.onclick=()=>finish(true));node.querySelector('[data-tour-back]').onclick=()=>show(index-1);node.querySelector('[data-tour-next]').onclick=()=>index===steps.length-1?finish(true):show(index+1);return node
 }
 function mask(name,left,top,width,height){const node=root.querySelector(`[data-mask="${name}"]`);Object.assign(node.style,{left:left+'px',top:top+'px',width:Math.max(0,width)+'px',height:Math.max(0,height)+'px'})}
 function positionCard(hole){
  const card=root.querySelector('.page-tour__card'),margin=14,gap=18,rect=card.getBoundingClientRect(),space={right:innerWidth-hole.right,left:hole.left,bottom:innerHeight-hole.bottom,top:hole.top};let placement=steps[index].placement;
  if(placement==='right'&&space.right<rect.width+gap)placement=space.left>=rect.width+gap?'left':'bottom';
  if(placement==='left'&&space.left<rect.width+gap)placement=space.right>=rect.width+gap?'right':'bottom';
  if(placement==='bottom'&&space.bottom<rect.height+gap)placement=space.top>=rect.height+gap?'top':'right';
  let left=placement==='right'?hole.right+gap:placement==='left'?hole.left-rect.width-gap:hole.left+(hole.width-rect.width)/2;
  let top=placement==='bottom'?hole.bottom+gap:placement==='top'?hole.top-rect.height-gap:hole.top+(hole.height-rect.height)/2;
  left=Math.min(Math.max(margin,left),innerWidth-rect.width-margin);top=Math.min(Math.max(margin,top),innerHeight-rect.height-margin);card.dataset.placement=placement;card.style.left=Math.round(left)+'px';card.style.top=Math.round(top)+'px';card.style.setProperty('--tour-anchor-x',Math.round(Math.min(Math.max(20,hole.left+hole.width/2-left),rect.width-20))+'px');card.style.setProperty('--tour-anchor-y',Math.round(Math.min(Math.max(20,hole.top+hole.height/2-top),rect.height-20))+'px')
 }
 function layout(){
  frame=0;if(!root||!target?.isConnected)return;const rect=target.getBoundingClientRect(),pad=8,hole={left:Math.max(6,rect.left-pad),top:Math.max(6,rect.top-pad),right:Math.min(innerWidth-6,rect.right+pad),bottom:Math.min(innerHeight-6,rect.bottom+pad)};hole.width=hole.right-hole.left;hole.height=hole.bottom-hole.top;
  mask('top',0,0,innerWidth,hole.top);mask('left',0,hole.top,hole.left,hole.height);mask('right',hole.right,hole.top,innerWidth-hole.right,hole.height);mask('bottom',0,hole.bottom,innerWidth,innerHeight-hole.bottom);
  const spotlight=root.querySelector('.page-tour__spotlight');Object.assign(spotlight.style,{left:hole.left+'px',top:hole.top+'px',width:hole.width+'px',height:hole.height+'px',borderRadius:Math.max(8,parseFloat(getComputedStyle(target).borderRadius)||8)+'px'});positionCard(hole)
 }
 function scheduleLayout(){if(!frame)frame=requestAnimationFrame(layout)}
 async function show(next){
  if(!root)return;index=Math.min(Math.max(0,next),steps.length-1);const step=steps[index];root.classList.add('is-preparing');await step.prepare?.();if(!root)return;root.classList.remove('is-preparing');target=step.target();if(!target){steps.splice(index,1);if(!steps.length){finish(false);return}show(Math.min(index,steps.length-1));return}
  root.dataset.step=steps[index].id;root.querySelector('[data-tour-progress]').textContent=`${index+1} / ${steps.length}`;root.querySelector('[data-tour-title]').textContent=steps[index].title;root.querySelector('[data-tour-text]').textContent=steps[index].text;root.querySelector('[data-tour-back]').disabled=index===0;root.querySelector('[data-tour-next-label]').textContent=index===steps.length-1?'开始探索':'下一步';root.classList.remove('is-changing');void root.offsetWidth;root.classList.add('is-changing');layout();root.querySelector('[data-tour-next]').focus({preventScroll:true})
 }
 function begin(force=false){
  clearTimeout(autoTimer);const key=storageKey();if(root||!eligible()||(!force&&shownProjects.has(key)))return false;shownProjects.add(key);let attempts=0;
  const ready=()=>{steps=stepSet().filter(step=>step.flow||step.prepare||step.target());if(steps.length<2&&attempts++<20){autoTimer=setTimeout(ready,150);return}if(!steps.length){shownProjects.delete(key);return}previousFocus=document.activeElement;root=create();observer=new MutationObserver(records=>{if(records.some(record=>!record.target.closest?.('.page-tour')))scheduleLayout()});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});addEventListener('resize',scheduleLayout);addEventListener('scroll',scheduleLayout,true);document.addEventListener('keydown',onKey,true);show(0)};ready();return true
 }
 function finish(){if(!root)return;observer?.disconnect();observer=null;removeEventListener('resize',scheduleLayout);removeEventListener('scroll',scheduleLayout,true);document.removeEventListener('keydown',onKey,true);cancelAnimationFrame(frame);frame=0;root.remove();root=null;target=null;steps=[];previousFocus?.focus?.({preventScroll:true})}
 function onKey(event){if(event.key==='Escape'){event.preventDefault();finish(true)}else if(event.key==='ArrowRight'){event.preventDefault();index===steps.length-1?finish(true):show(index+1)}else if(event.key==='ArrowLeft'&&index>0){event.preventDefault();show(index-1)}}
 function schedule(){clearTimeout(autoTimer);autoTimer=setTimeout(()=>begin(false),900)}
 function init(){schedule();document.addEventListener('synmat:start-page-tour',()=>begin(true));for(const name of ['synmat:project-registry-updated','synmat:open-flow-task','synmat:task-workspace-visible','synmat:project-workspace-mode','synmat:route-changed'])document.addEventListener(name,schedule);addEventListener('hashchange',schedule)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 return {begin,finish,eligible,stepSet,storageKey};
})();
