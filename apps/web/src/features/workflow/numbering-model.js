/* Stable human-readable identifiers for the four workflow hierarchy levels. */
window.WorkflowNumbering=(()=>{
 const digits=value=>Number(String(value||'').match(/\d+/)?.[0]||1);
 function phaseCode(phase,round=1){
  if(phase==='项目立项')return 'P1';
  if(phase==='量产')return 'L'+Math.max(1,digits(round));
  return 'R'+Math.max(1,digits(round));
 }
 function substageCode({phase='研发',stageId='',stage=null,round=1}={}){
  if(phase==='项目立项')return 'P1';
  const source=stage?.sourceStageId||stageId||stage?.id||'S1';
  const stageNumber=Number(String(source).match(/S(\d+)/i)?.[1]||String(source).match(/(\d+)$/)?.[1]||1);
  const roundNumber=stage?.round||String(stageId).match(/^[RL](\d+)/i)?.[1]||round;
  return phaseCode(phase,roundNumber)+'S'+Math.max(1,stageNumber);
 }
 function packagePrefix(context={}){return context.phase==='项目立项'?'P1':substageCode(context)}
 function nextWorkPackageId(tasks=[],context={}){
  const prefix=packagePrefix(context),siblings=tasks.filter(task=>!context.stageId||task.stage===context.stageId),standard=siblings.map(task=>Number(String(task.id||'').match(new RegExp('^'+prefix+'T(\\d+)$','i'))?.[1]||0));
  return prefix+'T'+(Math.max(siblings.length,...standard,0)+1);
 }
 function todoNumber(value){return Number(String(value||'').match(/(?:^|-)TODO-(\d+)$/i)?.[1]||0)}
 function nextTodoId(todos=[]){return 'TODO-'+String(Math.max(0,...todos.map(todo=>todoNumber(todo.id)))+1).padStart(3,'0')}
 function fullTodoId(packageId,todoId){if(!packageId)return todoId||'';if(!todoId)return packageId;if(String(todoId).startsWith(packageId+'-'))return todoId;return packageId+'-'+todoId}
 return {phaseCode,substageCode,packagePrefix,nextWorkPackageId,nextTodoId,fullTodoId};
})();
