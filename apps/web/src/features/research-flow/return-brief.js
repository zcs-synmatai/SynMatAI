/* Return-to-project scenario only; never changes task completion or gate decisions. */
const FlowReturnBrief=(()=>{
 function create(){return {changedIds:['T21','T22'],message:'向您汇报项目最新进展，T21任务已经完成，目前正在推进T22任务',approvals:[
  {id:'sample-plan',node:'T22',title:'路线比较样板制备方案',summary:'请确认本轮制板安排、样板标识及施工记录要求。',files:['路线比较样板制备方案.md','施工记录检查清单.md'],checks:['核对制板范围与上游批料来源','确认样板编号、制备安排与施工记录要求'],status:'待确认',comment:''},
  {id:'blank-plan',node:'T22',title:'匹配空白与记录要求',summary:'请确认匹配空白设置、关联方式与记录完整性要求。',files:['匹配空白确认单.md','样板与空白关联表.csv'],checks:['核对样板与匹配空白的关联关系','确认缺项、异常及补充记录的处理要求'],status:'待确认',comment:''}
 ]}}
 function decide(brief,id,decision,comment=''){if(!['已通过','已退回'].includes(decision))throw new Error('请选择审批结果');const next=structuredClone(brief),item=next.approvals.find(a=>a.id===id);if(!item)throw new Error('审批不存在');if(item.status!=='待确认')throw new Error('该审批已处理');if(decision==='已退回'&&!comment.trim())throw new Error('请填写退回原因');item.status=decision;item.comment=comment.trim();return next}
 return {create,decide};
})();
