const TaskDialogueModel=(()=>{
 function thread(store,id,seed=[]){if(!Array.isArray(store[id]))store[id]=structuredClone(seed);return store[id]}
 function append(store,id,message){thread(store,id).push(message)}
 function agent(row){
  if(!row)return '研究 Copilot';
  if(row.kind==='conversation')return '临时对话Agent';
  if(/Agent$/i.test(row.owner||''))return row.owner;
  const type=row.type||row.taskType||'';if(/DOE/.test(type))return 'DOE实验设计 Agent';if(row.kind==='experiment'||/实验/.test(type))return '实验协作 Agent';
  const name=row.name||row.text||'';
  if(/模拟|求解|热导率/.test(name))return '模拟计算 Agent';
  if(/批料|施工窗|制备|工艺/.test(name))return '工艺规划 Agent';
  if(/文献|专利/.test(name))return '文献调研 Agent';
  if(/路线|方案/.test(name))return '方案规划 Agent';
  if(/审批|评审|核对|指标|缺口/.test(name))return '证据核查 Agent';
  if(/数据|分析/.test(name)||/分析/.test(type))return '数据分析 Agent';if(/调研/.test(type)||/调研/.test(name))return '调研 Agent';
  return '资料整理 Agent';
 }
 function ability(name){return /DOE/.test(name)?'组织因子与水平、草拟实验设计及分析计划':/调研/.test(name)?'整理调研线索、文献证据与引用':/分析/.test(name)?'梳理已有数据、识别缺项并辅助分析':/实验/.test(name)?'核对SOP、辅助记录与结果分析；实验操作由人工完成':/模拟/.test(name)?'辅助建模、参数核对与结果解释':/工艺/.test(name)?'梳理工艺条件、施工窗口与记录要求':/核查/.test(name)?'核查证据完整性、版本与人工确认要点':/规划/.test(name)?'梳理路线、拆解执行步骤与交付要求':'整理输入资料、文件索引与交付草稿'}
 function markup(row){const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),name=agent(row),mode=row.executionMode==='ai'?'执行':'辅助',humans=[...new Set([...(row.executionMode==='ai'?[]:[row.owner]),...(row.collaborators||[])])].filter(n=>n&&n!=='待分配'&&!/Agent$/.test(n)),symbol=/DOE/.test(name)?'grid':/调研/.test(name)?'asset-search-icon':/分析/.test(name)?'flow':/实验/.test(name)?'flask':/模拟/.test(name)?'grid':'spark';return '<div class="node-agent-meta" aria-label="'+esc(name+' · '+(mode==='执行'?'Agent执行':'辅助人工'))+'"><span class="node-agent-glyph"><svg aria-hidden="true"><use href="#'+symbol+'"/></svg></span><span class="node-agent-label" title="'+esc(name+'：'+ability(name))+'">'+esc(name)+'</span><small class="node-agent-role">'+mode+'</small><span class="node-human-group">'+humans.slice(0,2).map(n=>'<span class="node-human-avatar" role="img" aria-label="负责人/协作人 '+esc(n)+'" title="'+esc(n)+'">'+esc(n.slice(0,1))+'</span>').join('')+'</span></div>'}
 return {thread,append,agent,ability,markup};
})();
