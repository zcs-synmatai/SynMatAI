/* Resolves a safe work-package entry when the project has no explicit selection. */
const ProjectWorkspaceEntryModel=(()=>{
 const defaultPhaseOrder=['项目立项','研发','量产'];
 function resolve(views,{phase='',nodeId='',getStatus=()=>'',phaseOrder=defaultPhaseOrder,preferInProgress=false}={}){
  const selected=views[phase]?.tasks?.find(node=>node.id===nodeId);
  const order=[...phaseOrder,...Object.keys(views)].filter((name,index,list)=>views[name]&&list.indexOf(name)===index);
  if(selected&&!preferInProgress)return {phase,node:selected};
  for(const name of order){const node=views[name].tasks.find(item=>getStatus(name,item)==='进行中');if(node)return {phase:name,node}}
  if(selected)return {phase,node:selected};
  for(const name of order){const node=views[name].tasks.find(item=>getStatus(name,item)!=='已完成');if(node)return {phase:name,node}}
  for(const name of order){const node=views[name].tasks[0];if(node)return {phase:name,node}}
  return null;
 }
 return {resolve};
})();
