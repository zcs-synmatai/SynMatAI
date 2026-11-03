import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import vm from 'node:vm';
import {createDevServer} from './dev-server.mjs';
const archive=new URL('../apps/web/public/archives/workflow-v2/',import.meta.url);
test('frozen workflow V2 retains every file recorded in its integrity manifest',async()=>{
 const manifest=JSON.parse(await readFile(new URL('manifest.json',archive),'utf8'));assert.equal(manifest.name,'工作流程V2');assert.ok(Object.keys(manifest.files).length>40);
 for(const [name,hash] of Object.entries(manifest.files)){const bytes=await readFile(new URL(name,archive));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,`Frozen V2 changed: ${name}`)}
 const entry=await readFile(new URL('index.html',archive),'utf8');assert.match(entry,/archives\/workflow-v2\/src\/features\/research-flow\/page.js/);assert.match(entry,/data-nav="流程V3"/);assert.match(entry,/工作流程V2/);
});
test('V2 storage is seeded once and neither version overwrites the other',async()=>{
 const values=new Map([['synmat-flow-edits-v1','original'],['unrelated','private']]);const storage={get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const code=await readFile(new URL('../apps/web/src/workflow-version-storage.js',import.meta.url),'utf8'),api=vm.runInNewContext(code+'\nFlowVersionStorage',{localStorage:storage});
 assert.equal(api.v2.getItem('synmat-flow-edits-v1'),'original');assert.equal(api.v2.getItem('unrelated'),null);storage.setItem('synmat-flow-edits-v1','v3 edit');api.seedV2();assert.equal(api.v2.getItem('synmat-flow-edits-v1'),'original');api.v2.setItem('synmat-flow-edits-v1','v2 edit');assert.equal(storage.getItem('synmat-flow-edits-v1'),'v3 edit');api.v2.removeItem('synmat-flow-edits-v1');assert.equal(storage.getItem('synmat-flow-edits-v1'),'v3 edit');
});
test('V2 backup, frozen dependencies and V3 entry are served together',async t=>{
 const server=createDevServer();server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r)}));const base=`http://127.0.0.1:${server.address().port}`;
 const active=await(await fetch(base)).text();assert.match(active,/data-nav="流程V3"/);assert.match(active,/data-nav="工作流程V2"/);
 for(const path of ['/archives/workflow-v2/index.html','/archives/workflow-v2/src/features/research-flow/page.js','/archives/workflow-v2/src/styles/main.css','/archives/workflow-v2/src/workflow-version-storage.js','/archives/workflow-v2/assets/brand/synmatai-logo.png'])assert.equal((await fetch(base+path)).status,200,path);
 const frozen=await(await fetch(base+'/archives/workflow-v2/src/features/research-flow/page.js')).text();assert.match(frozen,/WorkflowV2Storage.getItem/);assert.doesNotMatch(frozen,/\blocalStorage\b/);
});
