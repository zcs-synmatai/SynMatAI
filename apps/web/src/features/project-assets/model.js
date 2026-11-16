/* Project assets for the run-02 thermal-gel demonstration. */
const ProjectAssetModel=(()=>{
 const categories=['方案与立项','实验与测试','分析报告','参考资料','其他'];
 const clone=value=>JSON.parse(JSON.stringify(value)),now=()=>new Date().toISOString();
 function seed(){
  const file=(id,name,category,text,extra={})=>({id,name,category,summary:'导热凝胶项目演示资料',important:false,author:'Supervisor Agent',origin:'AI生成',updated:'2026-11-12T09:00:00+08:00',stage:'',routes:['R'],links:[],sources:[],adoptions:[],versions:[{id:'v1.0',text,status:'待确认',author:'Supervisor Agent',at:'2026-11-12 09:00',summary:'原型演示草稿'}],messages:{},...extra});
  const md=(title,body)=>'# '+title+'\n\n> 原型演示资料，不代表真实试验完成或指标通过。\n\n'+body;
  return {schema:2,files:[
   file('brief','导热凝胶项目基础信息.md',categories[0],md('导热凝胶项目基础信息','## 项目需求\n面向电子散热界面开发兼顾导热、低BLT与可制造性的凝胶材料。\n\n## 关键指标\nκ_bulk、κ_app、BLT、2Rc、Shore00与可靠性。'),{important:true,stage:'S0',links:[{task:'T00',stage:'S0',route:'R',purpose:'输入'}]}),
   file('criteria','指标与判据差异表.md',categories[0],md('指标与判据差异表','记录6W/12W等级、BLT≤20μm、2Rc及可靠性门槛的待确认口径。'),{stage:'S0',links:[{task:'T00',stage:'S0',route:'R',purpose:'输出'}]}),
   file('supplier','原料接收与供方资格清单.md',categories[3],md('原料接收与供方资格清单','AlN各级粉、PDMS、V-PDMS、偶联剂、催化剂与抑制剂的COA及变更控制。'),{stage:'S1',links:[{task:'T10',stage:'S1',route:'R',purpose:'输出'}]}),
   file('grading','四峰级配与粉体前处理记录.md',categories[1],md('四峰级配与粉体前处理记录','记录预干、表面处理、PSD、KF、TGA/XPS和防潮交付。'),{stage:'S1',links:[{task:'T11',stage:'S1',route:'R',purpose:'输出'}]}),
   file('batch','小试批次与检测任务单.md',categories[0],md('小试批次与检测任务单','冻结批号、配方版本、样件分配与检测计划。'),{stage:'S2',links:[{task:'T20',stage:'S2',route:'R',purpose:'输出'}]}),
   file('mixing','混炼过程与出罐记录.md',categories[1],md('混炼过程与出罐记录','记录分段投料、温度、扭矩、真空脱泡、均匀度与出罐流变。'),{stage:'S2',links:[{task:'T21',stage:'S2',route:'R',purpose:'输出'}]}),
   file('blt','BLT与Shore00稳定性报告.md',categories[2],md('BLT与Shore00稳定性报告','候选要求BLT中位≤20μm、RSD≤15%、Shore00<60；数据等待试验回传。'),{stage:'S3',links:[{task:'T31',stage:'S3',route:'R',purpose:'输出'}]}),
   file('thermal','D5470多厚度热学分析报告.md',categories[2],md('D5470多厚度热学分析报告','计划记录30psi下多厚度原始曲线、回归、κ_bulk、κ_app、2Rc与95%置信区间。'),{stage:'S4',links:[{task:'T40',stage:'S4',route:'R',purpose:'输出'}]}),
   file('reliability','可靠性与微观界面验证计划.md',categories[1],md('可靠性与微观界面验证计划','覆盖挥发、O/B、热循环、湿热、SEM/EDS/XPS/TGA和失效面分析。'),{stage:'S4',links:[{task:'T41',stage:'S4',route:'R',purpose:'输出'}]}),
   file('pilot','10—50kg中试放大报告.md',categories[2],md('10—50kg中试放大报告','比较中试与小试的黏度、κ_bulk、2Rc及过程一致性。'),{stage:'S5',links:[{task:'T50',stage:'S5',route:'R',purpose:'输出'}]}),
   file('qualification','最终资格与交付清单.md',categories[0],md('最终资格与交付清单','汇总工艺说明、质检卡、放行标准、供方证据和授权签核。'),{stage:'S5',links:[{task:'T51',stage:'S5',route:'R',purpose:'输出'}]}),
   file('spc','批次SPC与异常闭环模板.md',categories[4],md('批次SPC与异常闭环模板','规划Cpk、单批放行、NCR、CAPA及再资格记录；未接入真实MES/LIMS。'),{stage:'S6',links:[{task:'T60',stage:'S6',route:'R',purpose:'输出'},{task:'T62',stage:'S6',route:'R',purpose:'输出'}]})
  ],changes:[],recycle:[],messages:[]};
 }
 const latest=file=>file.versions.at(-1),version=(file,id)=>file.versions.find(item=>item.id===id),ext=file=>file.name.split('.').at(-1).toLowerCase(),canEdit=role=>role!=='reader';
 function requireEdit(role){if(!canEdit(role))throw Error('只读成员不能修改文件')}
 function draft(file,text,summary,role='owner'){requireEdit(role);const item={id:'v1.'+file.versions.length,text,status:file.requiresConfirm?'草稿':'不需确认',author:'林晓',at:now(),summary};file.versions.push(item);file.updated=now();return item}
 function submit(file,id,role){requireEdit(role);const item=version(file,id);if(!file.requiresConfirm||item.status!=='草稿')throw Error('仅可提交具体草稿版本');item.status='待确认';item.submittedAt=now()}
 function confirm(file,id,role){if(role!=='owner')throw Error('仅项目负责人可确认版本');const item=version(file,id);if(item?.status!=='待确认')throw Error('此版本不在待确认状态');file.versions.filter(entry=>entry.status==='已确认').forEach(entry=>entry.status='已替代');item.status='已确认';item.confirmation={by:'林晓',at:now(),note:'仅确认演示文件，不代表试验通过'}}
 function adoptionDraft(state,file,id,task,role){requireEdit(role);const item=version(file,id);if(!item||item.status!=='已确认')throw Error('请选择已确认版本');const change={id:'change-'+Date.now(),asset:file.id,version:id,task,before:'未采用',status:'待确认',at:now()};state.changes.push(change);return change}
 function applyChange(state,id,role){if(role!=='owner')throw Error('仅项目负责人可确认采用变更');const change=state.changes.find(item=>item.id===id);if(!change)throw Error('变更不存在');change.status='已采用'}
 function remove(state,id,role){requireEdit(role);const file=state.files.find(item=>item.id===id);if(file.adoptions.length)throw Error('存在固定引用，请保留历史');state.files=state.files.filter(item=>item.id!==id);state.recycle.push(file)}
 function filter(state,query={}){return state.files.filter(file=>(!query.category||file.category===query.category)&&(!query.stage||file.stage===query.stage||file.links.some(link=>link.stage===query.stage))&&(!query.route||file.routes.includes(query.route))&&(!query.status||latest(file).status===query.status)&&(!query.origin||file.origin===query.origin)&&(!query.text||[file.name,file.summary,...file.versions.map(item=>item.text)].join(' ').toLowerCase().includes(query.text.toLowerCase()))).sort((a,b)=>query.sort==='name'?a.name.localeCompare(b.name,'zh'):b.updated.localeCompare(a.updated))}
 function diff(a,b){const left=a.split('\n'),right=b.split('\n'),leftSet=new Set(left),rightSet=new Set(right);return {removed:left.filter(line=>!rightSet.has(line)),added:right.filter(line=>!leftSet.has(line)),unchanged:left.filter(line=>rightSet.has(line)).length}}
 return {seed,clone,categories,latest,version,ext,canEdit,draft,submit,confirm,adoptionDraft,applyChange,remove,filter,diff};
})();
