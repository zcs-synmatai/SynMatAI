import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import { createDevServer } from './dev-server.mjs';

test('development server serves the migrated app and limits exposed files', async t => {
  const server = createDevServer(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const entry = await fetch(base);
  assert.equal(entry.status,200); assert.match(await entry.text(),/src\/styles\/main.css/);
  const css = await fetch(base+'/src/styles/main.css');
  assert.equal(css.status,200); assert.match(css.headers.get('content-type'),/text\/css/);
  const logo = await fetch(base+'/assets/brand/synmatai-logo.png');
  assert.equal(logo.status,200); assert.equal(logo.headers.get('content-type'),'image/png');
  assert.equal((await fetch(base+'/src/features/workflow/workbench.js')).status,200);
  assert.equal((await fetch(base+'/package.json')).status,404);
  assert.equal((await fetch(base+'/.env')).status,400);
  assert.equal((await fetch(base+'/missing')).status,404);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  const head = await fetch(base,{method:'HEAD'});
  assert.equal(head.status,200); assert.equal(await head.text(),'');
  const traversal = await new Promise((resolve,reject) => {
    const req = request(base,{path:'/src/%2e%2e%5c%2e%2e%5cpackage.json'},res=>{res.resume();resolve(res.statusCode);});
    req.on('error',reject);req.end();
  });
  assert.equal(traversal,400);
});
