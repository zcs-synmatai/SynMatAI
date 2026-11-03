/* Local prototype progress; independent from immutable workflow definitions. */
const FlowProgress = (() => {
 const phases=['市场分析','项目立项','研发','量产'];
 const key=(phase,id)=>phase+'/'+id;
 function status(phase,task,records={}){
  const saved=records[key(phase,task.id)]?.status;
  if(['已完成','进行中','待开始'].includes(saved))return saved;
  if(task.custom)return '待开始';
  if(phase==='市场分析'||phase==='项目立项')return '已完成';
  if(phase==='研发')return task.stage==='S1'||task.id==='T21'?'已完成':['T20','T22'].includes(task.id)?'进行中':'待开始';
  return '待开始';
 }
 function aggregate(tasks,getStatus){
  if(!tasks.length)return '待开始';
  const states=tasks.map(getStatus);
  return states.every(s=>s==='已完成')?'已完成':states.some(s=>s!=='待开始')?'进行中':'待开始';
 }
 function ready(view,getStatus){
  return view.tasks.filter(t=>getStatus(t)==='待开始'&&view.stages.slice(0,view.stages.findIndex(s=>s.id===t.stage)).every(s=>view.tasks.filter(n=>n.stage===s.id).every(n=>getStatus(n)==='已完成'))&&(view.edges[t.stage]||[]).filter(e=>e[1]===t.id).every(e=>getStatus(view.tasks.find(n=>n.id===e[0]))==='已完成'));
 }
 function complete(view,phase,id,records={}){
  const task=view.tasks.find(t=>t.id===id);if(!task)throw new Error('任务不存在');if(status(phase,task,records)!=='进行中')throw new Error('仅进行中的阶段任务可以完成');
  const next=structuredClone(records);next[key(phase,id)]={status:'已完成',completedAt:new Date().toISOString()};
  for(const t of ready(view,t=>status(phase,t,next)))next[key(phase,t.id)]={status:'进行中'};
  return next;
 }
 const stem=name=>String(name).toLowerCase().replace(/\.(md|txt|pdf|docx?|xlsx?|csv|json|png|jpe?g)$/i,'').replace(/[\s_—–-]/g,'');
 function match(delivery,assets){return assets.find(a=>(delivery.id&&a.deliveryId===delivery.id)||stem(a.name)===stem(delivery.description)||(stem(delivery.description)==='sop文档'&&['sop','技术调研报告','sop文档'].includes(stem(a.name))));}
 return {phases,key,status,aggregate,ready,complete,match};
})();
