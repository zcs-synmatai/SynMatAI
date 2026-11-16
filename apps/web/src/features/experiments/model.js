/* Thermal-gel experiment demonstration data. No real test or release evidence. */
const ExperimentModel=(()=>{
 const stages={S1:'材料与级配',S2:'小试与混炼',S3:'固化与薄层',S4:'热学与可靠性',S5:'中试与资格',S6:'质量与监督'};
 const routes={R:'四峰级配—粉体前处理—V-PDMS',A:'保守多峰AlN/Al₂O₃',B:'纳米桥接',C:'共价界面/PDMS刷层',blank:'基线对照'};
 const statuses=['待方案确认','执行中','待测试','待分析','完成'];
 const people=[{id:'lin',name:'林晓'},{id:'zhang',name:'张三'},{id:'wang',name:'王宁'},{id:'chen',name:'陈妍'}];
 const clone=value=>JSON.parse(JSON.stringify(value)),now=()=>new Date().toISOString();
 const plans=[
  {id:'plan-S3',stage:'S3',tasks:['T30','T31','T32'],arrangement:'固化窗口、BLT重复性、Shore00与稳定性确认',missing:['固化与后固化窗口待冻结','装夹压力与BLT方法待确认'],source:'run-02 workflow S3',note:'原型记录结构不代表已完成实物验证。'},
  {id:'plan-S4',stage:'S4',tasks:['T40','T41','T42'],arrangement:'D5470多厚度热学与可靠性/微观界面并行验证',missing:['多厚度回归定义待确认','可靠性门槛及频次待冻结'],source:'run-02 workflow S4',note:'单点热学不能替代κ_bulk与2Rc分离。'},
  {id:'plan-S5',stage:'S5',tasks:['T50','T51'],arrangement:'10—50kg中试放大与最终资格交付',missing:['放大工艺卡待批准','客户资格限值待确认'],source:'run-02 workflow S5',note:'中试计划不表示已通过客户准入。'},
  {id:'plan-S6',stage:'S6',tasks:['T60','T61','T62'],arrangement:'SPC、单批放行、监督与异常再资格',missing:['统计基线待积累','批准角色待落实'],source:'run-02 workflow S6',note:'条件规划不表示已投产。'}
 ];
 const sourceNode=e=>e.nodeId||(e.tasks?.[0]||'');
 const compare=(a,b)=>Number(a.stage.slice(1))-Number(b.stage.slice(1))||Number(sourceNode(a).replace(/^T/,''))-Number(sourceNode(b).replace(/^T/,''))||a.id.localeCompare(b.id);
 const upgrade=state=>state;
 function seed(){
  const state={schema:2,granularity:'一项明确验证条件对应一张实验单；批次、样件和记录分别追溯。',experiments:[],groups:{},samples:{},controls:{},measurements:[],drafts:[],config:{mergeSamePerson:true},sequence:9};
  const definitions=[
   ['EXP-001','S1','T11','R','粉体前处理与四峰级配确认','完成','PSD、KF与表面处理证据'],
   ['EXP-002','S2','T21','R','分段混炼与出罐工艺验证','待分析','扭矩、温度、真空与出罐状态'],
   ['EXP-003','S2','T22','R','小批流变与快速热学筛选','待测试','流变曲线与快速热学对照'],
   ['EXP-004','S3','T30','R','固化窗口与薄层样件制备','执行中','固化记录与样件分配单'],
   ['EXP-005','S3','T31','R','BLT、Shore00与稳定性确认','待方案确认','BLT重复性、硬度及3/7天稳定性'],
   ['EXP-006','S4','T40','R','D5470多厚度热学验证','待方案确认','κ_bulk、κ_app、2Rc与95%置信区间'],
   ['EXP-007','S4','T41','R','可靠性与微观界面并行验证','待方案确认','热循环、湿热与失效界面证据'],
   ['EXP-008','S5','T50','R','10—50kg中试一致性验证','待方案确认','中试过程、对照测试与放大报告']
  ];
  for(const [id,stage,nodeId,route,name,status,expected] of definitions){
   const experiment={id,name,phase:'研发',stage,nodeId,route,pre:'既定前处理',status,goal:expected,scheme:{asset:'thermal-gal-workflow',version:'v0.2-draft.1',formulaAsset:'受控批次任务单',formulaVersion:'待批准',source:'run-02 thermal_gal / '+nodeId},layers:['gel'],tasks:[nodeId],executor:'zhang',tester:'wang',approval:{conditions:true,scheme:status!=='待方案确认',prerequisites:status!=='待方案确认',by:status!=='待方案确认'?'林晓（演示）':'',note:'原型演示，不代表真实批准'},executed:status!=='待方案确认',groupIds:[],sampleIds:[],controlIds:[],flags:status==='待测试'?['待补原始记录']:[],updated:'2026-11-12T02:00:00Z',origin:'run-02导热凝胶演示快照；未接入真实ELN',result:status==='完成'?'演示记录已齐备':'',due:null,expected};
   for(let batch=1;batch<=3;batch++){
    const groupId=`PREP-${id}-B${batch}`,sampleId=`SMP-${id}-B${batch}`;
    state.groups[groupId]={id:groupId,stage,route,block:'B'+batch,registered:status!=='待方案确认',registeredAt:status!=='待方案确认'?'2026-11-12 10:00（演示）':'',layers:[{layer:'gel',batchId:groupId+'-gel',mass:stage==='S5'?'10—50kg计划':'小批演示',note:'不代表实际配方或批次'}],experimentIds:[id]};
    state.samples[sampleId]={id:sampleId,experimentId:id,groupId,type:expected,pre:'既定前处理',planned:true,kind:'导热凝胶验证样件'};
    experiment.groupIds.push(groupId);experiment.sampleIds.push(sampleId);
    if(['完成','待分析'].includes(status))state.measurements.push({id:`MEAS-${id}-${batch}`,experimentId:id,sampleId,type:expected,revisions:[{id:'r1',at:'2026-11-12T02:00:00Z',author:'王宁（演示）',value:'已登记示例观测，非现场事实',unit:'记录',result:'待人工判定',note:'原型快照，不代表run-02已执行'}]});
   }
   state.experiments.push(experiment);
  }
  return state;
 }
 const requirements=(state,experiment)=>experiment.sampleIds.map(sampleId=>({sampleId,groupId:state.samples[sampleId].groupId,type:state.samples[sampleId].type}));
 const records=(state,experiment)=>state.measurements.filter(record=>record.experimentId===experiment.id);
 function delivery(state,experiment){const required=requirements(state,experiment),existing=records(state,experiment);const missing=required.filter(item=>!existing.some(record=>record.sampleId===item.sampleId&&record.type===item.type&&!record.revisions.at(-1).incomplete));return {batches:experiment.groupIds.filter(id=>state.groups[id]?.registered).length,totalBatches:experiment.groupIds.length,measured:required.length-missing.length,required:required.length,missing}}
 function filter(state,criteria={}){return state.experiments.filter(experiment=>(!criteria.phase||experiment.phase===criteria.phase)&&(!criteria.stage||experiment.stage===criteria.stage)&&(!criteria.node||sourceNode(experiment)===criteria.node)&&(!criteria.route||experiment.route===criteria.route)&&(!criteria.pre||experiment.pre===criteria.pre)&&(!criteria.status||experiment.status===criteria.status)&&(!criteria.owner||experiment.executor===criteria.owner||experiment.tester===criteria.owner)&&(!criteria.version||experiment.scheme.version===criteria.version)&&(!criteria.mine||experiment.executor===criteria.person||experiment.tester===criteria.person)&&(!criteria.anomaly||experiment.flags.length||experiment.result==='未通过')&&(!criteria.missing||delivery(state,experiment).missing.length)&&(!criteria.search||[experiment.id,experiment.name,...experiment.sampleIds,...experiment.groupIds].join(' ').toLowerCase().includes(criteria.search.toLowerCase()))).sort(compare)}
 const can=(state,experiment,role,person,scope)=>role==='owner'||(role!=='reader'&&(scope==='measure'?experiment.tester===person:experiment.executor===person));
 function authorize(state,experiment,role,person,scope){if(!can(state,experiment,role,person,scope))throw Error('当前演示身份未获此操作授权')}
 function addMeasurement(state,experiment,input,role,person){authorize(state,experiment,role,person,'measure');if(!experiment.approval.scheme||!experiment.approval.prerequisites||!experiment.executed)throw Error('方案或前置条件未确认，不能登记为已执行测量');if(!input.value?.trim())throw Error('请填写记录，缺数据不以0代填');const item=requirements(state,experiment).find(row=>row.sampleId===input.sampleId&&row.type===input.type);if(!item)throw Error('请选择本实验对应的样件和测量项目');if(!state.groups[item.groupId].registered)throw Error('请先登记对应真实制备批');let record=records(state,experiment).find(row=>row.sampleId===input.sampleId&&row.type===input.type);if(!record){record={id:'MEAS-'+experiment.id+'-'+Date.now(),experimentId:experiment.id,sampleId:input.sampleId,type:input.type,revisions:[]};state.measurements.push(record)}record.revisions.push({id:'r'+(record.revisions.length+1),at:now(),author:people.find(p=>p.id===person)?.name||'林晓',value:input.value.trim(),unit:input.unit||'',result:input.result||'待人工判定',note:input.note||'人工登记（本地演示）'});experiment.updated=now();return record}
 function registerBatch(state,experiment,id,note,role,person){authorize(state,experiment,role,person,'prepare');if(experiment.status==='完成')throw Error('已完成实验的制备信息只读');if(!experiment.executed)throw Error('先确认方案、前置并明确开始执行');if(!experiment.groupIds.includes(id)||!note?.trim())throw Error('选择制备组并填写登记依据');const batch=state.groups[id];if(batch.registered)throw Error('该制备组已登记，不能重复计算');batch.registered=true;batch.registeredAt=now();batch.note=note;experiment.updated=now()}
 function transition(state,experiment,to,role,person){authorize(state,experiment,role,person,'prepare');if(experiment.status==='完成')throw Error('完成记录保留，不反向改写');const current=statuses.indexOf(experiment.status),next=statuses.indexOf(to);if(next!==current+1)throw Error('请依次明确推进业务状态');if(to==='执行中'&&(!experiment.approval.scheme||!experiment.approval.prerequisites))throw Error('方案确认与前置条件尚未满足');if(to==='待分析'&&delivery(state,experiment).missing.length)throw Error('测量记录尚未齐全，可继续登记，不自动完成');if(to==='完成'&&(role!=='owner'||!experiment.review?.trim()))throw Error('需要负责人填写分析与完成意见');experiment.status=to;experiment.executed=next>=1;experiment.updated=now()}
 function confirmScheme(state,experiment,role){if(role!=='owner')throw Error('仅负责人可确认该实验方案');if(!experiment.approval.conditions)throw Error('实验条件尚未完整');experiment.approval.scheme=true;experiment.approval.prerequisites=true;experiment.approval.by='林晓（本地演示）';experiment.updated=now()}
 function promoteDraft(state,draft,role){if(role!=='owner')throw Error('仅负责人可确认实验草稿纳入');if(draft.existingId)throw Error('该条件已有实验，请进入原ELN');if(draft.missing?.length)throw Error('请先补齐草稿关键输入');if(!draft.name||!draft.goal||!draft.stage||!draft.route||!draft.executor||!draft.tester||!draft.expected)throw Error('目标、条件、方案、责任及预期记录必须明确');const id='EXP-'+String(state.sequence++).padStart(3,'0'),experiment={id,name:draft.name,phase:'研发',stage:draft.stage,nodeId:draft.nodeId||'',route:draft.route,pre:draft.pre||'待确认',status:'待方案确认',goal:draft.goal,scheme:{asset:'thermal-gal-workflow',version:draft.schemeVersion||'v0.2-draft.1',formulaAsset:'受控批次任务单',formulaVersion:'待批准',source:draft.source||'用户登记'},layers:['gel'],tasks:draft.nodeId?[draft.nodeId]:[],executor:draft.executor,tester:draft.tester,approval:{conditions:true,scheme:false,prerequisites:false,by:'',note:'待人工确认'},executed:false,groupIds:[],sampleIds:[],controlIds:[],flags:[],updated:now(),origin:'用户登记的独立演示实验',result:'',due:null,expected:draft.expected};state.experiments.push(experiment);state.drafts=state.drafts.filter(row=>row.id!==draft.id);return experiment}
 function counts(state){return {experiments:state.experiments.length,coatedPanels:Object.keys(state.samples).length,blankPanels:Object.keys(state.controls).length,prepGroups:Object.keys(state.groups).length,layerBatches:Object.values(state.groups).reduce((count,batch)=>count+batch.layers.length,0)}}
 return {stages,routes,statuses,people,plans,seed,clone,sourceNode,compare,upgrade,requirements,records,delivery,filter,can,addMeasurement,registerBatch,transition,confirmScheme,promoteDraft,counts};
})();
