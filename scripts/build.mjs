import { cp, mkdir, rm, readFile, writeFile, lstat } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { projectRoot } from './dev-server.mjs';

const web = resolve(projectRoot, 'apps/web');
const output = resolve(projectRoot, 'dist');
// Only this project's fixed, generated dist directory can be cleaned.
const existingOutput = await lstat(output).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
if (relative(projectRoot, output) !== 'dist' || existingOutput?.isSymbolicLink()) throw new Error('Invalid build target');
const index = await readFile(resolve(web, 'index.html'), 'utf8');
const login = await readFile(resolve(web, 'login.html'), 'utf8');
const archivePath = 'archives/workflow-v2/index.html';
const archive = await readFile(resolve(web, 'public', archivePath), 'utf8');
const verifiers = await readFile(resolve(projectRoot, 'config/demo-accounts.json'), 'utf8');
const guardCss = index.match(/<style>\s*html\[data-auth-pending\][\s\S]*?<\/style>/)?.[0];
const logoutButton = index.match(/<button class="auth-logout"[\s\S]*?<\/button>/)?.[0];
if (!guardCss || !logoutButton) throw new Error('Missing shared demo auth markup');

await rm(output, { recursive:true, force:true });
await mkdir(output, { recursive:true });
await cp(resolve(web, 'src'), resolve(output, 'src'), { recursive:true });
await cp(resolve(web, 'public'), output, { recursive:true });
await writeFile(resolve(output, 'demo-accounts.json'), verifiers);
await writeFile(resolve(output, '.nojekyll'), '');

function writePage(path, html, route) {
  const prefix = relative(dirname(resolve(output, path)), output).replaceAll('\\', '/') || '.';
  const bootstrap = `<script src="${prefix}/src/static-auth.js" data-demo-route="${route}"></script>`;
  const page = html.replace(/\b(src|href|action)="\/(?!\/)/g, `$1="${prefix}/`);
  return writeFile(resolve(output, path), page.replace('</head>', `${bootstrap}</head>`));
}

const guardedArchive = archive
  .replace('<html lang="zh-CN">', '<html lang="zh-CN" data-auth-pending>')
  .replace('</head>', `${guardCss}<link rel="stylesheet" href="/src/styles/auth-session.css"></head>`)
  .replace(/<body\b[^>]*>/, '$&<div id="auth-status" role="status">正在检查登录状态…</div>')
  .replace('<div class="profile">', `${logoutButton}<div class="profile">`);

await Promise.all([
  writePage('index.html', index, 'workspace'),
  writePage('login.html', login, 'login'),
  writePage(archivePath, guardedArchive, 'workspace'),
  rewriteAsset('src/features/project-assets/model.js', /url:'\/assets\//g, "url:'./assets/"),
  rewriteAsset('src/features/demo-guide/demo-guide.js', /'\/content\//g, "'./content/"),
  rewriteAsset('src/features/research-flow/page.js', /'\/archives\/workflow-v2\//g, "'./archives/workflow-v2/"),
  rewriteAsset('content/demo-guide.md', /\/content\//g, './content/'),
]);
console.log(`Built: ${output}`);

async function rewriteAsset(path, pattern, replacement) {
  const file = resolve(output, path);
  const text = await readFile(file, 'utf8');
  await writeFile(file, text.replace(pattern, replacement));
}
