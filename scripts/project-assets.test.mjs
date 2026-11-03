import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../apps/web/src/features/project-assets/',import.meta.url);
const [source,model]=await Promise.all(['source-content.js','model.js'].map(n=>readFile(new URL(n,root),'utf8')));
const {M,src}=vm.runInNewContext(source+'\n'+model+'\n({M:ProjectAssetModel,src:AssetSourceContent})');
test('asset source remains candidate design; confirmation exists only in independent snapshot',()=>{
 const s=M.seed(src),f=s.files.find(f=>f.id==='sop');assert.equal(s.files.length,10);assert.match(src['sop.md'],/候选设计/);assert.match(src['sop.md'],/不含实测结果/);assert.equal(f.adoptions[0].version,'v1.0');assert.equal(s.files.find(f=>f.id==='r3').delivery.status,'未提交');
});
test('draft, pinned confirmation and task adoption are independent even when a newer draft arrives',()=>{
 const s=M.seed(src),f=s.files[0],original=f.versions[0].text;
 const v=M.draft(f,original+'\n变更一','修改','member');M.submit(f,v.id,'member');M.draft(f,original+'\n变更二','第二次修改','owner');M.confirm(f,'v1.1','owner');
 assert.equal(M.latest(f).id,'v1.2');assert.equal(M.latest(f).status,'草稿');assert.equal(f.versions[1].status,'已确认');assert.equal(f.adoptions[0].version,'v1.0');assert.equal(f.versions[0].text,original);
 const p=M.adoptionDraft(s,f,'v1.1','T22','member');assert.equal(f.adoptions[0].version,'v1.0');assert.throws(()=>M.applyChange(s,p.id,'member'),/负责人/);M.applyChange(s,p.id,'owner');assert.equal(f.adoptions[0].version,'v1.1');assert.throws(()=>M.applyChange(s,p.id,'owner'),/已处理/);
});
test('permissions protect editing and confirming; ordinary files do not gain approval requirements',()=>{
 const s=M.seed(src),f=s.files[0];assert.throws(()=>M.draft(f,'x','x','reader'),/只读/);const v=M.draft(f,'x','x','owner');M.submit(f,v.id,'member');assert.throws(()=>M.confirm(f,v.id,'member'),/负责人/);assert.throws(()=>M.submit(s.files[4],'v1.0','owner'),/仅可提交/);
});
test('combined filters find S2 R3 data, without replicating assets or searching unsupported bodies',()=>{
 const s=M.seed(src),found=M.filter(s,{stage:'S2',route:'R3',text:'沸水'});assert.ok(found.some(f=>f.id==='r3'));assert.equal(new Set(found.map(f=>f.id)).size,found.length);const x=s.files.find(f=>f.id==='docx');x.versions[0].text='不应被搜索的Office正文';assert.equal(M.filter(s,{text:'不应被搜索的Office正文'}).length,0);assert.equal(M.filter(s,{text:'不存在的资料123'}).length,0);
});
test('recycle preserves identity and versions; fixed references and delivered reports cannot disappear',()=>{
 const s=M.seed(src);assert.throws(()=>M.remove(s,'sop','owner'),/固定引用/);assert.throws(()=>M.remove(s,'r3','owner'),/固定引用/);const f=s.files.find(f=>f.id==='notes');M.remove(s,'notes','owner');assert.equal(s.recycle[0].id,f.id);assert.equal(s.recycle[0].versions[0].text,f.versions[0].text);assert.ok(!s.files.some(f=>f.id==='notes'));
});
test('content comparison displays actual changed lines',()=>{
 const d=M.diff('保留\n旧说明','保留\n新说明');assert.equal(d.unchanged,1);assert.equal(d.removed[0],'旧说明');assert.equal(d.added[0],'新说明');
});
