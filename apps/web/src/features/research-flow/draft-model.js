// Pure helpers for local workflow authoring. Source snapshots are never mutated.
const FlowDraft = (() => {
 function validate(view) {
  const ids=new Map();
  for(const t of view.tasks){
   if(!t.id||!t.name?.trim()||!t.stage)throw new Error('请填写节点名称并选择所属阶段。');
   if(ids.has(t.id))throw new Error('节点标识重复，请重新添加。');
   ids.set(t.id,t);
  }
  for(const [stage,edges] of Object.entries(view.edges)){
   const seen=new Set(),adj=new Map(view.tasks.filter(t=>t.stage===stage).map(t=>[t.id,[]]));
   for(const [from,to] of edges){
    if(!adj.has(from)||!adj.has(to))throw new Error('连线两端必须属于当前子阶段。');
    if(from===to)throw new Error('节点不能连接到自身。');
    const key=from+'>'+to;if(seen.has(key))throw new Error('这两个节点之间已经存在连线。');seen.add(key);adj.get(from).push(to);
   }
   const visiting=new Set(),done=new Set();
   function visit(id){if(visiting.has(id))throw new Error('这条连线会产生循环依赖，请调整起点或终点。');if(done.has(id))return;visiting.add(id);for(const to of adj.get(id))visit(to);visiting.delete(id);done.add(id)}
   for(const id of adj.keys())visit(id);
  }
  return true;
 }
 function layout(tasks,edges){
  const ranks=new Map(tasks.map(t=>[t.id,0])),incoming=new Map(tasks.map(t=>[t.id,0])),adj=new Map(tasks.map(t=>[t.id,[]]));
  for(const [a,b] of edges){if(!adj.has(a)||!adj.has(b))continue;adj.get(a).push(b);incoming.set(b,incoming.get(b)+1)}
  const queue=tasks.filter(t=>incoming.get(t.id)===0).map(t=>t.id);
  for(let i=0;i<queue.length;i++){const id=queue[i];for(const to of adj.get(id)){ranks.set(to,Math.max(ranks.get(to),ranks.get(id)+1));incoming.set(to,incoming.get(to)-1);if(!incoming.get(to))queue.push(to)}}
  if(queue.length!==tasks.length)throw new Error('流程存在循环，无法排列。');
  const groups=[];for(const t of tasks)(groups[ranks.get(t.id)]||=([])).push(t.id);
  const rows=Math.max(1,...groups.map(g=>g.length)),positions={};
  groups.forEach((g,c)=>g.forEach((id,i)=>{const start=g.length===1?1:Math.floor(i*(rows-1)/Math.max(1,g.length-1))+1;positions[id]={column:c+1,rowStart:start,rowEnd:g.length===1?rows+1:start+1}}));
  return {columns:Math.max(1,groups.length),rows,positions};
 }
 function removeNode(view,id){const next=structuredClone(view);next.tasks=next.tasks.filter(t=>t.id!==id);for(const key of Object.keys(next.edges))next.edges[key]=next.edges[key].filter(([a,b])=>a!==id&&b!==id);return next}
 function assertCompletedUnchanged(previous,next,completedIds,allowNewTaskDependencies=false,allowRemovedDependencies=false,allowCompletedEdges=false){
  const changingIds=new Set(allowNewTaskDependencies?[...next.tasks.filter(t=>t.custom&&!previous.tasks.some(p=>p.id===t.id)),...previous.tasks.filter(t=>t.custom&&!next.tasks.some(p=>p.id===t.id))].map(t=>t.id):[]);
  const removedIds=new Set(allowRemovedDependencies?[...previous.tasks.filter(t=>!next.tasks.some(n=>n.id===t.id)),...next.tasks.filter(t=>!previous.tasks.some(n=>n.id===t.id))].filter(t=>!completedIds.includes(t.id)).map(t=>t.id):[]);
  const incident=(view,id)=>Object.entries(view.edges).flatMap(([stage,edges])=>edges.filter(([a,b])=>(a===id||b===id)&&!(a===id&&changingIds.has(b))&&!removedIds.has(a)&&!removedIds.has(b)).map(e=>JSON.stringify([stage,...e]))).sort();
  for(const id of completedIds){if(JSON.stringify(previous.tasks.find(t=>t.id===id))!==JSON.stringify(next.tasks.find(t=>t.id===id)))throw new Error('已完成节点不可修改、删除或重新分配负责人。');if(!allowCompletedEdges&&JSON.stringify(incident(previous,id))!==JSON.stringify(incident(next,id)))throw new Error('已完成节点的关联流程连线不可修改。')}
  return true;
 }
 function withSimulationDemo(view){
  const next=structuredClone(view);
  if(!next.tasks.some(t=>t.id==='T20')){const index=next.tasks.findIndex(t=>t.id==='T21');next.tasks.splice(index<0?next.tasks.length:index,0,{id:'T20',stage:'S2',name:'计算模拟',demo:true,role:'',method:'人工',scope:'计算模拟演示 · 多材料跨尺度导热',input:'材料结构、热导率模型、构件边界条件与计算配置',condition:'在计算模拟工作台中核对材料与构件配置，运行演示工作流并查看结果。此节点用于交互演示，不代表实际实验或科学验证。',deliverables:[{id:'D20-DEMO',description:'跨尺度导热计算演示报告'}],ops:''})}
  if(next.tasks.some(t=>t.id==='T21')&&!next.edges.S2.some(([a,b])=>a==='T20'&&b==='T21'))next.edges.S2.unshift(['T20','T21']);
  return next;
 }
 return {validate,layout,removeNode,assertCompletedUnchanged,withSimulationDemo};
})();
