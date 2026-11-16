import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const thermalCode = await readFile(new URL('../apps/web/src/features/research-flow/data-thermal-gel.js', import.meta.url), 'utf8');
const selectorCode = await readFile(new URL('../apps/web/src/features/research-flow/data.js', import.meta.url), 'utf8');
const data = vm.runInNewContext(thermalCode + '\nconst legacyCoatingFlowData=thermalGelFlowData;\n' + selectorCode + '\nJSON.parse(JSON.stringify(researchFlowData))');

test('thermal gel plan preserves seven stages and exactly 18 authoritative business tasks', () => {
  assert.equal(data.stages.length, 7);
  assert.equal(data.tasks.length, 18);
  assert.equal(new Set(data.tasks.map(t => t.id)).size, 18);
  assert.deepEqual(Array.from(data.stages, s => data.tasks.filter(t => t.stage === s.id).length), [2, 2, 3, 3, 3, 2, 3]);
  for (const task of data.tasks) {
    assert.equal(task.method, '人工');
    assert.ok(task.scope && task.input && task.condition && task.role);
    assert.ok(data.workflow.includes(task.id + ' ' + task.name));
    assert.ok(task.deliverables.length > 0);
  }
});

test('parallel thermal and reliability evidence converge at the stage review', () => {
  for (const [stage, edges] of Object.entries(data.edges)) {
    for (const [from, to] of edges) {
      assert.ok(data.stages.findIndex(s => s.id === data.tasks.find(t => t.id === from)?.stage) <= data.stages.findIndex(s => s.id === stage));
      assert.equal(data.tasks.find(t => t.id === to)?.stage, stage);
    }
  }
  const has = (a, b) => data.edges.S4.some(e => e[0] === a && e[1] === b);
  assert.ok(has('T40', 'T42') && has('T41', 'T42'));
  assert.ok(!has('T40', 'T41') && !has('T41', 'T40'));
  assert.equal(data.tasks.find(t => t.id === 'T40').taskType, '计算模拟');
  assert.equal(data.tasks.find(t => t.id === 'T41').taskType, '实验');
});

test('reference information is inspectable without introducing phantom tasks', () => {
  assert.equal(data.routes.length, 4);
  assert.equal(data.ops.length, 7);
  assert.equal(data.questions.length, 13);
  for (const op of data.ops) assert.ok(op.excerpt.trim().startsWith('#'));
  assert.ok(data.tasks.every(t => /^T\d{2}$/.test(t.id)));
  assert.ok(data.visual.includes(data.sourceHash.toUpperCase()));
});
