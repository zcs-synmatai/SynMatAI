/* Archived prototype entry points remain functional and discoverable when active. */
(()=>{
 const archive=document.querySelector('.sidebar-archive');if(!archive)return;
 const update=()=>{const active=!!archive.querySelector('[data-nav].active');archive.classList.toggle('has-active',active);if(active)archive.open=true};
 const observer=new MutationObserver(update);
 document.querySelectorAll('.sidebar [data-nav]').forEach(button=>observer.observe(button,{attributes:true,attributeFilter:['class']}));
 archive.addEventListener('keydown',e=>{if(e.key==='Escape'){archive.open=false;archive.querySelector('summary').focus()}});
 update();
})();

/* Keep the main workspace entry available as a quick project switcher. */
(()=>{
 const trigger=document.querySelector('.sidebar [data-nav="任务"]');if(!trigger||typeof ProjectStore==='undefined')return;
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const popup=document.createElement('div');popup.className='sidebar-project-switch-menu';popup.hidden=true;popup.setAttribute('role','menu');popup.setAttribute('aria-label','快捷切换项目');popup.id='sidebar-project-switch-menu';document.body.append(popup);
 trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-controls',popup.id);trigger.setAttribute('aria-expanded','false');let openTimer,closeTimer;
 const eligible=()=>document.body.classList.contains('task-workspace-active')||document.body.classList.contains('flow-canvas-active');
 function close(){clearTimeout(openTimer);clearTimeout(closeTimer);popup.hidden=true;trigger.setAttribute('aria-expanded','false')}
 function show(){if(!eligible())return;clearTimeout(closeTimer);const active=ProjectStore.active()?.id;popup.innerHTML=`<header>切换项目</header><div>${ProjectStore.list().map(p=>`<button type="button" role="menuitem" data-quick-project="${safe(p.id)}" ${p.id===active?'aria-current="true"':''}><svg aria-hidden="true"><use href="#${p.id===active?'check':'workspace'}"/></svg><span><strong>${safe(p.name)}</strong><small>${safe([p.currentPhase,p.currentTask].filter(Boolean).join(' · ')||'项目工作台')}</small></span></button>`).join('')}</div>`;const rect=trigger.getBoundingClientRect();popup.style.left=Math.min(rect.right+8,Math.max(8,innerWidth-296))+'px';popup.style.top=Math.max(8,Math.min(rect.top,innerHeight-360))+'px';popup.hidden=false;trigger.setAttribute('aria-expanded','true');popup.querySelectorAll('[data-quick-project]').forEach(b=>b.onclick=()=>{const id=b.dataset.quickProject;close();if(id!==ProjectStore.active()?.id)ProjectStore.activate(id,{route:'#workspace/task',entry:'project-workbench'})})}
 function leave(){clearTimeout(openTimer);closeTimer=setTimeout(close,220)}
 trigger.addEventListener('mouseenter',()=>{clearTimeout(closeTimer);openTimer=setTimeout(show,140)});trigger.addEventListener('mouseleave',leave);trigger.addEventListener('focus',()=>{if(eligible())show()});trigger.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown'){if(!eligible())return;e.preventDefault();show();popup.querySelector('button')?.focus()}else if(e.key==='Escape')close()});
 popup.addEventListener('mouseenter',()=>clearTimeout(closeTimer));popup.addEventListener('mouseleave',leave);popup.addEventListener('focusin',()=>clearTimeout(closeTimer));popup.addEventListener('focusout',e=>{if(!popup.contains(e.relatedTarget)&&e.relatedTarget!==trigger)leave()});popup.addEventListener('keydown',e=>{if(e.key==='Escape'){trigger.focus();close()}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=[...popup.querySelectorAll('button')],index=items.indexOf(document.activeElement),direction=e.key==='ArrowDown'?1:-1;items[(index+direction+items.length)%items.length]?.focus()}});
 document.addEventListener('pointerdown',e=>{if(!popup.contains(e.target)&&!trigger.contains(e.target))close()});addEventListener('resize',close);addEventListener('hashchange',close);
})();
