/* Task canvas topology and provenance; no experiment state is copied or executed. */
const TaskCanvasModel=(()=>{
 const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 const seed=()=>({schema:1,edges:[],artifacts:[],hidden:[],inputNames:null});
 const supportsTask=task=>task.name!=='计算模拟'&&!['计算','计算节点'].includes(task.taskType);
 const inputId=name=>'INPUT-'+[...name].reduce((n,c)=>(Math.imul(n,31)+c.codePointAt(0))>>>0,7).toString(36);
 function seedResearch(state,rows,catalog){
  if(state.researchExampleVersion>=2)return false;
  if(state.researchExampleVersion===1){
   const ids=rows.filter(r=>/明确.*技术指标|梳理候选技术路线|补充专利|完成技术调研报告/.test(r.name)).map(r=>r.id);
   state.edges=state.edges.map(e=>{const i=ids.indexOf(e[0]);return i>=0&&i<3&&e[1]===ids[i+1]?[...e.slice(0,4),{fromPort:i===1?'bottom':i===2?'left':'right',toPort:i===1?'top':i===2?'right':'left'}]:e});
   state.researchExampleVersion=2;return true;
  }
  state.researchExampleVersion=2;
  if(state.edges.length||state.artifacts.length)return true;
  const patterns=[/明确.*技术指标|明确.*应用边界/,/梳理候选技术路线/,/补充专利/,/完成技术调研报告/];
  const tasks=patterns.map(re=>rows.find(r=>re.test(r.name)));
  if(tasks.some(t=>!t))return true;
  tasks.slice(1).forEach((t,i)=>state.edges.push([tasks[i].id,t.id,'','dependency',{fromPort:i===1?'bottom':i===2?'left':'right',toPort:i===1?'top':i===2?'right':'left'}]));
  for(const [name,target] of [['需求确认纪要.md',0],['涂层性能指标.csv',0]])if(catalog.includes(name))state.edges.push([inputId(name),tasks[target].id,'','dependency']);
  // This already-existing example document is displayed as the report step's deliverable.
  if(catalog.includes('技术调研报告.md')){state.inputNames=state.inputNames.filter(n=>n!=='技术调研报告.md');artifact(state,tasks[3].id,'技术调研报告.md')}
  return true;
 }
 function project(rows,catalog,state){
  const referenced=[...new Set(rows.flatMap(row=>row.inputs||[]))];
  const inputs=[...new Set([...(state.inputNames||[]),...referenced])].filter(n=>catalog.includes(n));
  const nodes=[...rows.concat(state.chats||[]).filter(r=>!state.hidden.includes(r.id)).map(r=>({...r,outputs:[...new Set([...(r.outputs||[]),...state.artifacts.filter(a=>a.producer===r.id).map(a=>a.name)])],canvasKind:'task',canvasType:r.type})),
   ...inputs.map(name=>({id:inputId(name),name,canvasKind:'input',canvasType:'输入文件',owner:'只读输入',statusName:'只读',inputs:[],outputs:[]})),
   ...state.artifacts.map(a=>({...a,canvasKind:'artifact',canvasType:'产出文件',owner:'来自 '+a.producer,statusName:'草稿',inputs:[],outputs:[]}))];
  const ids=new Set(nodes.map(n=>n.id)),edges=state.edges.filter(e=>ids.has(e[0])&&ids.has(e[1]));
  for(const a of state.artifacts)if(ids.has(a.producer)&&!edges.some(e=>e[0]===a.producer&&e[1]===a.id))edges.push([a.producer,a.id,'产出文件','dependency']);
  for(const n of nodes.filter(n=>n.canvasKind==='task'))for(const name of n.inputs||[]){const source=nodes.find(x=>x.canvasKind!=='task'&&x.name===name);if(source&&!edges.some(e=>e[0]===source.id&&e[1]===n.id))edges.push([source.id,n.id,'文件输入','dependency'])}
  return {nodes,edges:edges.filter(e=>!(state.removedEdges||[]).some(pair=>pair[0]===e[0]&&pair[1]===e[1])),inputs};
 }
 function createConversation(state){state.chatSequence=(state.chatSequence||0)+1;const chat={id:uid('CHAT'),name:'临时对话 '+String(state.chatSequence).padStart(2,'0'),kind:'conversation',type:'对话',inputs:[],outputs:[]};(state.chats||=[]).push(chat);return chat}
 function conversationContext(scene,id,threads={},readFile=()=>null){
  return [...new Set(scene.edges.filter(e=>e[1]===id).map(e=>e[0]))].map(sourceId=>{
   const source=scene.nodes.find(n=>n.id===sourceId);if(!source)return null;
   const messages=(threads[sourceId]||[]).filter(m=>typeof m.text==='string').map(m=>({user:!!m.user,text:m.text}));
   const names=[...new Set(source.canvasKind==='task'?[...(source.outputs||[]),...(threads[sourceId]||[]).map(m=>m.doc).filter(Boolean)]:[source.name])];
   return {id:source.id,name:source.name,messages,files:names.map(name=>({name,text:readFile(name)}))};
  }).filter(Boolean);
 }
 function connect(scene,from,to,fromPort='right',toPort='left'){
  const a=scene.nodes.find(n=>n.id===from),b=scene.nodes.find(n=>n.id===to);if(!a||!b)throw Error('节点不存在');if(from===to)throw Error('不能连接节点自身');if(b.canvasKind==='input')throw Error('输入文件只读，不能接收节点产出');if(b.canvasKind==='artifact')throw Error('产出文件的来源由生成节点确定，不能手动更换');if(scene.edges.some(e=>e[0]===from&&e[1]===to))throw Error('这条连线已存在');
  const visit=id=>id===from||scene.edges.filter(e=>e[0]===id).some(e=>visit(e[1]));if(visit(to))throw Error('连线将产生循环');return [from,to,a.canvasKind==='task'?'传递产出物':'文件输入','dependency',{fromPort,toPort}];
 }
 function removeEdge(state,edge){state.edges=state.edges.filter(e=>e[0]!==edge[0]||e[1]!==edge[1]);state.removedEdges=state.removedEdges||[];if(!state.removedEdges.some(e=>e[0]===edge[0]&&e[1]===edge[1]))state.removedEdges.push(edge.slice(0,2))}
 function inheritedFiles(scene,id){const names=new Set();for(const e of scene.edges.filter(e=>e[1]===id)){const source=scene.nodes.find(n=>n.id===e[0]);if(!source)continue;if(source.canvasKind!=='task')names.add(source.name);else for(const f of source.outputs||[])names.add(f)}return [...names]}
 function addDeliverable(state,scene,id){const file=scene.nodes.find(n=>n.id===id);if(!file||file.canvasKind==='task')throw Error('请选择画布上的文件');state.deliverables=state.deliverables||[];if(state.deliverables.some(d=>d.nodeId===id||d.name===file.name))return false;state.deliverables.push({nodeId:file.id,name:file.name,sourceKind:file.canvasKind,producer:file.producer||null});return true}
 function removeDeliverable(state,id){state.deliverables=(state.deliverables||[]).filter(d=>d.nodeId!==id)}
 function artifact(state,producer,name){if(state.artifacts.some(a=>a.name===name))throw Error('同名产出已存在');const a={id:uid('FILE'),name,producer};state.artifacts.push(a);return a}
 return {uid,inputId,seed,createConversation,conversationContext,seedResearch,supportsTask,project,connect,removeEdge,inheritedFiles,addDeliverable,removeDeliverable,artifact};
})();
