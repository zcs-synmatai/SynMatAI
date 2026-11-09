(()=>{
 const button=document.querySelector('#auth-logout');
 if(!button)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{await fetch('/auth/logout',{method:'POST'})}finally{location.reload()}
 });
})();
