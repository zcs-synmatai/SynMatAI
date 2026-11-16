/* Shared chrome for the overview and project-assets tabs. */
window.ProjectOverviewShell=(()=>{
 const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const icon=id=>`<svg aria-hidden="true"><use href="#${id}"/></svg>`;
 const projectStatus=project=>`${project?.currentPhase||'研发'}${project?.status||'进行中'}`;
 function projectHeader(project){
  return `<header class="project-overview-project-header"><div class="project-overview-project-title"><span class="project-overview-project-mark">${icon('phase-material')}</span><h1>${safe(project?.name||'当前项目')}</h1><span class="project-overview-project-status">${icon('rf-status-pending')}${safe(projectStatus(project))}</span></div></header>`;
 }
 function navigation(active='overview'){
  return `<div class="project-overview-toolbar"><nav class="project-overview-tabs" role="tablist" aria-label="项目概览导航"><button type="button" role="tab" data-overview-shell="overview" aria-selected="${active==='overview'}" ${active==='overview'?'aria-current="page"':''}>总览</button><button type="button" role="tab" data-overview-shell="assets" aria-selected="${active==='assets'}" ${active==='assets'?'aria-current="page"':''}>项目资产</button><button type="button" role="tab" data-overview-shell="management" aria-selected="${active==='management'}">项目管理</button></nav><button type="button" class="btn project-overview-flow-jump" data-overview-shell="flow" aria-label="进入项目流程">${icon('flow')}<span>进入项目流程</span>${icon('chevron')}</button></div>`;
 }
 return {projectHeader,navigation};
})();
