import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const model=readFileSync(new URL('../apps/web/src/features/experiments/model.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../apps/web/src/features/workflow/task-experiments.js',import.meta.url),'utf8');
function setup(){return vm.runInNewContext(model+'\nconst state=ExperimentModel.seed();const ExperimentStore={get:()=>state,getError:()=>""};const window={};\n'+panel+'\n({panel:window.TaskExperimentPanel,state,model:ExperimentModel})',{Date,JSON,Set})}
test('task experiment panel scopes by phase and substage without duplicating experiments',()=>{
 const {panel,state}=setup();const rows=panel.entries('研发','路线筛选');
 assert.equal(rows.length,8);assert.ok(rows.every(e=>e.stage==='S2'&&state.experiments.includes(e)));
 assert.equal(panel.entries('研发','实施条件验证').length,6);
 assert.equal(panel.entries('项目立项','').length,0);assert.equal(panel.entries('量产','量产').length,0);
});
test('task panel reflects shared status changes and combines search with status filter',()=>{
 const {panel,state}=setup();const e=state.experiments.find(e=>e.stage==='S2'&&e.route==='R3');e.status='执行中';
 const html=panel.render('研发','路线筛选','R3','执行中');assert.ok(html.includes(e.id));assert.ok(html.includes('1 / 8 项实验'));
 assert.ok(!html.includes('data-task-experiment="EXP-007"'));
 const none=panel.render('研发','路线筛选','unmatched','');assert.ok(none.includes('没有匹配的实验'));assert.ok(!none.includes('data-task-experiment='));
});
test('future stages show plan gaps and never create placeholder experiments',()=>{
 const {panel,state}=setup(),before=JSON.stringify(state);
 const html=panel.render('研发','耐候与老化');assert.ok(html.includes('实验条件待明确'));assert.ok(!html.includes('data-task-experiment='));
 assert.equal(JSON.stringify(state),before);
});
