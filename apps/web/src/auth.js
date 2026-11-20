(()=>{
 const form=document.querySelector('#auth-form'),username=document.querySelector('#auth-username'),password=document.querySelector('#auth-password'),submit=document.querySelector('#auth-submit'),error=document.querySelector('#auth-error'),toggle=document.querySelector('#auth-password-toggle');
 toggle.addEventListener('click',()=>{const visible=password.type==='text';password.type=visible?'password':'text';toggle.textContent=visible?'显示':'隐藏';toggle.setAttribute('aria-label',visible?'显示密码':'隐藏密码');toggle.setAttribute('aria-pressed',String(!visible));password.focus()});
 form.addEventListener('submit',async event=>{
  event.preventDefault();error.textContent='';
  if(!username.value.trim()||!password.value){error.textContent='请输入账号和密码。';(!username.value.trim()?username:password).focus();return}
  submit.disabled=true;submit.classList.add('loading');submit.querySelector('span').textContent='正在验证…';
  try{
   if(window.PrototypeDemoAuth){await window.PrototypeDemoAuth.signIn(username.value.trim(),password.value);return}
   const response=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:username.value.trim(),password:password.value})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(result.error||'暂时无法登录，请稍后重试。');
   location.reload();
  }catch(problem){error.textContent=problem.message;password.select()}
  finally{submit.disabled=false;submit.classList.remove('loading');submit.querySelector('span').textContent='登录并进入'}
 });
 username.focus();
})();
