/* Lightweight creation and editing rules for canvas work nodes. */
const NodeQuickEditModel=(()=>{
 const people=['林晓','张三','王宁','陈妍'];
 const types=['结果文件','实验节点','模拟计算','分析节点','调研节点','临时任务'];
 function normalizeType(value=''){
  const type=String(value||'').trim();
  if(types.includes(type))return type;
  if(/结果|文件|文档/.test(type))return '结果文件';
  if(/实验|DOE|ELN/.test(type))return '实验节点';
  if(/模拟|计算/.test(type))return '模拟计算';
  if(/分析|测试/.test(type))return '分析节点';
  if(/调研|检索/.test(type))return '调研节点';
  return '临时任务';
 }
 function create(type='调研节点'){
  const presets={'数据分析Agent':['分析节点','数据分析任务','数据分析 Agent'],'调研Agent':['调研节点','调研任务','调研 Agent'],'DOE实验设计Agent':['实验节点','DOE实验设计',null],'实验ELN':['实验节点','实验ELN',null],'模拟计算':['模拟计算','模拟计算任务','模拟计算 Agent']};
  const normalized=normalizeType(type),p=presets[type]||[normalized,type.replace(/节点$/,''),normalized==='调研节点'?'调研 Agent':normalized==='分析节点'?'数据分析 Agent':null],experiment=p[0]==='实验节点';
  return {text:'新'+p[1],type:p[0],executionMode:p[0]==='模拟计算'?'simulation':p[2]?'ai':'human',owner:p[2]||'林晓',collaborators:p[2]?['林晓']:[],done:false,status:'todo',due:'',priority:'normal',inputs:[],outputs:[],estimate:'',deliverables:[],...(experiment?{plannedExperiment:true}:{})};
 }
 function validate(values,{humanOnly=false}={}){const title=String(values.title||'').trim(),type=normalizeType(values.type),executionMode=values.executionMode,owner=String(values.owner||'').trim(),deliverables=String(values.deliverables||'').split(/[；;\n]/).map(item=>item.trim()).filter(Boolean),experiment=humanOnly||type==='实验节点';if(!title)throw Error('请填写节点标题');if(title.length>200)throw Error('标题请控制在200字以内');if(!['human','ai','collaborative','simulation'].includes(executionMode))throw Error('请选择有效执行方式');if(experiment&&executionMode!=='human')throw Error('实体实验由人工执行，Agent仅提供辅助');if(type==='模拟计算'&&executionMode!=='simulation')throw Error('模拟计算节点请选择模拟执行');if(!owner)throw Error('请选择负责人');if(['ai','simulation'].includes(executionMode)&&!/Agent$/.test(owner))throw Error('AI 或模拟任务需要选择具名 Agent');if(!['ai','simulation'].includes(executionMode)&&/Agent$/.test(owner))throw Error('人工或协作任务需选择人工负责人');return {title,type,executionMode,owner,deliverables}}
 return {people,types,normalizeType,create,validate};
})();
