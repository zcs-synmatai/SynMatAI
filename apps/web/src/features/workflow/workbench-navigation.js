/* Workbench navigation reuses the V3 overview dock and project-owned definitions. */
const WorkbenchFlowNavigation=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=id=>'<svg aria-hidden="true"><use href="#'+id+'"/></svg>';
 function mount({header,legacy,onPick,onLayout}){
  const bar=document.createElement('section');bar.className='workbench-flow-nav';bar.setAttribute('aria-label','项目阶段与工作包导航');header.before(bar);legacy.classList.add('workbench-legacy-context');document.body.classList.add('workbench-navigation-v3');
  let dock=null,state=null,data=null,level='packages',browse=null,lastKey='';
  const status=(p,t)=>data.taskStatuses[p+'/'+t.id]||'待开始';
  const stageId=c=>c.phase==='研发'?Object.keys(FlowHierarchyModel.workspaceSub).find(id=>FlowHierarchyModel.workspaceSub[id]===c.sub):c.phase==='量产'?({小试:'L1',中试:'L2',量产:'L3'})[c.sub]:data.views[c.phase].stages[0]?.id;
  function selection(){const model=data.views[state.phase],stage=stageId(state)||model.stages[0].id,items=model.tasks.filter(t=>t.stage===stage&&!t.fileNode),current=items.find(t=>t.id===state.packageId)||items.find(t=>t.name===state.task)||items[Math.max(0,state.taskIndex)]||items[0];return {phase:state.phase,stage,packageId:current?.id}}
  function draw(){if(!data||!state)return;dock?.destroy();const selected=selection(),context=browse||selected,model=data.views[context.phase],stage=model.stages.find(s=>s.id===context.stage)||model.stages[0];
   bar.innerHTML='<div class="wfn-caption">'+icon('phase-route')+'<div><strong>工作流导航</strong><small>'+esc(level==='stages'?'项目阶段与子阶段':context.phase+((stage.short||stage.title)===context.phase?'':' / '+(stage.short||stage.title)))+'</small></div></div><div class="pv3-overview-slot wfn-overview"></div><div class="wfn-actions"><div class="pv3-view-tabs" role="group" aria-label="导航层级"><button type="button" data-wfn-level="stages" aria-pressed="'+(level==='stages')+'" title="项目阶段与子阶段">'+icon('grid')+'<span>阶段</span></button><button type="button" data-wfn-level="packages" aria-pressed="'+(level==='packages')+'" title="工作包流程">'+icon('flow')+'<span>工作包</span></button></div><button type="button" class="wfn-project-link" title="在项目流程中查看当前阶段" aria-label="返回项目流程">'+icon('phase-route')+'</button></div>';
   const overview=level==='packages'?FlowHierarchyModel.packageOverview(data.views,context.phase,context.stage,selected.phase===context.phase?selected.packageId:null,status):(()=>{const graph=FlowHierarchyModel.stages(data.views,state.phase,(p,s)=>s?data.stageStatuses[p+'/'+s]:data.phaseStatuses[p]);return {...graph,current:graph.nodes.find(n=>n.phase===state.phase&&n.stageId===selected.stage)?.id,context:'项目阶段与子阶段'}})();
   dock=FlowOverviewDock.mount(bar,{...overview,host:bar.querySelector('.wfn-overview'),onPick:n=>{if(level==='stages'){browse={phase:n.phase,stage:n.stageId};level='packages';draw();return}onPick(n)},onLayout});
   bar.querySelectorAll('[data-wfn-level]').forEach(b=>b.onclick=()=>{level=b.dataset.wfnLevel;if(level==='packages')browse=null;draw()});
   bar.querySelector('.wfn-project-link').onclick=()=>document.dispatchEvent(new CustomEvent('synmat:open-project-flow-context',{detail:{...context,packageId:selected.packageId}}));
   const title=document.querySelector('#task-switch');title.onclick=e=>{e.preventDefault();level='packages';browse=null;draw();dock.focus(state.phase+'/'+selected.stage+'/'+selected.packageId)};title.setAttribute('aria-label','在工作流导航中定位当前工作包');title.setAttribute('aria-expanded','false');document.querySelector('#task-menu').classList.add('hidden');onLayout?.();
  }
  return {showStages(){level='stages';browse=null;draw();bar.querySelector('[data-wfn-level="stages"]').focus()},showPackages(){level='packages';browse=null;draw()},update(next){let snapshot=null;document.dispatchEvent(new CustomEvent('synmat:request-workbench-navigation',{detail:{respond:value=>snapshot=value}}));if(!snapshot)return;const key=JSON.stringify([next,snapshot]);if(key===lastKey)return;const changed=state&&JSON.stringify(state)!==JSON.stringify(next);state=next;data=snapshot;lastKey=key;if(changed){browse=null;level='packages'}draw()},destroy(){dock?.destroy();bar.remove();legacy.classList.remove('workbench-legacy-context');document.body.classList.remove('workbench-navigation-v3')}};
 }
 return {mount};
})();
