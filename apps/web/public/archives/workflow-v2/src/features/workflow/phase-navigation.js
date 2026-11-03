/* Shared V2 parent/substage menu. Data and selection remain owned by each page. */
window.SynmatPhaseNavigation={
 mount(root,{selector,getState,onSubstage}){
  const menu=document.createElement('div');menu.className='phase-submenu';menu.hidden=true;
  menu.setAttribute('role','menu');document.body.append(menu);
  let anchor=null,openPhase='';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function close(focus=false){menu.hidden=true;anchor?.setAttribute('aria-expanded','false');if(focus)anchor?.focus();anchor=null}
  function position(){if(!anchor)return;const r=anchor.getBoundingClientRect();menu.style.width=Math.min(320,innerWidth-24)+'px';menu.style.left=Math.max(12,Math.min(r.left,innerWidth-menu.offsetWidth-12))+'px';menu.style.top=(r.bottom+8)+'px';menu.style.maxHeight=Math.max(100,innerHeight-r.bottom-20)+'px'}
  function draw(){const state=getState(openPhase);menu.setAttribute('aria-label',openPhase+'子阶段');menu.innerHTML=`<div class="phase-submenu-heading"><strong>${escape(openPhase)}子阶段</strong><span>${state.items.length} 个子阶段</span></div>`+state.items.map((s,i)=>`<button type="button" role="menuitemradio" aria-checked="${state.phase===openPhase&&state.selected===s.id}" data-sub-id="${escape(s.id)}"><span class="phase-sub-number">${String(i+1).padStart(2,'0')}</span><span class="phase-sub-copy"><strong>${escape(s.name)}</strong><small>${s.count} 项任务</small></span><span class="phase-sub-status" data-status="${escape(s.status)}"><i></i>${escape(s.status)}</span><span class="phase-sub-check">${state.phase===openPhase&&state.selected===s.id?'✓':''}</span></button>`).join('');menu.querySelectorAll('[data-sub-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.subId;close();onSubstage(openPhase,id);anchor=null});position()}
  root.querySelectorAll(selector).forEach(b=>{
   const p=b.dataset.phase||b.dataset.flowProjectPhase;if(!getState(p).items.length)return;
   b.classList.add('has-substages');b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');
   if(!b.querySelector('.phase-sub-caret'))b.insertAdjacentHTML('beforeend','<svg class="phase-sub-caret" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>');
   b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(anchor===b&&!menu.hidden){close();return}close();anchor=b;openPhase=p;b.setAttribute('aria-expanded','true');menu.hidden=false;draw()},true);
   b.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if(menu.hidden)b.click();(menu.querySelector('[aria-checked="true"]')||menu.querySelector('button'))?.focus()}});
  });
  menu.addEventListener('keydown',e=>{const buttons=[...menu.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}if(e.key==='Escape'){e.preventDefault();close(true)}if(e.key==='Tab')close()});
  document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target)&&!anchor?.contains(e.target))close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden)close(true)});
  window.addEventListener('resize',()=>close());window.addEventListener('hashchange',()=>close());
  window.addEventListener('scroll',e=>{if(!menu.hidden&&!menu.contains(e.target))close()},true);
  return {refresh(){if(!menu.hidden)draw()},close};
 }
};
