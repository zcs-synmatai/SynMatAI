import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {projectRoot} from './dev-server.mjs';

const web=resolve(projectRoot,'apps/web');
const source=path=>readFile(resolve(web,path),'utf8');

function workspaceRuntime({viewport=1280,conversationCollapsed=false}={}){
 const stored=new Map(),listeners=new Map(),classes=new Set(),style=new Map(),dispatched=[];
 if(conversationCollapsed)stored.set('synmat-workspace-conversations-collapsed','1');
 const breadcrumb={textContent:'研发 / 路线筛选 / 计算模拟'};
 const renderedBreadcrumb={textContent:''},resizer={attributes:{},setAttribute(name,value){this.attributes[name]=value}};
 const classList={add:name=>classes.add(name),remove:name=>classes.delete(name),toggle(name,force){const next=force??!classes.has(name);if(next)classes.add(name);else classes.delete(name);return next},contains:name=>classes.has(name)};
 const document={
  documentElement:{style:{setProperty:(name,value)=>style.set(name,value)}},body:{classList,matches:()=>true},
  querySelector(selector){if(selector==='.breadcrumbs strong')return breadcrumb;if(selector==='.app')return {getBoundingClientRect:()=>({width:viewport-70})};return null},
  querySelectorAll(selector){if(selector==='.workspace-chat-breadcrumb span')return [renderedBreadcrumb];if(selector==='[data-workspace-resizer]')return [resizer];return []},
  addEventListener(type,handler){listeners.set(type,handler)},dispatchEvent(event){dispatched.push(event);listeners.get(event.type)?.(event)}
 };
 const location={hash:'#workspace/task',pathname:'/',search:''};
 const history={replaceState(_state,_title,url){location.hash=url.includes('#')?url.slice(url.indexOf('#')):''}};
 class MutationObserver{constructor(callback){this.callback=callback}observe(){}}
 class CustomEvent{constructor(type,options={}){this.type=type;this.detail=options.detail}}
 class Event{constructor(type){this.type=type}}
 const mediaListeners=[];
 const context={document,location,history,localStorage:{getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value))},MutationObserver,CustomEvent,Event,console,matchMedia:query=>({media:query,matches:viewport<=740,addEventListener(type,handler){if(type==='change')mediaListeners.push(handler)}})};
 context.window=context;context.window.addEventListener=()=>{};context.window.removeEventListener=()=>{};context.window.dispatchEvent=()=>{};
 vm.createContext(context);
 return {context,stored,classes,style,breadcrumb,renderedBreadcrumb,resizer,mediaListeners,dispatched};
}

