(() => {
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const login = new URL('login.html', root);
  const index = new URL('index.html', root);
  const archive = new URL('archives/workflow-v2/index.html', root);
  const storageKey = `synmatai-demo-session:${root.pathname}`;
  let expiryTimer;

  function readSession() {
    try {
      const session = JSON.parse(localStorage.getItem(storageKey));
      return typeof session?.username === 'string' && Number.isFinite(session.expiresAt) && session.expiresAt > Date.now() ? session : null;
    } catch {
      return null;
    }
  }

  function returnToLogin() {
    document.documentElement.setAttribute('data-auth-pending', '');
    const destination = new URL(login);
    destination.searchParams.set('return', location.pathname + location.search + location.hash);
    location.replace(destination);
  }

  function checkSession() {
    window.clearTimeout(expiryTimer);
    const session = readSession();
    if (!session) return returnToLogin();
    document.documentElement.removeAttribute('data-auth-pending');
    expiryTimer = window.setTimeout(checkSession, session.expiresAt - Date.now());
  }

  async function signIn(username, password) {
    const response = await fetch(new URL('demo-accounts.json', root), { cache:'no-store' });
    if (!response.ok || !window.crypto?.subtle) throw new Error('登录配置暂时不可用，请刷新后重试。');
    const { accounts, iterations, sessionHours } = await response.json();
    const account = accounts.find(item => item.username === username);
    if (!account) throw new Error('账号或密码不正确，请重新输入。');
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt:encoder.encode(account.salt), iterations }, key, 256);
    const digest = Array.from(new Uint8Array(derived), byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== account.digest) throw new Error('账号或密码不正确，请重新输入。');
    localStorage.setItem(storageKey, JSON.stringify({ username, expiresAt:Date.now() + sessionHours * 3_600_000 }));
    openWorkspace();
  }

  function openWorkspace() {
    const requested = new URLSearchParams(location.search).get('return');
    let target = index;
    if (requested) {
      try { target = new URL(requested, root); } catch { /* Use the default workspace. */ }
    }
    const allowedPaths = [root.pathname, index.pathname, archive.pathname, new URL('.', archive).pathname];
    location.replace(target.origin === root.origin && allowedPaths.includes(target.pathname) ? target : index);
  }

  window.PrototypeDemoAuth = { signIn };
  if (script.dataset.demoRoute === 'login') {
    if (readSession()) openWorkspace();
    return;
  }

  checkSession();
  window.addEventListener('pageshow', checkSession);
  window.addEventListener('pagehide', () => document.documentElement.setAttribute('data-auth-pending', ''));
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) checkSession();
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#auth-logout')?.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      returnToLogin();
    });
  });
})();
