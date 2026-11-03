import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { projectRoot } from './dev-server.mjs';
const web = resolve(projectRoot, 'apps/web');
const html = await readFile(resolve(web,'index.html'),'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map(m=>m[1]).filter(p=>!p.startsWith('data:')&&!p.startsWith('http'));
for (const ref of refs) {
  const path = ref.startsWith('/assets/') ? resolve(web,'public',ref.slice(1)) : resolve(web,ref.replace(/^\//,''));
  assert((await stat(path)).isFile(), `Missing asset: ${ref}`);
  if (path.endsWith('.js')) {
    const result = spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  }
}
const css = resolve(web,'src/styles/main.css');
for (const match of (await readFile(css,'utf8')).matchAll(/@import url\("([^"]+)"\)/g)) assert((await stat(resolve(dirname(css),match[1]))).isFile());
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate static IDs');
console.log('Checks passed: entry links, stylesheet imports, script syntax, unique static IDs.');
