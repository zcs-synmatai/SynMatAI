/* Local project registry and compatibility storage bank for the static prototype. */
const ProjectStore=(()=>{
 const registryKey='synmat-project-registry-v1',bankKey='synmat-project-data-v1';
 const scopedKeys=[
  'synmat-flow-progress-v1','synmat-flow-edits-v1','synmat-flow-canvas-v2','synmat-project-flow-v3-collapsed-rounds','synmat-project-flow-v3-boundary-links',
  'synmat-task-workspaces','synmat-research','synmat-project-schema-v1','synmat-node-approvals','synmat-thermal-v3','synmat-project-overview-v1','synmat-project-assets-v1','synmat-experiments-v1'
 ];
 const legacy={id:'demo-coating',name:'防刮擦涂层优化',owner:'林晓',description:'汽车清漆防刮擦涂层研发演示项目',scenario:'legacy',protected:true,status:'进行中',currentPhase:'研发',currentTask:'路线筛选 · 计算模拟',lastRoute:'#overview',createdAt:'2026-10-22T09:00:00+08:00',updatedAt:'2026-10-29T18:00:00+08:00'};
 const parse=(value,fallback)=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
 const now=()=>new Date().toISOString();
 function bank(){return parse(localStorage.getItem(bankKey),{})}
 function saveBank(value){localStorage.setItem(bankKey,JSON.stringify(value))}
 function snapshot(){const data={};for(const key of scopedKeys){const value=localStorage.getItem(key);if(value!==null)data[key]=value}return data}
 function clearScoped(){for(const key of scopedKeys)localStorage.removeItem(key)}
 function restore(data={}){clearScoped();for(const [key,value] of Object.entries(data))if(scopedKeys.includes(key)&&typeof value==='string')localStorage.setItem(key,value)}
 function seed(){let registry=parse(localStorage.getItem(registryKey),null);if(registry?.projects?.length)return registry;registry={schema:1,activeProjectId:legacy.id,projects:[legacy]};const data=bank();data[legacy.id]=snapshot();saveBank(data);localStorage.setItem(registryKey,JSON.stringify(registry));return registry}
 function registry(){return seed()}
 function saveRegistry(value){localStorage.setItem(registryKey,JSON.stringify(value));return value}
 function list(){return [...registry().projects].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}
 function active(){const value=registry();return value.projects.find(project=>project.id===value.activeProjectId)||value.projects[0]}
 function update(id,patch){const value=registry(),project=value.projects.find(item=>item.id===id);if(!project)return null;Object.assign(project,patch,{updatedAt:patch.updatedAt||now()});saveRegistry(value);document.dispatchEvent(new CustomEvent('synmat:project-registry-updated',{detail:{project}}));return project}
 function updateActive(patch){return update(active().id,patch)}
 function saveActiveData(){const project=active();if(!project)return;const data=bank();data[project.id]=snapshot();saveBank(data)}
 function activate(id,{route='#overview',entry=''}={}){const value=registry(),target=value.projects.find(project=>project.id===id);if(!target)throw Error('项目不存在或已被移除');saveActiveData();const data=bank();restore(data[id]||{});value.activeProjectId=id;target.lastRoute=route||target.lastRoute||'#overview';target.updatedAt=now();saveRegistry(value);if(entry)sessionStorage.setItem('synmat-project-entry',entry);else sessionStorage.removeItem('synmat-project-entry');location.replace(location.pathname+location.search+(target.lastRoute||'#overview'));location.reload()}
 function uniqueName(name){return !registry().projects.some(project=>project.name.trim().toLowerCase()===name.trim().toLowerCase())}
 function create({name,owner='林晓',description=''}){const clean=String(name||'').trim();if(!clean)throw Error('请填写项目名称');if(clean.length>40)throw Error('项目名称请控制在 40 个字以内');if(!uniqueName(clean))throw Error('已有同名项目，请换一个名称');const id='project-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),createdAt=now(),project={id,name:clean,owner:String(owner||'林晓').trim()||'林晓',description:String(description||'').trim(),scenario:'guided-demo',protected:false,status:'进行中',currentPhase:'项目立项',currentTask:'需求确认',currentNodeId:'P1T1',lastRoute:'#workspace/task',createdAt,updatedAt:createdAt};const value=registry();saveActiveData();value.projects.push(project);value.activeProjectId=id;saveRegistry(value);const schema={version:1,status:'collecting',step:'requirements',fields:{projectName:'',requirements:'',outputs:'',constraints:''},researchStatus:'not-started',updatedAt:createdAt};const schemaDocument='# 项目 Schema\n\n## 项目名称\n\n\n## 需求\n\n\n## 预期产出\n\n\n## 约束条件\n\n';const requirementKey='项目立项//需求确认';const data=bank();data[id]={
   'synmat-flow-progress-v1':JSON.stringify({scenario:'guided-demo',tasks:{'项目立项/P1T1':{status:'进行中'},'项目立项/P1T2':{status:'待开始'},'项目立项/P1T3':{status:'待开始'},'项目立项/P1T4':{status:'待开始'}},assets:{},handoffs:{},lifecycle:{round1Generated:false,round2Generated:false,feedbackConfirmed:false}}),
   'synmat-project-schema-v1':JSON.stringify(schema),
   'synmat-research':JSON.stringify({scenario:'guided-demo',todos:[{text:'梳理技术路线与证据缺口',done:false,status:'todo',owner:'技术调研 Agent',type:'调研'},{text:'形成技术调研报告',done:false,status:'todo',owner:'技术调研 Agent',type:'文档'}],docs:{}}),
   'synmat-task-workspaces':JSON.stringify({[requirementKey]:{todos:[{text:'确认项目名称、需求、预期产出与约束条件',done:false,status:'doing',owner:project.owner,type:'文档',executionMode:'collaborative'}],docs:{'项目Schema.md':schemaDocument},messages:[],conversations:{workspace:[]},conversationId:'workspace',conversationDrafts:{}}})
  };saveBank(data);restore(data[id]);sessionStorage.setItem('synmat-project-entry','requirements-intake');location.replace(location.pathname+location.search+'#workspace/task');location.reload();return project}
 function remove(id){const value=registry(),index=value.projects.findIndex(project=>project.id===id);if(index<0)throw Error('项目不存在或已被移除');const project=value.projects[index];if(project.protected)throw Error('内置示例项目不可删除');const wasActive=value.activeProjectId===id;if(wasActive)saveActiveData();value.projects.splice(index,1);const data=bank();delete data[id];let next=value.projects.find(item=>item.id===value.activeProjectId)||[...value.projects].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]||null;value.activeProjectId=next?.id||'';saveBank(data);saveRegistry(value);if(wasActive)restore(next?data[next.id]||{}:{});document.dispatchEvent(new CustomEvent('synmat:project-removed',{detail:{project,activeProject:next,wasActive}}));return {project,activeProject:next,wasActive}}
 function consumeEntry(){const value=sessionStorage.getItem('synmat-project-entry')||'';sessionStorage.removeItem('synmat-project-entry');return value}
 function setLastRoute(route){const project=active();if(!project||!route||route==='#projects')return;update(project.id,{lastRoute:route})}
 function applyIdentity(root=document){const project=active();if(!project)return;root.querySelectorAll('[data-project-name]').forEach(node=>node.textContent=project.name);const breadcrumb=root.querySelector('.topbar .breadcrumbs>span:nth-of-type(2)');if(breadcrumb)breadcrumb.textContent=project.name;const identity=root.querySelector('.project-identity strong');if(identity)identity.textContent=project.name;document.title='SynMatAI · '+project.name}
 seed();
 return {registry,list,active,update,updateActive,activate,create,remove,consumeEntry,setLastRoute,applyIdentity,saveActiveData,scopedKeys};
})();
