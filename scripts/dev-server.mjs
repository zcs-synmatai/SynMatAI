import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { dirname, extname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(projectRoot, 'apps/web');
const publicRoot = resolve(webRoot, 'public');
const authConfigPath = resolve(projectRoot, 'config/prototype-auth.json');
const mime = { '.pdf':'application/pdf', '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.md':'text/markdown; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.xyz':'text/plain; charset=utf-8', '.eln':'application/zip' };
const publicLoginFiles = new Set(['/login.html','/src/styles/auth.css','/src/auth.js','/assets/brand/synmatai-logo.png']);

function inside(root, candidate) {
  const name = relative(root, candidate);
  return name === '' || (!name.startsWith('..') && !isAbsolute(name));
}
export function createDevServer(authConfig) {
  const config = authConfig ?? JSON.parse(readFileSync(authConfigPath, 'utf8'));
  const accounts = [...(config.accounts ?? [])];
  if (config.username !== undefined || config.password !== undefined) {
    accounts.unshift({ username:config.username, password:config.password });
  }
  if (config.enabled !== false && (
    !accounts.length ||
    accounts.some(account => typeof account?.username !== 'string' || !account.username.trim() || typeof account.password !== 'string' || !account.password) ||
    new Set(accounts.map(account => account.username)).size !== accounts.length
  )) throw new Error('Prototype auth requires a unique username and a password for each account');
  const loginAccounts = config.enabled === false ? [] : accounts.map(account => ({
    ...account,
    sessionToken:randomBytes(32).toString('base64url'),
  }));
  const sessionHours = Math.min(72, Math.max(1, Number(config.sessionHours) || 8));
  const cookieName = 'synmatai_prototype_session';
  const secureEqual = (actual, expected) => {
    const left = Buffer.from(String(actual ?? ''));
    const right = Buffer.from(String(expected ?? ''));
    return left.length === right.length && timingSafeEqual(left, right);
  };
  const sessionAccount = req => {
    const cookie = String(req.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith(cookieName+'='));
    if (!cookie) return undefined;
    const token = cookie.slice(cookieName.length+1);
    return loginAccounts.find(account => secureEqual(token, account.sessionToken));
  };
  const json = (res, status, body, headers={}) => {
    const data = Buffer.from(JSON.stringify(body));
    res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length':data.length, 'Cache-Control':'no-store', ...headers });
    res.end(data);
  };
  const readJson = req => new Promise((resolveBody, rejectBody) => {
    const chunks=[]; let size=0;
    req.on('data', chunk => { size += chunk.length; if (size > 16_384) { rejectBody(new Error('request too large')); req.destroy(); } else chunks.push(chunk); });
    req.on('end', () => { try { resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (error) { rejectBody(error); } });
    req.on('error', rejectBody);
  });
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const normalized = pathname.replaceAll('\\','/');
      if (normalized.includes('\0') || normalized.split('/').some(p => p.startsWith('.'))) {
        res.writeHead(400); res.end('Invalid path'); return;
      }
      if (req.method === 'POST' && normalized === '/auth/login') {
        const body = await readJson(req);
        const account = loginAccounts.find(candidate => secureEqual(body?.username, candidate.username) && secureEqual(body?.password, candidate.password));
        if (!account) return json(res, 401, { error:'账号或密码不正确，请重新输入。' });
        const cookie = `${cookieName}=${account.sessionToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionHours*3600}`;
        return json(res, 200, { ok:true }, { 'Set-Cookie':cookie });
      }
      if (req.method === 'POST' && normalized === '/auth/logout') {
        return json(res, 200, { ok:true }, { 'Set-Cookie':`${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
      }
      if (!['GET','HEAD'].includes(req.method)) {
        res.writeHead(405, { Allow:'GET, HEAD, POST' }); res.end(); return;
      }
      const account = sessionAccount(req);
      const authenticated = config.enabled === false || Boolean(account);
      if (normalized === '/auth/session') {
        return authenticated
          ? json(res, 200, { authenticated:true, username:account?.username ?? config.username })
          : json(res, 401, { authenticated:false });
      }
      if (!authenticated && normalized !== '/' && normalized !== '/index.html' && !publicLoginFiles.has(normalized)) return json(res, 401, { error:'请先登录后访问。' });
      const name = normalized === '/' ? 'index.html' : normalized.replace(/^\/+/, '');
      const servedName = !authenticated && name === 'index.html' ? 'login.html' : name;
      // Only application source, its entrypoint and public assets are served.
      const base = servedName === 'index.html' || servedName === 'login.html' || servedName.startsWith('src/') ? webRoot : publicRoot;
      const target = resolve(base, servedName);
      if (!inside(base, target) || !(await stat(target)).isFile()) throw new Error('not found');
      const data = await readFile(target);
      res.writeHead(200, { 'Content-Type':mime[extname(target)] || 'application/octet-stream', 'Content-Length':data.length, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Not found');
    }
  });
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const at = process.argv.indexOf('--port');
  const port = Number(at >= 0 ? process.argv[at+1] : process.env.PORT || 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const server = createDevServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`SynMatAI: http://127.0.0.1:${port}\nPress Ctrl+C to stop.`));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close());
}
