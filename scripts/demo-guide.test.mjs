import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('global demo guide is loaded by the app and uses hierarchical markdown contexts',async()=>{
 const [html,script,styles,content,research,hierarchy]=await Promise.all([
  read('apps/web/index.html'),read('apps/web/src/features/demo-guide/demo-guide.js'),read('apps/web/src/styles/demo-guide.css'),read('apps/web/public/content/demo-guide.md'),read('apps/web/src/features/workflow/research.js'),read('apps/web/src/features/research-flow/hierarchy-view.js')
 ]);
 assert.match(html,/demo-guide\.css/);
 assert.match(html,/features\/demo-guide\/demo-guide\.js/);
 assert.match(script,/fetch\(contentUrl/);
 assert.match(script,/synmat:project-registry-updated/);
 assert.match(script,/synmat:open-flow-task/);
 assert.match(script,/scope:'workbench'/);
 assert.match(script,/scope:'flow-stage'/);
 assert.match(script,/scope:'flow-package'/);
 assert.match(script,/current\.scope==='workbench'/);
 assert.match(script,/entry\.scope!==current\.scope\)return -1/);
 assert.match(script,/project==='\*'\?0:200/);
 assert.match(script,/raw\.trim\(\)==='---'/);
 assert.match(script,/function observeHistory\(\)/);
 assert.match(script,/\['pushState','replaceState'\]/);
 assert.match(script,/synmat:route-changed/);
 assert.match(script,/\['synmat:route-changed','hashchange','popstate'\]/);
 assert.match(research,/synmat:demo-guide-context/);
 assert.match(research,/demoPackageId/);
 assert.match(research,/demoTodoId/);
 assert.match(hierarchy,/guideStageId/);
 assert.match(hierarchy,/guidePackage/);
 assert.match(script,/pointerdown/);
 assert.match(script,/synmat-demo-guide-position-v1/);
 assert.match(script,/synmat-demo-guide-minimized-v1/);
 assert.match(script,/<strong>演示说明<\/strong>/);
 assert.match(script,/正式环境会有新手引导。/);
 assert.match(script,/class="demo-guide__context-title" data-guide-title/);
 assert.doesNotMatch(script,/data-guide-scope/);
 assert.doesNotMatch(script,/编辑提示内容|demo-guide__edit/);
 assert.match(script,/label:'任务工作台'/);
 assert.doesNotMatch(script,/label:'任务工作台 · '/);
 assert.match(styles,/\.demo-guide\.is-minimized/);
 for(const id of ['page-projects','page-overview','page-experiments','page-assets','workbench-T11-TODO-001','workbench-T21-TODO-001','workbench-T31-TODO-001','workbench-T40-TODO-001','workbench-default','flow-global','flow-stage-S1','flow-stage-S2','flow-stage-S4','flow-package-default','default'])assert.match(content,new RegExp(`## \\[${id}\\]`));
 assert.match(content,/scope: workbench\s+key: T21-TODO-001/);
 assert.match(content,/scope: workbench\s+key: T40-TODO-001/);
 assert.doesNotMatch(content,/scope: workbench\s+key: [^\n]*-\*/);
 assert.match(content,/scope: flow-stage\s+key: S1/);
 assert.match(content,/scope: flow-package\s+key: \*/);
 assert.match(content,/image: \/content\/demo-guide-/);
});

test('every guide entry provides labeled steps for the diagram',async()=>{
 const [script,content]=await Promise.all([
  read('apps/web/src/features/demo-guide/demo-guide.js'),read('apps/web/public/content/demo-guide.md')
 ]);
 const entries=runInNewContext(`${script}\nDemoGuide.parse(content)`,{
  content,document:{readyState:'loading',addEventListener(){}}
 });
 for(const entry of entries){
  assert.equal(entry.steps?.split('|').filter(step=>step.trim()).length,3,entry.id);
 }
 const basics=entries.find(entry=>entry.id==='workbench-P1T1-TODO-001');
 assert.match(basics.steps,/提供需求与约束.*Agent 整理草稿.*确认项目基础信息/);
});
