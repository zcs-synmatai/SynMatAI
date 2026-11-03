import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {projectRoot} from './dev-server.mjs';

const modelPath=resolve(projectRoot,'apps/web/src/features/projects/model.js');

function runtime(){
 const protectedProject={id:'demo-coating',name:'示例项目',protected:true,updatedAt:'2026-10-01T00:00:00Z'};
 const removableProject={id:'project-delete',name:'待删除项目',protected:false,updatedAt:'2026-11-01T00:00:00Z'};
 const registryKey='synmat-project-registry-v1',bankKey='synmat-project-data-v1';
 const stored=new Map([
  [registryKey,JSON.stringify({schema:1,activeProjectId:removableProject.id,projects:[protectedProject,removableProject]})],
  [bankKey,JSON.stringify({[protectedProject.id]:{'synmat-research':'{}'},[removableProject.id]:{'synmat-project-schema-v1':'{}'}})],
  ['synmat-project-schema-v1','{}']
 ]),events=[];
 const localStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value)),removeItem:key=>stored.delete(key)};
 const sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
 class CustomEvent{constructor(type,options={}){this.type=type;this.detail=options.detail}}
 const document={dispatchEvent:event=>events.push(event),querySelectorAll:()=>[],querySelector:()=>null,title:''};
 const location={pathname:'/',search:'',replace(){},reload(){}};
 const context={localStorage,sessionStorage,CustomEvent,document,location,console};context.window=context;
 vm.createContext(context);return {context,stored,events,registryKey,bankKey};
}

test('deleting the active project removes its data and switches to a remaining project',async()=>{
 const r=runtime();vm.runInContext(await readFile(modelPath,'utf8'),r.context);const store=vm.runInContext('ProjectStore',r.context);
 const result=store.remove('project-delete');
 assert.equal(result.wasActive,true);assert.equal(result.activeProject.id,'demo-coating');
 const registry=JSON.parse(r.stored.get(r.registryKey)),bank=JSON.parse(r.stored.get(r.bankKey));
 assert.equal(registry.activeProjectId,'demo-coating');assert.equal(registry.projects.length,1);assert.equal(bank['project-delete'],undefined);
 assert(r.events.some(event=>event.type==='synmat:project-removed'));
 assert.throws(()=>store.remove('demo-coating'),/不可删除/);
});

test('project list exposes a protected delete action and confirmation copy',async()=>{
 const page=await readFile(resolve(projectRoot,'apps/web/src/features/projects/page.js'),'utf8');
 assert.match(page,/data-project-action="delete"/);assert.match(page,/项目的流程、Agent 对话、项目 Schema、任务资产和本地演示进度/);
 assert.match(page,/project\.protected\?'disabled'/);assert.match(page,/ProjectStore\.remove\(project\.id\)/);
});
