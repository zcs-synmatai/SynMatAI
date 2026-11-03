import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(projectRoot, 'apps/web');
const publicRoot = resolve(webRoot, 'public');
const mime = { '.pdf':'application/pdf', '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.xyz':'text/plain; charset=utf-8', '.eln':'application/zip' };

function inside(root, candidate) {
  const name = relative(root, candidate);
  return name === '' || (!name.startsWith('..') && !isAbsolute(name));
}
export function createDevServer() {
  return createServer(async (req, res) => {
    if (!['GET','HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow:'GET, HEAD' }); res.end(); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const normalized = pathname.replaceAll('\\','/');
      if (normalized.includes('\0') || normalized.split('/').some(p => p.startsWith('.'))) {
        res.writeHead(400); res.end('Invalid path'); return;
      }
      const name = normalized === '/' ? 'index.html' : normalized.replace(/^\/+/, '');
      // Only application source, its entrypoint and public assets are served.
      const base = name === 'index.html' || name.startsWith('src/') ? webRoot : publicRoot;
      const target = resolve(base, name);
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