test('workspace scripts load before their consumers and expose only two primary views',async()=>{
 const html=await source('index.html');
 assert.match(html,/<symbol id="workspace"/);
 assert.match(html,/data-nav="任务"><svg><use href="#workspace"/);
 assert.match(html,/data-nav="实验"><svg><use href="#flask"/);
 const components='/src/features/workflow/project-workspace-components.js',controller='/src/features/workflow/project-workspace-controller.js',consumer='/src/features/workflow/research.js';
 assert(html.indexOf(components)>0&&html.indexOf(controller)>html.indexOf(components)&&html.indexOf(consumer)>html.indexOf(controller));
 const runtime=workspaceRuntime();
 vm.runInContext(await source('src/features/workflow/project-workspace-components.js'),runtime.context);
 const markup=runtime.context.ProjectWorkspaceComponents.modeSwitch({mode:'task'});
 assert.equal((markup.match(/<button/g)||[]).length,2);
 assert.match(markup,/>工作台</);assert.match(markup,/>项目流程</);assert.doesNotMatch(markup,/工作布局|任务画布/);
 assert.match(markup,/workspace-view-switch/);assert.match(markup,/workspace-view-button/);assert.match(markup,/href="#workspace"/);
 const toggle=runtime.context.ProjectWorkspaceComponents.conversationToggle();
 assert.match(toggle,/data-workspace-conversation-toggle/);assert.match(toggle,/aria-expanded="true"/);assert.match(toggle,/workspace-conversation-state/);
 const research=await source('src/features/workflow/research.js');
 const researchCss=await source('src/styles/research.css');
 assert.doesNotMatch(research,/workspaceView='canvas'/);assert.doesNotMatch(research,/data-workbench-view/);
 assert.match(research,/本对话产生的资产/);assert.doesNotMatch(research,/function overview\(\)\{[^\n]*UnifiedTasks\.render/);
 assert.match(research,/function ensureConversationDemoAsset\(\)/);
 assert.match(research,/function pendingConversationUpload\(\)/);
 assert.match(research,/function conversationUploads\(\)/);
 assert.match(research,/function conversationAssetSource\(name\)/);
 assert.match(research,/data-upload-conversation-asset/);
 assert.match(research,/function importResearchFiles\(fileList,attach=false\)/);
 assert.match(researchCss,/\.research-asset-pending/);
 assert.match(researchCss,/\.research-pending-upload/);
 assert.match(research,/row\.ondblclick/);assert.match(research,/row\.onkeydown/);
 assert.match(research,/dock!==['"]assets['"].*closest\(['"]\.research-dock,\[data-dock\]/);
 assert.match(research,/class="research-tab-label"/);assert.match(research,/class="research-tab-close"/);
 assert.match(research,/class="research-agent-name"/);assert.match(research,/class="research-task-name"/);
});

test('workspace controller switches routes, synchronizes breadcrumbs and persists wide chat widths',async()=>{
 const runtime=workspaceRuntime();
 vm.runInContext(await source('src/features/workflow/project-workspace-components.js'),runtime.context);
 vm.runInContext(await source('src/features/workflow/project-workspace-controller.js'),runtime.context);
 const controller=runtime.context.ProjectWorkspaceController;
 controller.activate('flow');
 assert.equal(runtime.context.location.hash,'#workspace/flow');assert(runtime.classes.has('workspace-flow-state'));
 controller.setBreadcrumb('项目流程 / 研发');
 assert.equal(runtime.breadcrumb.textContent,'项目流程 / 研发');assert.equal(runtime.renderedBreadcrumb.textContent,'项目流程 / 研发');
 assert.equal(controller.setChatWidth(1400),1400);assert.equal(runtime.style.get('--workspace-chat-width'),'1400px');assert.equal(runtime.stored.get('synmat-workspace-chat-width'),'1400');assert.equal(runtime.resizer.attributes['aria-valuenow'],'1400');
 const widthEvent=runtime.dispatched.find(event=>event.type==='synmat:workspace-width-change');assert.equal(widthEvent.detail.width,1400);assert.equal(widthEvent.detail.reason,'programmatic');
 assert.equal(controller.setChatWidth(9999),1600);assert.equal(controller.resetChatWidth(),360);
 const conversationFirst=controller.emphasizeTaskContent(false),documentFirst=controller.emphasizeTaskContent(true);
 assert(conversationFirst>documentFirst);assert(runtime.classes.has('workspace-document-open'));
 assert.equal(controller.balanceFlowColumns(),493);assert(!runtime.classes.has('workspace-document-open'));
 const balanceEvent=runtime.dispatched.findLast(event=>event.type==='synmat:workspace-width-change');assert.equal(balanceEvent.detail.reason,'flow-balance');
});

test('conversation layout has one controller-owned state at 714px, 740px and 1000px',async()=>{
 for(const viewport of [714,740,1000]){
  const runtime=workspaceRuntime({viewport});
  vm.runInContext(await source('src/features/workflow/project-workspace-components.js'),runtime.context);
  vm.runInContext(await source('src/features/workflow/project-workspace-controller.js'),runtime.context);
  const controller=runtime.context.ProjectWorkspaceController,compact=viewport<=740;
  assert.equal(controller.conversationState().viewportForced,compact,viewport+'px forced state');
  assert.equal(controller.conversationState().effectiveCollapsed,compact,viewport+'px effective state');
  assert.equal(runtime.classes.has('workspace-conversations-collapsed'),compact,viewport+'px body state');
  if(compact){controller.setConversationsCollapsed(false);assert.equal(controller.conversationState().overlayOpen,true,viewport+'px overlay opens');assert(runtime.classes.has('workspace-conversations-overlay-open'));controller.setConversationsCollapsed(true);assert.equal(controller.conversationState().overlayOpen,false,viewport+'px overlay closes')}
  else{controller.setConversationsCollapsed(true);assert(runtime.classes.has('workspace-conversations-collapsed'));assert.equal(runtime.stored.get('synmat-workspace-conversations-collapsed'),'1');controller.setConversationsCollapsed(false);assert(!runtime.classes.has('workspace-conversations-collapsed'))}
  const expectedBalance=Math.max(240,Math.min(1600,((viewport-70)-(compact?0:216)-8)/2));
  assert.equal(controller.balanceFlowColumns(),expectedBalance,viewport+'px flow columns balance');
 }
});

test('workspace shell CSS keeps task breadcrumbs in the AI rail and uses shared columns',async()=>{
 const css=await source('src/styles/workspace-shell.css');
 assert.match(css,/body\.workspace-conversations-collapsed\{--workspace-conversation-width:0px\}/);
 assert.match(css,/grid-template-columns:var\(--workspace-conversation-width\) var\(--workspace-chat-width\)/);
 assert.match(css,/body\.task-workspace-active \.topbar\{display:none\}/);
 assert.match(css,/body\.task-workspace-active \.workspace-chat-breadcrumb/);
 assert.match(css,/\.research-tab-label\{min-width:0;overflow:hidden;text-overflow:ellipsis/);
 assert.match(css,/\.research-tab\.is-active/);
 assert.match(css,/\.research-task-name\{min-width:0;overflow:hidden;text-overflow:ellipsis/);
 assert.match(css,/#research-reset\{flex:0 0 30px/);
 assert.match(css,/\.workspace-column-resizer/);
 assert.match(css,/\.workspace-column-resizer:before\{[^}]*width:1px/);
 assert.match(css,/\.workspace-conversation-toggle\.is-expanded/);
 assert.doesNotMatch(css,/\.workspace-conversation-flyout/);
 assert.match(css,/\.workspace-conversation-peek\.is-open/);
 assert.match(css,/workspace-conversations-overlay-open\.task-workspace-active \.workspace-conversation-rail/);
 assert.doesNotMatch(css,/@media\(max-width:740px\)[\s\S]*?task-workspace-active \.workspace-conversation-rail\{display:none\}/);
 assert.match(css,/body\.workspace-nav-collapsed \.sidebar\{width:70px/);
 assert.match(css,/\[data-sidebar-tooltip\]::after/);
 assert.match(css,/:focus-visible::after/);
 const shell=await source('src/features/workflow/workspace-shell.js');
 const html=await source('index.html');
 assert.match(html,/<body class="workspace-nav-collapsed">/);
 assert.match(shell,/document\.body\.classList\.add\('workspace-nav-collapsed'\)/);
 assert.match(shell,/dataset\.sidebarTooltip/);
 assert.doesNotMatch(shell,/workspace-nav-collapse-arrow|class="workspace-nav-collapse"/);
 assert.doesNotMatch(css,/\.workspace-nav-collapse\{/);
});

test('entering the task workspace restores selection or resolves the first active package',async()=>{
 const shell=await source('src/features/workflow/workspace-shell.js');
 const page=await source('src/features/projects/page.js');
 const flow=await source('src/features/research-flow/page.js');
 assert.match(page,/entry==='project-workbench'.*location\.hash==='#workspace\/task'.*preferInProgress:false/);
 assert.match(page,/ProjectWorkspaceShell\?\.openPrimaryTaskWorkspace\(project,\{preferInProgress\}\)/);
 assert.match(shell,/function|const normalizeLegacyTaskRoute/);
 assert.match(shell,/location\.hash!==['"]#task['"]/);
 assert.match(shell,/project\?\.lastRoute===['"]#workspace\/flow['"]/);
 assert.match(shell,/typeof ProjectStore!==['"]undefined['"]\?ProjectStore:null/);
 assert.match(shell,/synmat:open-project-flow-context/);
 assert.match(shell,/synmat:request-primary-task-workspace/);
 assert.match(shell,/preferInProgress=true/);
 assert.match(shell,/restorePrimaryTaskWorkspace=.*preferInProgress:false/);
 assert.doesNotMatch(shell,/if\(!resolved\)document\.dispatchEvent\(new CustomEvent\('synmat:task-workspace-visible'/);
 assert.match(shell,/openPrimaryTaskWorkspace/);
 assert.match(shell,/addEventListener\('popstate',normalizeLegacyTaskRoute\)/);
 assert.match(shell,/addEventListener\('hashchange',normalizeLegacyTaskRoute\)/);
 assert.match(shell,/!location\.hash\)history\.replaceState\(null,''.*#projects/);
 assert.doesNotMatch(shell,/!location\.hash\)queueMicrotask\(restorePrimaryTaskWorkspace\)/);
 assert.match(flow,/ProjectStore\.setLastRoute\('#workspace\/flow'\)/);
 assert.match(flow,/ProjectWorkspaceEntryModel\.resolve/);
 assert.match(flow,/addEventListener\('synmat:request-primary-task-workspace'/);
 assert.match(page,/event\?\.isTrusted/);
 assert.match(page,/location\.hash===['"]#workspace\/task['"].*preferInProgress:false/);
 const runtime={};vm.createContext(runtime);vm.runInContext(await source('src/features/workflow/project-workspace-entry-model.js'),runtime);
 const views={项目立项:{tasks:[{id:'P1',name:'立项材料准备'},{id:'P2',name:'组织立项审批'}]},研发:{tasks:[{id:'SIM',name:'计算模拟'}]},量产:{tasks:[]}};
 const statuses={'项目立项/P1':'进行中','项目立项/P2':'待开始','研发/SIM':'进行中'};
 const options={phase:'研发',nodeId:'',getStatus:(phase,node)=>statuses[phase+'/'+node.id]};
 const first=vm.runInContext('ProjectWorkspaceEntryModel',runtime).resolve(views,options);
 assert.equal(first.phase,'项目立项');assert.equal(first.node.id,'P1');
 const selected=vm.runInContext('ProjectWorkspaceEntryModel',runtime).resolve(views,{...options,nodeId:'SIM'});
 assert.equal(selected.phase,'研发');assert.equal(selected.node.id,'SIM');
 const menuEntry=vm.runInContext('ProjectWorkspaceEntryModel',runtime).resolve(views,{...options,nodeId:'SIM',preferInProgress:true});
 assert.equal(menuEntry.phase,'项目立项');assert.equal(menuEntry.node.id,'P1');
 statuses['项目立项/P1']='已完成';delete statuses['研发/SIM'];
 const fallback=vm.runInContext('ProjectWorkspaceEntryModel',runtime).resolve(views,options);
 assert.equal(fallback.node.id,'P2');
});

test('project flow V3 reuses the conversation shell and one topbar across every depth',async()=>{
 const page=await source('src/features/research-flow/page.js');
 const hierarchy=await source('src/features/research-flow/hierarchy-view.js');
 const canvas=await source('src/features/research-flow/canvas-view.js');
 const css=await source('src/styles/workspace-shell.css');
 const flowCss=await source('src/styles/project-flow-v3.css');
 assert.match(page,/ProjectWorkspaceComponents\.conversationRail/);
 assert.match(page,/enteringFlowFromTask=canvasMode&&window\.ProjectWorkspace\?\.mode==='task'/);
 assert.match(page,/if\(enteringFlowFromTask\)ProjectWorkspaceController\.balanceFlowColumns\(\)/);
 assert.match(page,/flowConversationId/);
 assert.match(page,/mountFlowWorkspaceChat/);
 assert.match(page,/normalizeV3Navigation/);
 assert.match(hierarchy,/const activeId=ids\.length===1\?ids\[0\]:stageCurrentId/);
 assert.match(hierarchy,/if\(current\)button\.setAttribute\('aria-current','step'\);else button\.removeAttribute\('aria-current'\)/);
 assert.match(page,/v3Navigation\.level==='internal'&&!pack/);
 assert.match(canvas,/synmat:workspace-width-change/);
 assert.match(canvas,/workspaceFitFrame=requestAnimationFrame\(\(\)=>\{workspaceFitFrame=0;if\(!destroyed\)fit\(\)\}\)/);
 assert.match(page,/chatCollapsed=false/);
 assert.match(hierarchy,/pv3-workspace-switch/);
 assert.match(hierarchy,/data-project-workspace-view/);
 assert.match(hierarchy,/pv3-workspace-state-switch/);
 assert.match(css,/grid-template-columns:var\(--workspace-conversation-width\) var\(--workspace-chat-width\) var\(--workspace-divider\) minmax\(0,1fr\)!important/);
 assert.match(css,/workspace-conversations-overlay-open\.flow-canvas-active/);
 assert.match(css,/body\.flow-canvas-active \.topbar\{display:none\}/);
 assert.match(css,/\.workspace-view-button\[aria-pressed="true"\]/);
 assert.match(flowCss,/\.pv3-topbar:hover,\.pv3-topbar:focus-within/);
 assert.match(flowCss,/\.pv3-topbar \.workspace-view-label/);
 assert.doesNotMatch(flowCss,/data-hierarchy-level=internal\] \.pv3-topbar\{/);
 assert.match(hierarchy,/pv3-view-tabs workspace-view-switch/);
 assert.match(hierarchy,/class="workspace-view-button"/);
 assert.doesNotMatch(hierarchy,/pv3-routes|data-flow-route/);
 assert.doesNotMatch(flowCss,/\.pv3-routes/);
 assert.match(canvas,/querySelector\('\.research-panel-head,\.rf-copilot-heading'\)/);
 assert.match(canvas,/if\(agentHeader\)/);
});

test('calculation panels keep natural height and workbench chat keeps focus',async()=>{
 const css=await source('src/styles/workspace-shell.css');
 const workbench=await source('src/features/workflow/workbench.js');
 const research=await source('src/features/workflow/research.js');
 assert.match(css,/grid-auto-rows:max-content;align-content:start/);
 assert.match(css,/scroll-padding-block:12px 24px/);
 assert.match(workbench,/requestAnimationFrame\(\(\)=>\$\('#chat-input'\)\?\.focus\(\)\)/);
 assert.match(research,/event\.target\.matches\('\.research-composer'\)/);
 assert.match(research,/q\('#research-prompt'\)\?\.focus\(\{preventScroll:true\}\)/);
});

test('flow task handoff always re-enters the primary task workspace',async()=>{
 const page=await source('src/features/research-flow/page.js');
 const research=await source('src/features/workflow/research.js');
 assert.match(page,/close\(\{preserveRoute:true\}\);window\.ProjectWorkspace\?\.activate\('task'\)/);
 assert.match(page,/function close\(\{preserveRoute=false\}=\{\}\)/);
 assert.doesNotMatch(page,/ProjectWorkspace\?\.activate\('task'\);close\(\)/);
 assert.match(page,/classList\.remove\('assets-active','experiments-active','overview-active','projects-active','research-flow-active','flow-canvas-active','flow-v3-active'\)/);
 assert.match(page,/classList\.add\('task-workspace-active'\)/);
 assert.match(page,/openAction:action==='file'\?'document':'conversation-assets'/);
 assert.match(page,/enterNodeWorkspace\(id,\{openAction:'conversation-assets'\}\)/);
 assert.match(research,/function openConversationAssets\(id\)\{previewMinimized=false;opened=\[\];active='overview'/);
 assert.match(research,/flowWorkspace\.openAction==='conversation-assets'/);
});

test('P1T2 completes parallel TODOs without reopening the legacy flow drawer',async()=>{
 const lifecycle=await source('src/features/research-flow/demo-lifecycle.js');
 const research=await source('src/features/workflow/research.js');
 const page=await source('src/features/research-flow/page.js');
 const model=vm.runInNewContext(lifecycle+';DemoProjectLifecycle',{structuredClone}),node=model.initiationView().tasks.find(task=>task.id==='P1T2');
 const approval=model.initiationView().tasks.find(task=>task.id==='P1T3');
 assert.equal(node.workItemsMode,'parallel');
 assert.equal(approval.workItemsMode,'sequential');
 assert.deepEqual(Array.from(node.workItems,item=>item.id),['TODO-001','TODO-002']);
 assert.deepEqual(Array.from(approval.workItems,item=>item.id),['TODO-001']);
 assert.match(research,/parallel\|\|index===0\?'doing':'todo'/);
 assert.match(research,/initiationSequenceVersion:6/);
 assert.match(research,/defaultNodeCleanupVersion:1/);
 for(const id of ['TODO-001','TODO-004','TODO-005','TODO-007'])assert.match(research,new RegExp(`'${id}'`));
 assert.match(page,/FlowProgress\.ready\(generated/);
 assert.match(research,/sequence\.find\(item=>item\.id===conversationId\)/);
 assert.match(research,/id="complete-sequence-item">完成当前 TODO/);
 assert.match(research,/确认完成当前 TODO/);
 assert.match(research,/autoContinue:true/);
 assert.match(research,/flowWorkspace\.node\.workItems\?\.length&&todos\.length&&todos\.every\(todo=>todo\.done\)/);
 assert.match(page,/hasWorkItems=!!t\.workItems\?\.length/);
 assert.match(page,/!hasWorkItems&&taskStatus\(t\)!=='待开始'/);
});

test('task conversation heading combines Agent, TODO name and package reference',async()=>{
 const research=await source('src/features/workflow/research.js');
 assert.match(research,/selected=dialogueRow\(\),row=selected\|\|firstActiveDialogue\(\)/);
 assert.match(research,/taskTitle=row\?\(row\.name\|\|row\.text\|\|todoId\):''/);
 assert.match(research,/title=taskTitle\?agent\+' - '\+taskTitle:agent/);
 assert.match(research,/class="research-task-name"/);
 assert.match(research,/function firstActiveDialogue\(\)/);
 assert.match(research,/if\(flowWorkspace\?\.autoFocusFirstTask\)\{const first=firstActiveDialogue\(\);if\(first\)conversationId=first\.id\}/);
 assert.doesNotMatch(research,/class="research-session"/);
 assert.match(research,/packageId\+'-'\+todoId/);
 assert.match(research,/<small title=/);
});

test('entering a package focuses its first active TODO by default',async()=>{
 const [flow,lifecycle]=await Promise.all([source('src/features/research-flow/page.js'),source('src/features/research-flow/demo-lifecycle.js')]);
 assert.match(flow,/autoFocusFirstTask:e\.detail\.autoFocusFirstTask!==false/);
 assert.match(lifecycle,/nodeId:'P1T2',autoFocusFirstTask:true/);
});

test('flow canvas initializes its camera before cards can receive focus',async()=>{
 const canvas=await source('src/features/research-flow/canvas-view.js');
 const hierarchy=await source('src/features/research-flow/hierarchy-view.js');
 const camera=canvas.indexOf('let camera=saved.sceneVersion');
 const cards=canvas.indexOf('cards.forEach(card=>');
 assert(camera>0&&cards>0&&camera<cards,'camera must exist before node focus and double-click handlers are attached');
 assert.match(canvas,/card\.addEventListener\('focusin',[^\n]*if\(mounted&&e\.target===card\)renderNodeTip/);
 assert(canvas.indexOf('mounted=true;syncSelection()')>cards,'canvas must become focus-interactive only after all cards are mounted');
 assert.match(canvas,/const row=card\.querySelector\('\.rf-task-node-top'\);if\(row\)/);
 assert.match(canvas,/querySelector\('\[data-select-node\]'\)\?\.setAttribute/);
 assert.match(hierarchy,/if\(!\(direction\|\|slide\)\|\|reduced\)\{switching=true;main\.setAttribute\('aria-busy','true'\);requestAnimationFrame\(commit\);return\}/);
});

test('special task previews use an 80 percent workspace and flow TODOs remain editable',async()=>{
 const controller=await source('src/features/workflow/project-workspace-controller.js');
 const research=await source('src/features/workflow/research.js');
 const hierarchy=await source('src/features/research-flow/hierarchy-view.js');
 const canvas=await source('src/features/research-flow/canvas-view.js');
 const css=await source('src/styles/workspace-shell.css');
 assert.match(controller,/function emphasizePreview\(previewRatio=\.8/);
 assert.match(controller,/chatWidth=sharedWidth\*\(1-Math\.max\(\.5,Math\.min\(\.85,previewRatio\)\)\)/);
 assert.match(research,/append\(simulationWorkspace\);widenSpecialPreview\(\)/);
 assert.match(research,/emphasizePreview\(\.8,\{persist:false,reason:'special-preview'\}\)/);
 assert.match(css,/\.research-simulation-host \.calculation-workspace-head\{display:none\}/);
 assert.match(hierarchy,/readOnly:!!workPackage\.demo/);
 assert.match(hierarchy,/onOpenEditor:id=>ctx\.editInternalNode/);
 assert.match(hierarchy,/onDeleteSelection:ids=>ctx\.deleteInternalNodes/);
 assert.match(canvas,/data-full-node-delete>删除任务/);
});

test('the only preview tab minimizes to a restorable workspace rail',async()=>{
 const research=await source('src/features/workflow/research.js');
 const css=await source('src/styles/workspace-shell.css');
 assert.match(research,/let previewMinimized=false/);
 assert.match(research,/if\(opened\.length===1\)\{previewMinimized=true;render\(\);return\}/);
 assert.match(research,/data-restore-preview/);
 assert.match(research,/function restorePreview\(\)\{previewMinimized=false/);
 assert.match(research,/aria-label="工作区域已最小化"/);
 assert.match(css,/\.research-desk\.preview-minimized\{grid-template-columns:[^}]*54px/);
 assert.match(css,/\.research-preview-minimized\{[^}]*align-items:center;justify-content:flex-start;[^}]*width:54px/);
 assert.match(css,/\.research-preview-restore/);
});

test('new work packages start with one default TODO and the node editor stays readable',async()=>{
 const page=await source('src/features/research-flow/page.js');
 const hierarchy=await source('src/features/research-flow/hierarchy-model.js');
 const canvas=await source('src/features/research-flow/canvas-view.js');
 const flowCss=await source('src/styles/research-flow.css');
 const taskCss=await source('src/styles/task-canvas.css');
 assert.match(page,/pack\.custom\?\[\{id:'TODO-001',text:'默认任务'/);
 assert.match(hierarchy,/task\.custom\?\[\{id:'TODO-001',text:'默认任务'/);
 assert.match(canvas,/className='fc-node-secondary-actions'/);
 assert.doesNotMatch(canvas,/编辑完整信息/);
 assert.match(canvas,/name="type" aria-label="节点类型"/);
 for(const type of ['结果文件','实验节点','模拟计算','分析节点','调研节点','临时任务'])assert.match(canvas,new RegExp(type));
 assert.match(canvas,/name="deliverables" aria-label="交付要求"/);
 assert.match(canvas,/deliverables:form\.querySelector\('\[name="deliverables"\]'\)/);
 assert.match(page,/deliverables:\(todo\.deliverables\|\|\[\]\)/);
 assert.match(page,/deliverables:next\.deliverables\.map\(description=>\(\{description\}\)\)/);
 assert.match(flowCss,/\.fc-node-tooltip\[role="dialog"\]\{width:390px;max-height:480px/);
 assert.match(taskCss,/\.fc-node-edit-actions button,.fc-node-secondary-actions button\{[^}]*white-space:nowrap/);
 assert.match(taskCss,/@media\(max-width:520px\)\{\.fc-node-tooltip\[role="dialog"\]/);
});

test('task flow offers draggable Agent creation and highlights active Agent work',async()=>{
 const hierarchy=await source('src/features/research-flow/hierarchy-view.js');
 const model=await source('src/features/research-flow/hierarchy-model.js');
 const canvas=await source('src/features/research-flow/canvas-view.js');
 const css=await source('src/styles/task-canvas.css');
 assert.match(hierarchy,/options\.agentPalette=true/);
 assert.match(hierarchy,/options\.onCreateNode=\(type,position\)/);
 assert.match(model,/agentCandidates=activeRows\.length\?activeRows:packageActive/);
 assert.match(model,/agentRows\.forEach\(row=>\{row\.agentWorking=true\}/);
 assert.match(canvas,/setAttribute\('aria-label','Agent 快捷创建'\)/);
 for(const label of ['分析','调研','DOE'])assert.match(canvas,new RegExp(`'${label}'`));
 assert.match(canvas,/安排 Agent 工作/);
 assert.match(canvas,/o\.onCreateNode\?\.\(button\.dataset\.agentCreate,point,\[\]\)/);
 assert.match(css,/\.pv3-agent-working/);
 assert.match(css,/animation:agent-working-spin/);
 assert.match(css,/\.pv3-agent-palette\{left:calc\(var\(--pv3-agent-width,0px\) \+ var\(--pv3-boundary-inset,12px\) \+ var\(--pv3-boundary-width,56px\) \+ var\(--pv3-boundary-gap,12px\)\);top:calc\(var\(--pv3-top-clearance,104px\) \+ 6px\)/);
 assert.match(hierarchy,/agentToolGap=level==='internal'\?48:0/);
});
