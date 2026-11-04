/* Global, node-aware demo guide. Content is maintained in /public/content/demo-guide.md. */
const DemoGuide=(()=>{
 const contentUrl='/content/demo-guide.md',positionKey='synmat-demo-guide-position-v1',minimizedKey='synmat-demo-guide-minimized-v1';
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const inline=value=>escape(value).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 function parse(source){
  const entries=[];let entry=null,section=null;
  for(const raw of String(source||'').replace(/\r/g,'').split('\n')){
   const heading=raw.match(/^##\s+\[([^\]]+)]\s*(.*)$/);if(heading){entry={id:heading[1].trim(),title:heading[2].trim(),scope:'default',key:'*',project:'*',match:[],sections:[]};entries.push(entry);section=null;continue}
   if(!entry)continue;
   if(raw.trim()==='---')continue;
   const sub=raw.match(/^###\s+(.+)$/);if(sub){section={title:sub[1].trim(),lines:[]};entry.sections.push(section);continue}
   const meta=!section&&raw.match(/^(label|scope|key|project|match|image|alt):\s*(.*)$/);if(meta){entry[meta[1]]=meta[1]==='match'?meta[2].split(',').map(value=>value.trim()).filter(Boolean):meta[2].trim();continue}
   if(section)section.lines.push(raw);else if(raw.trim())entry.summary=(entry.summary?entry.summary+'\n':'')+raw.trim();
  }
  return entries;
 }
 function route(){return (location.hash.replace(/^#/,'').split('?')[0]||'projects').replace(/^\//,'')}
 const pageKeys={projects:'projects',overview:'overview',experiments:'experiments',assets:'assets'},pageNames={projects:'项目列表',overview:'项目概览',experiments:'实验列表',assets:'项目资产'};
 let liveContext={};
 function context(override={}){
  const store=typeof ProjectStore!=='undefined'?ProjectStore:null,project=store?.active?.()||{},currentRoute=route(),fixed=pageKeys[currentRoute],detail={...liveContext,...override};
  if(fixed)return {scope:'page',key:fixed,label:'固定页面 · '+pageNames[fixed],route:currentRoute,projectId:project.id||'',projectName:project.name||'当前项目'};
  if(currentRoute==='workspace/task'){
   const desk=document.querySelector('.research-desk'),packageId=detail.packageId||desk?.dataset.demoPackageId||project.currentNodeId||'',todoId=detail.todoId||desk?.dataset.demoTodoId||'GENERAL',key=[packageId,todoId].filter(Boolean).join('-')||'*';
   return {scope:'workbench',key,label:'任务工作台',route:currentRoute,projectId:project.id||'',projectName:project.name||'当前项目'};
  }
  if(currentRoute==='workspace/flow'){
   const flow=document.querySelector('.pv3-main'),level=detail.flowLevel||flow?.dataset.hierarchyLevel||'stages',stageId=detail.stageId||flow?.dataset.guideStage||'',packageId=detail.packageId||flow?.dataset.guidePackage||'';
   if(level==='packages')return {scope:'flow-stage',key:stageId||'*',label:'项目流程 · 阶段视图',route:currentRoute,projectId:project.id||'',projectName:project.name||'当前项目'};
   if(level==='internal')return {scope:'flow-package',key:packageId||'*',label:'项目流程 · 任务视图',route:currentRoute,projectId:project.id||'',projectName:project.name||'当前项目'};
   return {scope:'flow-global',key:'global',label:'项目流程 · 全局视图',route:currentRoute,projectId:project.id||'',projectName:project.name||'当前项目'};
  }
  return {scope:'page',key:currentRoute||'default',label:'页面 · '+(currentRoute||'default'),route:currentRoute,projectId:project.id||'',projectName:project.name||'当前项目'};
 }
 function keyScore(pattern,value){if(pattern==='*')return 20;if(pattern===value)return 100;if(pattern.endsWith('*')&&value.startsWith(pattern.slice(0,-1)))return 70;return -1}
 function score(entry,current){
  const project=entry.project||'*';if(project!=='*'&&project!==current.projectId&&project!==current.projectName)return -1;
  if(entry.scope==='default')return -100+(project==='*'?0:200)+Math.max(0,keyScore(entry.key||'*',current.key));
  if(entry.scope!==current.scope)return -1;
  const entryKey=entry.key||'*',matched=current.scope==='workbench'?(entryKey==='*'?20:entryKey===current.key?100:-1):keyScore(entryKey,current.key);return matched<0?-1:matched+(project==='*'?0:200);
 }
 function resolve(entries,current){return entries.map((entry,index)=>({entry,index,score:score(entry,current)})).filter(item=>item.score>=0).sort((a,b)=>b.score-a.score||a.index-b.index)[0]?.entry||entries[0]}
 function sectionHtml(section){const lines=section.lines.map(line=>line.trim()).filter(Boolean),items=lines.filter(line=>line.startsWith('- '));if(items.length===lines.length&&items.length)return `<section class="demo-guide__section"><h3>${escape(section.title)}</h3><ul>${items.map(line=>`<li>${inline(line.slice(2))}</li>`).join('')}</ul></section>`;return `<section class="demo-guide__section"><h3>${escape(section.title)}</h3><p>${lines.map(inline).join('<br>')}</p></section>`}
 function create(){
  const root=document.createElement('aside');root.className='demo-guide';root.setAttribute('aria-label','演示说明');root.innerHTML=`<header class="demo-guide__bar" data-guide-drag><span class="demo-guide__mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10M9 22h6M8 14a7 7 0 1 1 8 0c-1.3.8-1.7 1.7-1.8 2H9.8c-.1-.3-.5-1.2-1.8-2Z"/></svg></span><span class="demo-guide__heading"><strong>演示说明</strong><span class="demo-guide__note">正式环境会有新手引导。</span></span><span class="demo-guide__actions"><button class="demo-guide__button" type="button" data-guide-tour aria-label="重新查看页面引导" title="页面引导"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h3"/></svg></button><button class="demo-guide__button" type="button" data-guide-minimize aria-label="最小化演示说明" title="最小化"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button><button class="demo-guide__button" type="button" data-guide-restore aria-label="展开演示说明" title="展开"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></button></span></header><div class="demo-guide__body"><img class="demo-guide__image" data-guide-image alt=""><div class="demo-guide__content"><h2 class="demo-guide__context-title" data-guide-title>正在读取说明…</h2><div data-guide-content></div></div></div><footer class="demo-guide__footer"><span class="demo-guide__node" data-guide-node></span></footer>`;document.body.append(root);return root
 }
 function loadPosition(root){try{const value=JSON.parse(localStorage.getItem(positionKey)||'null');if(Number.isFinite(value?.left)&&Number.isFinite(value?.top)){root.style.left=value.left+'px';root.style.top=value.top+'px'}}catch{}root.classList.toggle('is-minimized',localStorage.getItem(minimizedKey)==='true');clamp(root)}
 function clamp(root){const rect=root.getBoundingClientRect(),margin=12,left=Math.min(Math.max(margin,rect.left),Math.max(margin,innerWidth-rect.width-margin)),top=Math.min(Math.max(margin,rect.top),Math.max(margin,innerHeight-rect.height-margin));root.style.left=left+'px';root.style.top=top+'px'}
 function makeDraggable(root){const handle=root.querySelector('[data-guide-drag]');let drag=null;handle.addEventListener('pointerdown',event=>{if(event.target.closest('button,a'))return;const rect=root.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};handle.setPointerCapture(event.pointerId);root.classList.add('is-dragging')});handle.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;root.style.left=drag.left+event.clientX-drag.x+'px';root.style.top=drag.top+event.clientY-drag.y+'px';clamp(root)});const finish=event=>{if(!drag||event.pointerId!==drag.id)return;drag=null;root.classList.remove('is-dragging');const rect=root.getBoundingClientRect();localStorage.setItem(positionKey,JSON.stringify({left:Math.round(rect.left),top:Math.round(rect.top)}))};handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish)}
 function observeHistory(){for(const name of ['pushState','replaceState']){const original=history[name];if(original.__demoGuideObserved)continue;const wrapped=function(...args){const before=location.href,result=original.apply(this,args);if(location.href!==before)queueMicrotask(()=>dispatchEvent(new Event('synmat:route-changed')));return result};wrapped.__demoGuideObserved=true;history[name]=wrapped}}
 function render(root,entries,override={}){const current=context(override),entry=resolve(entries,current);if(!entry)return;root.querySelector('[data-guide-title]').textContent=entry.title||'当前页面说明';root.querySelector('[data-guide-node]').textContent=current.projectName+' · '+current.key;root.querySelector('[data-guide-content]').innerHTML=(entry.summary?`<p>${inline(entry.summary)}</p>`:'')+entry.sections.map(sectionHtml).join('');const image=root.querySelector('[data-guide-image]');if(entry.image&&entry.image.startsWith('/')){image.hidden=false;image.src=entry.image;image.alt=entry.alt||entry.title||''}else{image.hidden=true;image.removeAttribute('src')}const tourButton=root.querySelector('[data-guide-tour]'),activeProject=typeof ProjectStore!=='undefined'?ProjectStore.active?.():null;if(tourButton)tourButton.hidden=activeProject?.protected!==true;root.dataset.guideEntry=entry.id;root.dataset.guideScope=current.scope;root.dataset.guideKey=current.key;requestAnimationFrame(()=>clamp(root))}
 async function init(){
  observeHistory();const root=create();makeDraggable(root);loadPosition(root);let entries=[];
  try{const response=await fetch(contentUrl,{cache:'no-store'});if(!response.ok)throw Error('content unavailable');entries=parse(await response.text())}catch{entries=[{id:'fallback',title:'演示说明',match:['default'],summary:'这里会根据当前流程节点，介绍真实产品中的使用方式。',sections:[]}]}
  const refresh=detail=>{if(detail?.surface)liveContext={...liveContext,...detail};render(root,entries,detail||{})};refresh();
  root.querySelector('[data-guide-minimize]').onclick=()=>{root.classList.add('is-minimized');localStorage.setItem(minimizedKey,'true');clamp(root)};
  root.querySelector('[data-guide-restore]').onclick=()=>{root.classList.remove('is-minimized');localStorage.setItem(minimizedKey,'false');refresh()};
  root.querySelector('[data-guide-tour]').onclick=()=>document.dispatchEvent(new CustomEvent('synmat:start-page-tour'));
  document.getElementById('help')?.addEventListener('click',()=>{root.hidden=false;root.classList.remove('is-minimized');localStorage.setItem(minimizedKey,'false');refresh()});
  document.addEventListener('synmat:demo-guide-context',event=>refresh(event.detail||{}));
  for(const name of ['synmat:project-registry-updated','synmat:workspace-breadcrumb','synmat:project-workspace-mode','synmat:flow-progress'])document.addEventListener(name,()=>queueMicrotask(()=>refresh()));
  for(const name of ['synmat:open-flow-task','synmat:request-flow-task-entry'])document.addEventListener(name,event=>queueMicrotask(()=>refresh({surface:'workbench',packageId:event.detail?.node?.id||event.detail?.nodeId||''})));
  for(const name of ['synmat:route-changed','hashchange','popstate'])addEventListener(name,()=>refresh());addEventListener('resize',()=>clamp(root));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 return {parse,resolve,context,observeHistory};
})();
