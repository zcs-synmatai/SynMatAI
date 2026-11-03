const TaskReportModel=(()=>{
 function create(rows){const done=rows.find(r=>r.kind==='todo'&&r.executionMode==='ai')||rows.find(r=>r.kind==='todo'),doing=rows.find(r=>r.id!==done?.id&&r.kind==='todo')||rows.find(r=>r.id!==done?.id);if(!done||!doing)return null;const risk=rows.find(r=>r.kind==='experiment'&&!r.done)||doing;
  return {changedIds:[done.id,doing.id],doneId:done.id,doingId:doing.id,riskId:risk.id,owner:done.owner,doneName:done.name,doingName:doing.name,message:`向您汇报项目最新进展，${done.id} 任务已经完成，目前正在推进 ${doing.id} 任务。`,risk:`${risk.id}「${risk.name}」尚待${risk.kind==='experiment'?'人工补齐实验记录与证据':'补充输入资料或人工确认'}，可能影响后续交付。`,approvals:[
   {id:'evidence-review',title:'任务资料与证据清单确认',summary:'请核对 Agent 整理的输入索引、缺项与引用范围。',files:['输入资料与证据索引（演示）.md'],checks:['核对引用资料及缺项说明','确认后再用于后续任务'],status:'待确认',comment:''},
   {id:'delivery-review',title:'下一步执行与交付安排确认',summary:'请核对人工执行边界、后续安排及预期交付。',files:['任务执行与交付安排（演示）.md'],checks:['实验执行与最终签核由人工负责','资料齐备不代表实验结果通过'],status:'待确认',comment:''}
  ]};
 }
 function project(rows,brief){if(!brief)return rows;return rows.map(r=>r.id===brief.doneId?{...r,done:true,statusName:'已完成 · 演示'}:r.id===brief.doingId?{...r,done:false,statusName:'进行中 · 演示'}:r)}
 return {create,project};
})();
