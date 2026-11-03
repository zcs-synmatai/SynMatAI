/* Archived prototype entry points remain functional and discoverable when active. */
(()=>{
 const archive=document.querySelector('.sidebar-archive');if(!archive)return;
 const update=()=>{const active=!!archive.querySelector('[data-nav].active');archive.classList.toggle('has-active',active);if(active)archive.open=true};
 const observer=new MutationObserver(update);
 document.querySelectorAll('.sidebar [data-nav]').forEach(button=>observer.observe(button,{attributes:true,attributeFilter:['class']}));
 archive.addEventListener('keydown',e=>{if(e.key==='Escape'){archive.open=false;archive.querySelector('summary').focus()}});
 update();
})();
