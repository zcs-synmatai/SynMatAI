/* Lightweight creation and editing rules for canvas work nodes. */
const NodeQuickEditModel=(()=>{
 const people=['林晓','张三','王宁','陈妍'];
 function create(type='调研节点'){
  const presets={'数据分析Agent':['分析','数据分析任务','数据分析 Agent'],'调研Agent':['调研','调研任务','调研 Agent'],'DOE实验设计Agent':['DOE设计','DOE实验设计','DOE实验设计 Agent'],'实验ELN':['实验','实验ELN',null]};
  const p=presets[type]||[type.replace(/节点$/,''),type.replace(/节点$/,''),null],experiment=p[0]==='实验';
  return {text:'新'+p[1],type:p[0],executionMode:p[2]?'ai':'human',owner:p[2]||'林晓',collaborators:p[2]?['林晓']:[],done:false,status:'todo',due:'',priority:'normal',inputs:[],outputs:[],estimate:'',...(experiment?{plannedExperiment:true}:{})};
 }
 function validate(values,{humanOnly=false}={}){const title=String(values.title||'').trim(),executionMode=values.executionMode,owner=String(values.owner||'').trim();if(!title)throw Error('请填写节点标题');if(title.length>200)throw Error('标题请控制在200字以内');if(!['human','ai','collaborative'].includes(executionMode))throw Error('请选择有效执行方式');if(humanOnly&&executionMode!=='human')throw Error('实体实验由人工执行，Agent仅提供辅助');if(!owner)throw Error('请选择负责人');if(executionMode==='ai'&&!/Agent$/.test(owner))throw Error('Agent执行任务需要选择具名Agent');if(executionMode!=='ai'&&/Agent$/.test(owner))throw Error('人工或协作任务需选择人工负责人');return {title,executionMode,owner}}
 return {people,create,validate};
})();
