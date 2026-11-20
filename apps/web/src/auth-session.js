(() => {
  if (window.PrototypeDemoAuth) return;
  const page = document.documentElement;
  const status = document.querySelector('#auth-status');
  const logout = document.querySelector('#auth-logout');
  let checking = false;
  let signingOut = false;

  async function checkSession() {
    if (checking || signingOut) return;
    checking = true;
    try {
      const response = await fetch('./auth/session', { cache:'no-store' });
      if (signingOut) return;
      if (response.status === 401) {
        page.setAttribute('data-auth-pending', '');
        location.reload();
        return;
      }
      if (!response.ok || (await response.json()).authenticated !== true) throw new Error('Session check failed');
      if (!signingOut) page.removeAttribute('data-auth-pending');
    } catch {
      if (!signingOut) {
        page.setAttribute('data-auth-pending', '');
        status.textContent = '暂时无法校验登录状态。请使用演示服务入口，或刷新重试。';
      }
    } finally {
      checking = false;
    }
  }

  logout.addEventListener('click', async () => {
    signingOut = true;
    logout.disabled = true;
    try {
      const response = await fetch('./auth/logout', { method:'POST', cache:'no-store' });
      if (!response.ok || (await response.json()).ok !== true) throw new Error('Logout failed');
      page.setAttribute('data-auth-pending', '');
      status.textContent = '正在退出登录…';
      location.reload();
    } catch {
      signingOut = false;
      logout.disabled = false;
      window.alert('退出登录失败，请重试。');
    }
  });

  window.addEventListener('pagehide', () => page.setAttribute('data-auth-pending', ''));
  window.addEventListener('pageshow', checkSession);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkSession();
  });
  window.setInterval(() => {
    if (!document.hidden) checkSession();
  }, 60_000);
  checkSession();
})();
